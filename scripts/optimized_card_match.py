import sqlite3
import os
import time
import cv2
import numpy as np
import concurrent.futures
import argparse
import threading
from contextlib import contextmanager

# Database path
DB_PATH = r'x:\Document\PokemonDBDownload\pokemon_cards.db'

# Connection pool size
POOL_SIZE = 5

# Create a connection pool with thread safety
class ConnectionPool:
    def __init__(self, db_path, max_connections=5):
        self.db_path = db_path
        self.max_connections = max_connections
        self.connections = []
        self.in_use = set()
        self.lock = threading.Lock()
    
    @contextmanager
    def get_connection(self):
        connection = self._get_connection()
        try:
            yield connection
        finally:
            self._return_connection(connection)
    
    def _get_connection(self):
        with self.lock:
            # Always create a new connection for thread safety
            connection = sqlite3.connect(self.db_path, check_same_thread=False)
            connection.execute('PRAGMA journal_mode = WAL')
            connection.execute('PRAGMA synchronous = NORMAL')
            connection.execute('PRAGMA cache_size = 5000')
            connection.execute('PRAGMA temp_store = MEMORY')
            connection.row_factory = sqlite3.Row
            
            self.connections.append(connection)
            self.in_use.add(connection)
            return connection
    
    def _return_connection(self, connection):
        with self.lock:
            if connection in self.in_use:
                self.in_use.remove(connection)
                # Close connection immediately to avoid thread issues
                if connection not in self.in_use:
                    try:
                        connection.close()
                    except sqlite3.ProgrammingError:
                        # Ignore errors if connection was created in another thread
                        pass
                    self.connections.remove(connection)
    
    def close_all(self):
        with self.lock:
            for connection in list(self.connections):
                if connection not in self.in_use:
                    try:
                        connection.close()
                    except sqlite3.ProgrammingError:
                        # Ignore errors if connection was created in another thread
                        pass
            self.connections = [conn for conn in self.connections if conn in self.in_use]

# Create a global connection pool
connection_pool = ConnectionPool(DB_PATH, POOL_SIZE)

def load_reference_images(ref_dir):
    """Load all reference images from the specified directory with database metadata."""
    ref_images = {}
    
    # Create ORB detector once
    orb = cv2.ORB_create()
    
    print(f"\n🔍 Scanning reference directory: {ref_dir}")
    
    # Get card metadata from database
    with connection_pool.get_connection() as conn:
        cursor = conn.cursor()
        # Prepare statement once
        cursor.execute("""
            SELECT id, name, expansion, number, attribute, card_type, image_url 
            FROM card_csv 
            WHERE image_url IS NOT NULL
        """)
        
        card_metadata = {}
        for row in cursor.fetchall():
            card_id = row['id']
            card_metadata[card_id] = dict(row)
    
    # Process image files
    for root, dirs, files in os.walk(ref_dir):
        print(f"📁 {os.path.relpath(root, ref_dir) or 'Main directory'}: {len(files)} files")
        
        # Process files in batches for better performance
        batch_size = 50
        for i in range(0, len(files), batch_size):
            batch_files = files[i:i+batch_size]
            
            for filename in batch_files:
                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, ref_dir)
                
                try:
                    with open(filepath, 'rb') as f:
                        img_bytes = f.read()
                    
                    img = cv2.imdecode(np.frombuffer(img_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
                    if img is None:
                        continue
                    
                    # Compute features once and store them
                    keypoints, descriptors = orb.detectAndCompute(img, None)
                    if descriptors is None:
                        continue
                    
                    # Store image data with descriptors
                    ref_images[rel_path] = {
                        'image': img,
                        'keypoints': keypoints,
                        'descriptors': descriptors,
                        'metadata': None  # Will be filled if we can match to database
                    }
                    
                    # Try to match filename with card metadata
                    for card_id, metadata in card_metadata.items():
                        if metadata['name'] in filename or str(card_id) in filename:
                            ref_images[rel_path]['metadata'] = metadata
                            break
                    
                except Exception as e:
                    print(f"Error processing {rel_path}: {str(e)}")
    
    print(f"\nTotal valid reference images: {len(ref_images)}")
    return ref_images

def detect_and_compute_features(img, orb):
    """Detect keypoints and compute descriptors for an image."""
    return orb.detectAndCompute(img, None)

def match_features(des1, des2, matcher):
    """Match descriptors between two images and return the number of good matches."""
    if des1 is None or des2 is None or len(des1) < 2 or len(des2) < 2:
        return 0
    
    try:
        matches = matcher.knnMatch(des1, des2, k=2)
        # Apply Lowe's ratio test
        good_matches = [m for m, n in matches if m.distance < 0.75 * n.distance]
        return len(good_matches)
    except cv2.error:
        # Handle case where descriptors don't match properly
        return 0

def process_single_card(card_img, ref_images, orb, matcher):
    """Process a single card image through the matching pipeline."""
    test_kp, test_des = detect_and_compute_features(card_img, orb)
    if test_des is None:
        return []
    
    matches = []
    # Process in batches for better performance
    batch_size = 20
    ref_items = list(ref_images.items())
    
    for i in range(0, len(ref_items), batch_size):
        batch = ref_items[i:i+batch_size]
        batch_matches = []
        
        for filename, ref_data in batch:
            ref_des = ref_data['descriptors']
            num_matches = match_features(test_des, ref_des, matcher)
            if num_matches > 0:  # Only add if there are matches
                batch_matches.append((filename, num_matches, ref_data.get('metadata')))
        
        # Sort batch by match count and keep only top matches
        batch_matches.sort(key=lambda x: x[1], reverse=True)
        matches.extend(batch_matches[:5])
    
    # Final sort of all batches
    matches.sort(key=lambda x: x[1], reverse=True)
    return matches[:10]  # Return top 10 overall

def recognize_pokemon_card(test_image_path, ref_dir, output_dir=None):
    """Recognize a Pokémon card by comparing it to reference images."""
    start_time = time.time()
    
    # Initialize ORB detector and matcher
    orb = cv2.ORB_create(nfeatures=1000)
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    # Load test image
    with open(test_image_path, 'rb') as f:
        test_bytes = f.read()
    test_img = cv2.imdecode(np.frombuffer(test_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if test_img is None:
        return "Error: Could not load test image."

    # Load reference images (with caching)
    ref_images = load_reference_images(ref_dir)
    if not ref_images:
        return "Error: No reference images found."

    # Process the card
    matches = process_single_card(test_img, ref_images, orb, matcher)
    
    # Format results
    if not matches:
        return "No clear match found."

    # Format multiple results
    results = []
    for i, (filename, score, metadata) in enumerate(matches[:5], 1):
        card_name = os.path.splitext(filename)[0]
        metadata_str = ""
        if metadata:
            metadata_str = f" - {metadata['name']} ({metadata['expansion']}/{metadata['number']})"
        results.append(f"{i}. {card_name}{metadata_str} ({score} matches)")
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    return {"matches": results, "processing_time": processing_time}

def batch_process_cards(image_paths, ref_dir, max_workers=4):
    """Process multiple card images in parallel."""
    results = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_path = {executor.submit(recognize_pokemon_card, path, ref_dir): path for path in image_paths}
        
        for future in concurrent.futures.as_completed(future_to_path):
            path = future_to_path[future]
            try:
                result = future.result()
                results[path] = result
            except Exception as e:
                results[path] = f"Error: {str(e)}"
    
    return results

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='Pokemon Card Recognition Tool')
    parser.add_argument('--test_dir', type=str, help='Directory containing test images to process')
    parser.add_argument('--ref_dir', type=str, help='Directory containing reference card images')
    parser.add_argument('--output_dir', type=str, help='Directory to save output results (optional)')
    
    # Parse arguments and normalize path separators
    args = parser.parse_args()
    return args

def main():
    # Parse command-line arguments
    args = parse_arguments()
    
    # Get current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    # Set default directories if not provided
    ref_dir = args.ref_dir if args.ref_dir else os.path.join(script_dir, "card_images")
    test_dir = args.test_dir if args.test_dir else os.path.join(parent_dir, "test_images")
    output_dir = args.output_dir
    
    # Handle relative paths properly
    if ref_dir and not os.path.isabs(ref_dir):
        # Special handling for paths with parent directory references
        if ref_dir.startswith('..') or '\\..\\' in ref_dir or '/../' in ref_dir:
            # For paths with parent directory references, resolve from script directory
            ref_dir = os.path.normpath(os.path.join(script_dir, ref_dir))
        else:
            # For simple relative paths, just join with script directory
            ref_dir = os.path.normpath(os.path.join(script_dir, ref_dir))
    
    if test_dir and not os.path.isabs(test_dir):
        # Special handling for paths with parent directory references
        if test_dir.startswith('..') or '\\..\\' in test_dir or '/../' in test_dir:
            # For paths with parent directory references, resolve from script directory
            test_dir = os.path.normpath(os.path.join(script_dir, test_dir))
        else:
            # For simple relative paths, just join with script directory
            test_dir = os.path.normpath(os.path.join(script_dir, test_dir))
    
    if output_dir and not os.path.isabs(output_dir):
        # Special handling for paths with parent directory references
        if output_dir.startswith('..') or '\\..\\' in output_dir or '/../' in output_dir:
            # For paths with parent directory references, resolve from script directory
            output_dir = os.path.normpath(os.path.join(script_dir, output_dir))
        else:
            # For simple relative paths, just join with script directory
            output_dir = os.path.normpath(os.path.join(script_dir, output_dir))
    
    # Debug output to show resolved paths
    print(f"\n🔍 Resolved paths:")
    print(f"  Script directory: {script_dir}")
    print(f"  Parent directory: {parent_dir}")
    print(f"  Test directory: {test_dir}")
    print(f"  Reference directory: {ref_dir}")
    if output_dir:
        print(f"  Output directory: {output_dir}")
    
    print(f"\n📂 Test directory: {test_dir}")
    print(f"📂 Reference directory: {ref_dir}")
    if output_dir:
        print(f"📂 Output directory: {output_dir}")
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    # Validate directories
    if not os.path.exists(ref_dir):
        print(f"❌ Reference directory not found: {ref_dir}")
        return
    
    if not os.path.exists(test_dir):
        print(f"❌ Test directory not found: {test_dir}")
        return
    
    # Get all test images with detailed logging
    test_images = []
    image_extensions = ('.jpg', '.jpeg', '.png')
    print(f"\n🔍 Scanning for images in: {test_dir}")
    
    # List all files in the test directory to help debug
    all_files = []
    for root, dirs, files in os.walk(test_dir):
        rel_path = os.path.relpath(root, test_dir)
        if rel_path == '.':
            rel_path = ''
        print(f"  📁 {rel_path or 'Root directory'}: {len(files)} files")
        
        for file in files:
            file_path = os.path.join(root, file)
            all_files.append(file_path)
            if file.lower().endswith(image_extensions):
                test_images.append(file_path)
                print(f"    ✅ Found image: {file}")
    
    if not test_images:
        print("\n❌ No test images found in directory. Found these files instead:")
        for file in all_files[:10]:  # Show first 10 files
            print(f"  - {os.path.basename(file)}")
        if len(all_files) > 10:
            print(f"  ... and {len(all_files) - 10} more files")
        print("\nPlease check that the directory contains image files with .jpg, .jpeg, or .png extensions.")
        return
    
    print(f"\n✅ Found {len(test_images)} test images.")
    
    # Process in batch
    results = batch_process_cards(test_images, ref_dir)
    
    # Print results
    for path, result in results.items():
        print(f"\nResults for {os.path.basename(path)}:")
        if isinstance(result, dict):
            print(f"Processing time: {result['processing_time']:.2f} seconds")
            for match in result['matches']:
                print(match)
        else:
            print(result)
    
    # Close all database connections
    try:
        connection_pool.close_all()
    except Exception as e:
        print(f"Warning: Error closing database connections: {str(e)}")
        # Continue execution even if there's an error closing connections

if __name__ == "__main__":
    main()