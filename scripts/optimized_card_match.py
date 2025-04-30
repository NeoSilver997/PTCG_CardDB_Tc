import sqlite3
import os
import time
import cv2
import numpy as np
import concurrent.futures
import argparse
import threading
import json
import hashlib
import pickle
from contextlib import contextmanager
from pathlib import Path

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

def get_folder_signature(folder_path, image_files):
    """Generate a signature for a folder based on file modification times and sizes.
    
    Args:
        folder_path: Path to the folder
        image_files: List of image files in the folder
        
    Returns:
        A hash string representing the folder's current state
    """
    # For performance, we can also create signatures for individual subfolders
    if not image_files:
        return None
        
    # Sort files for consistent ordering
    sorted_files = sorted(image_files)
    
    # Collect modification times and sizes
    file_stats = []
    for file_path in sorted_files:
        try:
            stats = os.stat(file_path)
            file_stats.append((file_path, stats.st_mtime, stats.st_size))
        except OSError:
            # If we can't get stats, include a placeholder
            file_stats.append((file_path, 0, 0))
    
    # Create a string representation and hash it
    signature_str = json.dumps(file_stats)
    return hashlib.md5(signature_str.encode('utf-8')).hexdigest()

def get_cache_path(ref_dir):
    """Get the path to the cache file for a reference directory.
    
    Args:
        ref_dir: Directory containing reference card images
        
    Returns:
        Path to the cache file
    """
    # Ensure we have an absolute path for consistent cache naming
    # Create cache directory if it doesn't exist
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
    os.makedirs(cache_dir, exist_ok=True)
    
    # Create a unique filename based on the reference directory path
    ref_dir_hash = hashlib.md5(os.path.abspath(ref_dir).encode('utf-8')).hexdigest()
    return os.path.join(cache_dir, f"ref_cache_{ref_dir_hash}.pkl")

def keypoint_to_dict(keypoint):
    """Convert a cv2.KeyPoint object to a serializable dictionary.
    
    Args:
        keypoint: cv2.KeyPoint object
        
    Returns:
        Dictionary with KeyPoint attributes
    """
    return {
        'pt': (keypoint.pt[0], keypoint.pt[1]),
        'size': keypoint.size,
        'angle': keypoint.angle,
        'response': keypoint.response,
        'octave': keypoint.octave,
        'class_id': keypoint.class_id
    }

def dict_to_keypoint(keypoint_dict):
    """Convert a dictionary back to a cv2.KeyPoint object.
    
    Args:
        keypoint_dict: Dictionary with KeyPoint attributes
        
    Returns:
        cv2.KeyPoint object
    """
    return cv2.KeyPoint(
        x=keypoint_dict['pt'][0],
        y=keypoint_dict['pt'][1],
        size=keypoint_dict['size'],
        angle=keypoint_dict['angle'],
        response=keypoint_dict['response'],
        octave=keypoint_dict['octave'],
        class_id=keypoint_dict['class_id']
    )

def prepare_cache_data(cache_data):
    """Prepare cache data for serialization by converting KeyPoint objects.
    
    Args:
        cache_data: Dictionary containing cache data with KeyPoint objects
        
    Returns:
        Dictionary with KeyPoint objects converted to serializable dictionaries
    """
    serializable_data = cache_data.copy()
    
    # Process images dictionary
    if 'images' in serializable_data:
        for img_path, img_data in serializable_data['images'].items():
            if 'keypoints' in img_data and img_data['keypoints'] is not None:
                # Check if keypoints are already dictionaries or KeyPoint objects
                if img_data['keypoints'] and hasattr(img_data['keypoints'][0], 'pt'):
                    img_data['keypoints'] = [keypoint_to_dict(kp) for kp in img_data['keypoints']]
    
    # Process images_by_folder dictionary
    if 'images_by_folder' in serializable_data:
        for folder, folder_images in serializable_data['images_by_folder'].items():
            for img_path, img_data in folder_images.items():
                if 'keypoints' in img_data and img_data['keypoints'] is not None:
                    # Check if keypoints are already dictionaries or KeyPoint objects
                    if img_data['keypoints'] and hasattr(img_data['keypoints'][0], 'pt'):
                        img_data['keypoints'] = [keypoint_to_dict(kp) for kp in img_data['keypoints']]
    
    return serializable_data

def restore_cache_data(serializable_data):
    """Restore cache data by converting serialized KeyPoint dictionaries back to KeyPoint objects.
    
    Args:
        serializable_data: Dictionary with serialized KeyPoint data
        
    Returns:
        Dictionary with KeyPoint dictionaries converted back to cv2.KeyPoint objects
    """
    cache_data = serializable_data.copy()
    
    # Process images dictionary
    if 'images' in cache_data:
        for img_path, img_data in cache_data['images'].items():
            if 'keypoints' in img_data and img_data['keypoints'] is not None:
                # Check if keypoints are already KeyPoint objects or dictionaries
                if img_data['keypoints'] and isinstance(img_data['keypoints'][0], dict) and 'pt' in img_data['keypoints'][0]:
                    img_data['keypoints'] = [dict_to_keypoint(kp_dict) for kp_dict in img_data['keypoints']]
    
    # Process images_by_folder dictionary
    if 'images_by_folder' in cache_data:
        for folder, folder_images in cache_data['images_by_folder'].items():
            for img_path, img_data in folder_images.items():
                if 'keypoints' in img_data and img_data['keypoints'] is not None:
                    # Check if keypoints are already KeyPoint objects or dictionaries
                    if img_data['keypoints'] and isinstance(img_data['keypoints'][0], dict) and 'pt' in img_data['keypoints'][0]:
                        img_data['keypoints'] = [dict_to_keypoint(kp_dict) for kp_dict in img_data['keypoints']]
    
    return cache_data

def save_cache(cache_path, cache_data):
    """Save cache data to disk.
    
    Args:
        cache_path: Path to save the cache file
        cache_data: Dictionary containing cache data
    """
    try:
        # Convert KeyPoint objects to serializable dictionaries
        serializable_data = prepare_cache_data(cache_data)
        
        with open(cache_path, 'wb') as f:
            pickle.dump(serializable_data, f)
        return True
    except Exception as e:
        print(f"⚠️ Warning: Could not save cache: {str(e)}")
        return False

def load_cache(cache_path):
    """Load cache data from disk.
    
    Args:
        cache_path: Path to the cache file
        
    Returns:
        Dictionary containing cache data, or None if cache is invalid
    """
    if not os.path.exists(cache_path):
        return None
        
    try:
        with open(cache_path, 'rb') as f:
            serializable_data = pickle.load(f)
        
        # Convert serialized KeyPoint dictionaries back to KeyPoint objects
        cache_data = restore_cache_data(serializable_data)
            
        # Check if cache has expired (older than 30 days)
        if 'timestamp' in cache_data:
            cache_age = time.time() - cache_data['timestamp']
            max_age = 30 * 24 * 60 * 60  # 30 days in seconds
            if cache_age > max_age:
                print(f"⚠️ Cache has expired (older than 30 days), regenerating...")
                return None
                
        return cache_data
    except Exception as e:
        print(f"⚠️ Warning: Could not load cache: {str(e)}")
        return None

def cleanup_old_caches(cache_dir=None, max_age_days=30, verbose=False):
    """Clean up old cache files to prevent disk space issues.
    
    Args:
        cache_dir: Directory containing cache files (default: script_dir/cache)
        max_age_days: Maximum age of cache files in days
        verbose: Whether to print detailed logs
    """
    if cache_dir is None:
        cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
        
    if not os.path.exists(cache_dir):
        return
        
    try:
        current_time = time.time()
        max_age_seconds = max_age_days * 24 * 60 * 60
        cache_files = [f for f in os.listdir(cache_dir) if f.startswith("ref_cache_") and f.endswith(".pkl")]
        
        if verbose:
            print(f"Checking {len(cache_files)} cache files for cleanup...")
            
        removed = 0
        for cache_file in cache_files:
            cache_path = os.path.join(cache_dir, cache_file)
            file_age = current_time - os.path.getmtime(cache_path)
            
            if file_age > max_age_seconds:
                if verbose:
                    print(f"Removing old cache file: {cache_file} (age: {file_age / 86400:.1f} days)")
                os.remove(cache_path)
                removed += 1
                
        if removed > 0 and verbose:
            print(f"Removed {removed} old cache files")
    except Exception as e:
        if verbose:
            print(f"Error during cache cleanup: {str(e)}")


def load_reference_images(ref_dir, verbose=False, use_cache=True):
    """Load all reference images from the specified directory with database metadata.
    
    Args:
        ref_dir: Directory containing reference card images
        verbose: Whether to print detailed logs
        use_cache: Whether to use cached features if available
        
    Returns:
        Dictionary of reference images with their features and metadata
    """
    start_time = time.time()
    ref_images = {}
    
    # Validate directory
    if not os.path.exists(ref_dir):
        print(f"❌ Reference directory not found: {ref_dir}")
        return {}
        
    if not os.path.isdir(ref_dir):
        print(f"❌ Not a directory: {ref_dir}")
        return {}
    
    # Find all image files
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff')
    image_files, all_files = find_image_files(ref_dir, image_extensions, verbose)
    
    if not image_files:
        print(f"❌ No image files found in reference directory: {ref_dir}")
        return {}
    
    # Check if we can use cache
    cache_path = get_cache_path(ref_dir)
    current_signature = get_folder_signature(ref_dir, image_files)
    
    if use_cache and os.path.exists(cache_path):
        cache_data = load_cache(cache_path)
        if cache_data and cache_data.get('signature') == current_signature:
            print(f"✅ Loading {len(cache_data['images'])} reference images from cache")
            return cache_data['images']
        elif cache_data and 'folder_signatures' in cache_data and 'images_by_folder' in cache_data:
            # Try to use partial cache for folders that haven't changed
            unchanged_folders = []
            changed_folders = []
            
            for folder, signature in folder_signatures.items():
                if folder in cache_data['folder_signatures'] and cache_data['folder_signatures'][folder] == signature:
                    unchanged_folders.append(folder)
                else:
                    changed_folders.append(folder)
            
            if unchanged_folders and verbose:
                print(f"🔄 Using partial cache for {len(unchanged_folders)} unchanged folders")
                print(f"🔄 Regenerating cache for {len(changed_folders)} changed folders")
                
            # Load cached images for unchanged folders
            for folder in unchanged_folders:
                if folder in cache_data['images_by_folder']:
                    for rel_path, img_data in cache_data['images_by_folder'][folder].items():
                        ref_images[rel_path] = img_data
        elif verbose:
            print("🔄 Cache exists but is outdated, regenerating...")
    
    # Create ORB detector once
    orb = cv2.ORB_create()
    
    print(f"\n🔍 Scanning reference directory: {ref_dir}")
    
    # Get card metadata from database
    try:
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
                
        print(f"✅ Loaded metadata for {len(card_metadata)} cards from database")
    except Exception as e:
        print(f"⚠️ Warning: Could not load card metadata from database: {str(e)}")
        print("   Continuing without metadata matching...")
        card_metadata = {}
    
    print(f"✅ Found {len(image_files)} potential reference images")
    
    # Process image files in batches
    batch_size = 50
    processed = 0
    skipped = 0
    
    # Group files by subdirectory for better organization and caching
    files_by_folder = {}
    folder_signatures = {}
    
    for filepath in image_files:
        folder = os.path.dirname(os.path.relpath(filepath, ref_dir))
        if folder not in files_by_folder:
            files_by_folder[folder] = []
        files_by_folder[folder].append(filepath)
    
    # Generate signatures for each subfolder
    for folder, folder_files in files_by_folder.items():
        folder_signatures[folder] = get_folder_signature(os.path.join(ref_dir, folder) if folder else ref_dir, folder_files)
    
    # Process each folder
    for folder, folder_files in files_by_folder.items():
        if verbose:
            print(f"\n📁 Processing folder: {folder or 'Root directory'} ({len(folder_files)} images)")
        
        # Process files in this folder in batches
        for i in range(0, len(folder_files), batch_size):
            batch_files = folder_files[i:i+batch_size]
            
            for filepath in batch_files:
                rel_path = os.path.relpath(filepath, ref_dir)
                filename = os.path.basename(filepath)
                
                try:
                    # Read image file as binary to handle special characters in paths
                    with open(filepath, 'rb') as f:
                        img_bytes = f.read()
                    
                    # Decode image using OpenCV
                    img = cv2.imdecode(np.frombuffer(img_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
                    if img is None:
                        if verbose:
                            print(f"⚠️ Could not decode image: {rel_path}")
                        skipped += 1
                        continue
                    
                    # Compute features
                    keypoints, descriptors = orb.detectAndCompute(img, None)
                    if descriptors is None or len(descriptors) < 2:
                        if verbose:
                            print(f"⚠️ Not enough features in image: {rel_path}")
                        skipped += 1
                        continue
                    
                    # Store image data with descriptors
                    ref_images[rel_path] = {
                        'image': img,
                        'keypoints': keypoints,
                        'descriptors': descriptors,
                        'metadata': None,  # Will be filled if we can match to database
                        'folder': folder    # Store folder information
                    }
                    
                    # Try to match filename with card metadata
                    for card_id, metadata in card_metadata.items():
                        if metadata['name'] in filename or str(card_id) in filename:
                            ref_images[rel_path]['metadata'] = metadata
                            break
                    
                    processed += 1
                    
                    # Show progress for large datasets
                    if processed % 100 == 0:
                        print(f"  Progress: {processed}/{len(image_files)} images processed")
                        
                except Exception as e:
                    print(f"⚠️ Error processing {rel_path}: {str(e)}")
                    skipped += 1
    
    print(f"\n✅ Successfully processed {processed} reference images ({skipped} skipped)")
    
    # Save to cache if we have processed images
    if processed > 0 and use_cache:
        # Organize images by folder for partial caching
        images_by_folder = {}
        for rel_path, img_data in ref_images.items():
            folder = img_data.get('folder', '')
            if folder not in images_by_folder:
                images_by_folder[folder] = {}
            images_by_folder[folder][rel_path] = img_data
            
        cache_data = {
            'signature': current_signature,
            'folder_signatures': folder_signatures,
            'images': ref_images,
            'images_by_folder': images_by_folder,
            'timestamp': time.time()
        }
        if save_cache(cache_path, cache_data):
            print(f"✅ Saved reference images to cache for faster future loading")
    
    end_time = time.time()
    print(f"⏱️ Reference images loaded in {end_time - start_time:.2f} seconds")
    
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

def recognize_pokemon_card(test_image_path, ref_dir, output_dir=None, verbose=False, use_cache=True):
    """Recognize a Pokémon card by comparing it to reference images.
    
    Args:
        test_image_path: Path to the test image file
        ref_dir: Directory containing reference card images
        output_dir: Optional directory to save output results
        verbose: Whether to print detailed logs
        
    Returns:
        Dictionary with matches and processing time, or error message string
    """
    start_time = time.time()
    
    # Validate test image path
    if not os.path.exists(test_image_path):
        return f"Error: Test image not found: {test_image_path}"
    
    # Initialize ORB detector and matcher
    orb = cv2.ORB_create(nfeatures=1000)
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    # Load test image using binary mode to handle special characters in paths
    try:
        with open(test_image_path, 'rb') as f:
            test_bytes = f.read()
        test_img = cv2.imdecode(np.frombuffer(test_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
        if test_img is None:
            return f"Error: Could not decode test image: {os.path.basename(test_image_path)}"
    except Exception as e:
        return f"Error loading test image: {str(e)}"

    # Load reference images with caching
    ref_images = load_reference_images(ref_dir, verbose, use_cache)
    if not ref_images:
        return f"Error: No reference images found in directory: {ref_dir}"

    # Process the card
    matches = process_single_card(test_img, ref_images, orb, matcher)
    
    # Format results
    if not matches:
        return "No clear match found."

    # Format multiple results
    results = []
    for i, (filename, score, metadata) in enumerate(matches[:5], 1):
        card_name = os.path.splitext(os.path.basename(filename))[0]
        metadata_str = ""
        if metadata:
            metadata_str = f" - {metadata['name']} ({metadata['expansion']}/{metadata['number']})"
        results.append(f"{i}. {card_name}{metadata_str} ({score} matches)")
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    return {"matches": results, "processing_time": processing_time}

def batch_process_cards(image_paths, ref_dir, max_workers=4, verbose=False, use_cache=True):
    """Process multiple card images in parallel.
    
    Args:
        image_paths: List of paths to test images
        ref_dir: Directory containing reference card images
        max_workers: Maximum number of worker threads
        verbose: Whether to print detailed logs
        
    Returns:
        Dictionary mapping image paths to recognition results
    """
    results = {}
    
    print(f"\n🔄 Processing {len(image_paths)} images with {max_workers} worker threads...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks with verbose and cache parameters
        future_to_path = {executor.submit(recognize_pokemon_card, path, ref_dir, None, verbose, use_cache): path for path in image_paths}
        
        # Process results as they complete
        completed = 0
        for future in concurrent.futures.as_completed(future_to_path):
            path = future_to_path[future]
            try:
                result = future.result()
                results[path] = result
                completed += 1
                
                # Show progress for large batches
                if len(image_paths) > 10 and completed % 5 == 0:
                    print(f"  Progress: {completed}/{len(image_paths)} images processed")
                    
            except Exception as e:
                results[path] = f"Error: {str(e)}"
    
    print(f"✅ Completed processing {len(image_paths)} images")
    return results

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='Pokemon Card Recognition Tool')
    parser.add_argument('--test_dir', type=str, help='Directory containing test images to process')
    parser.add_argument('--ref_dir', type=str, help='Directory containing reference card images')
    parser.add_argument('--output_dir', type=str, help='Directory to save output results (optional)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    parser.add_argument('--no-cache', action='store_true', help='Disable feature caching (always reprocess images)')
    parser.add_argument('--clear-cache', action='store_true', help='Clear all cached data before running')
    
    # Parse arguments and normalize path separators
    args = parser.parse_args()
    return args

def normalize_path(path, base_dir=None):
    """Normalize a path, resolving relative paths against base_dir.
    
    Args:
        path: The path to normalize
        base_dir: Base directory to resolve relative paths against
        
    Returns:
        Normalized absolute path
    """
    if not path:
        return None
        
    # Convert all slashes to OS-specific format
    path = path.replace('/', os.sep).replace('\\', os.sep)
    
    # If already absolute, just normalize it
    if os.path.isabs(path):
        return os.path.normpath(path)
    
    # For relative paths, join with base_dir and normalize
    if base_dir:
        return os.path.normpath(os.path.join(base_dir, path))
    
    # If no base_dir provided, convert to absolute using current directory
    return os.path.normpath(os.path.abspath(path))

def find_image_files(directory, extensions=None, verbose=False):
    """Find all image files in a directory with detailed logging.
    
    Args:
        directory: Directory to search for images
        extensions: Tuple of valid file extensions (default: common image formats)
        verbose: Whether to print detailed logs
        
    Returns:
        List of image file paths
    """
    if extensions is None:
        extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif')
    
    if verbose:
        print(f"\n🔍 Scanning for images in: {directory}")
    
    # Validate directory exists
    if not os.path.exists(directory):
        print(f"❌ Directory not found: {directory}")
        return [], []
    
    if not os.path.isdir(directory):
        print(f"❌ Not a directory: {directory}")
        return [], []
    
    image_files = []
    all_files = []
    
    # Walk through directory structure
    for root, dirs, files in os.walk(directory):
        rel_path = os.path.relpath(root, directory)
        if rel_path == '.':
            rel_path = ''
            
        if verbose:
            print(f"  📁 {rel_path or 'Root directory'}: {len(files)} files")
        
        for file in files:
            file_path = os.path.join(root, file)
            all_files.append(file_path)
            
            # Check if file has image extension
            if file.lower().endswith(extensions):
                image_files.append(file_path)
                if verbose:
                    print(f"    ✅ Found image: {file}")
    
    return image_files, all_files

def main():
    # Parse command-line arguments
    args = parse_arguments()
    verbose = args.verbose
    use_cache = not args.no_cache  # Use cache by default unless --no-cache is specified
    
    # Get current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    # Create cache directory if it doesn't exist
    cache_dir = os.path.join(script_dir, "cache")
    os.makedirs(cache_dir, exist_ok=True)
    
    # Handle cache clearing if requested
    if args.clear_cache:
        print("🧹 Clearing all cached data...")
        cache_files = [f for f in os.listdir(cache_dir) if f.startswith("ref_cache_") and f.endswith(".pkl")]
        for cache_file in cache_files:
            try:
                os.remove(os.path.join(cache_dir, cache_file))
            except Exception as e:
                print(f"  Error removing {cache_file}: {str(e)}")
        print(f"✅ Removed {len(cache_files)} cache files")
    
    # Clean up old cache files
    if use_cache:
        cleanup_old_caches(cache_dir, max_age_days=30, verbose=verbose)
    
    # Set default directories if not provided
    ref_dir = normalize_path(args.ref_dir, script_dir) if args.ref_dir else normalize_path(os.path.join(script_dir, "card_images"))
    test_dir = normalize_path(args.test_dir, script_dir) if args.test_dir else normalize_path(os.path.join(parent_dir, "test_images"))
    output_dir = normalize_path(args.output_dir, script_dir) if args.output_dir else None
    
    # Debug output to show resolved paths
    print(f"\n🔍 Resolved paths:")
    print(f"  Script directory: {script_dir}")
    print(f"  Parent directory: {parent_dir}")
    print(f"  Cache directory: {cache_dir}")
    print(f"  Test directory: {test_dir}")
    print(f"  Reference directory: {ref_dir}")
    print(f"  Cache enabled: {use_cache}")
    if output_dir:
        print(f"  Output directory: {output_dir}")
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    # Validate directories
    if not os.path.exists(ref_dir):
        print(f"❌ Reference directory not found: {ref_dir}")
        print(f"   Please check that the directory exists and is accessible.")
        return
    
    if not os.path.exists(test_dir):
        print(f"❌ Test directory not found: {test_dir}")
        print(f"   Please check that the directory exists and is accessible.")
        return
    
    # Find all test images with detailed logging
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff')
    test_images, all_files = find_image_files(test_dir, image_extensions, verbose)
    
    if not test_images:
        print("\n❌ No test images found in directory. Found these files instead:")
        for file in all_files[:10]:  # Show first 10 files
            print(f"  - {os.path.basename(file)}")
        if len(all_files) > 10:
            print(f"  ... and {len(all_files) - 10} more files")
        print("\nPlease check that the directory contains image files with these extensions:")
        print(f"  {', '.join(image_extensions)}")
        return
    
    print(f"\n✅ Found {len(test_images)} test images.")
    
    # Process in batch with verbose and cache flags
    results = batch_process_cards(test_images, ref_dir, max_workers=4, verbose=verbose, use_cache=use_cache)
    
    # Print results
    print("\n📋 Results Summary:")
    for path, result in results.items():
        print(f"\nResults for {os.path.basename(path)}:")
        if isinstance(result, dict):
            print(f"Processing time: {result['processing_time']:.2f} seconds")
            for match in result['matches']:
                print(match)
        else:
            print(result)
            
    # Save results to output directory if specified
    if output_dir:
        try:
            result_file = os.path.join(output_dir, "card_recognition_results.txt")
            with open(result_file, 'w') as f:
                f.write(f"Pokemon Card Recognition Results\n")
                f.write(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                for path, result in results.items():
                    f.write(f"\nResults for {os.path.basename(path)}:\n")
                    if isinstance(result, dict):
                        f.write(f"Processing time: {result['processing_time']:.2f} seconds\n")
                        for match in result['matches']:
                            f.write(f"{match}\n")
                    else:
                        f.write(f"{result}\n")
            print(f"\n✅ Results saved to: {result_file}")
        except Exception as e:
            print(f"\n❌ Error saving results: {str(e)}")
    
    # Close all database connections
    try:
        connection_pool.close_all()
    except Exception as e:
        print(f"Warning: Error closing database connections: {str(e)}")
        # Continue execution even if there's an error closing connections

if __name__ == "__main__":
    main()