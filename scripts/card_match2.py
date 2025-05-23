import os
import cv2
import json
import time
import hashlib
from appdirs import user_cache_dir
import numpy as np
import time
import re

def is_valid_filename(filename):
    # Allow any characters except Windows forbidden ones: \ / ? % * : | " < >
    return re.match(r'^[^\\/?%*:|"<>]+\.(jpg|jpeg|png)$', filename, re.IGNORECASE) is not None

def generate_folder_signature(root_path):
    """Generate signature based on folder mtime and image contents"""
    signature = {}
    for root, _, files in os.walk(root_path):
        dir_stat = os.stat(root)
        signature[root] = {
            'mtime': dir_stat.st_mtime,
            'files': {}
        }
        for f in files:
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(root, f)
                with open(path, 'rb') as img_file:
                    signature[root]['files'][f] = hashlib.md5(img_file.read()).hexdigest()
    return hashlib.md5(json.dumps(signature, sort_keys=True).encode()).hexdigest()


def cache_valid(cache_path, signature_hash):
    """Check if cache matches current folder state"""
    if not os.path.exists(cache_path):
        return False
    
    try:
        with open(cache_path, 'r') as f:
            cache_data = json.load(f)
        return cache_data.get('signature') == signature_hash and bool(cache_data.get('features'))
    except:
        return False


def load_reference_images(ref_dir):
    """Load all reference images with caching"""
    cache_dir = user_cache_dir('PokemonDB', 'Trae')
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, 'image_features.cache')
    
    current_signature = generate_folder_signature(ref_dir)
    
    if cache_valid(cache_file, current_signature):
        print(f"\n🚀 Loading cached features from {cache_file}")
        with open(cache_file, 'r') as f:
            cached_features = json.load(f)['features']
            if not cached_features:
                print("⚠️ Cached features empty - rebuilding cache")
                os.remove(cache_file)
                return load_reference_images(ref_dir)
            
            # Validate cached descriptors
            for path, feature in cached_features.items():
                try:
                    # Reconstruct and validate numpy array
                    if 'des' not in feature:
                        raise ValueError('Missing descriptors')
                    
                    # Type and structure validation
                    feature['des'] = np.array(feature['des'], dtype=np.uint8)
                    if not isinstance(feature['des'], np.ndarray):
                        raise TypeError('Descriptors must be numpy array')
                    if feature['des'].dtype != np.uint8:
                        raise TypeError(f'Invalid dtype: {feature["des"].dtype}, expected uint8')
                    if len(feature['des'].shape) != 2 or feature['des'].shape[1] != 32:
                        raise ValueError(f'Invalid shape: {feature["des"].shape}, expected (n,32)')
                except Exception as e:
                    print(f"⚠️ Invalid cache entry {path}: {str(e)} - rebuilding cache")
                    os.remove(cache_file)
                    return load_reference_images(ref_dir)
            
            return cached_features
    
    print(f"\n🔍 Scanning and processing {ref_dir} (this may take a while)")
    orb = cv2.ORB_create()
    features = {}
    valid_images_found = False
    
    for root, _, files in os.walk(ref_dir):
        for filename in files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(root, filename)
                with open(path, 'rb') as f:
                    img_bytes = f.read()
                try:
                    img = cv2.imdecode(np.frombuffer(img_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
                    if img is None or img.size == 0:
                        raise ValueError('Empty or invalid image data')
                except Exception as decode_err:
                    print(f"⚠️ Decode error {filename}: {str(decode_err)}")
                    continue
                    try:
                        kp, des = orb.detectAndCompute(img, None)
                        if des is not None:
                            if des is not None and isinstance(des, np.ndarray):
                                features[os.path.relpath(path, ref_dir)] = {
                                    'kp': [kp.pt + (kp.size, kp.angle, kp.response) for kp in kp],
                                    'des': des.tolist()
                                }
                            valid_images_found = True
                    except Exception as e:
                        print(f"⚠️ Error processing {filename}: {str(e)}")
                        continue
    
    cache_data = {
        'signature': current_signature,
        'features': features
    }
    
    with open(cache_file, 'w') as f:
        json.dump(cache_data, f)
    
    if not valid_images_found:
        raise ValueError(
            f"No valid images found in {ref_dir}\n"
            "Possible reasons:\n"
            "1. Directory contains no image files (.jpg/.jpeg/.png)\n"
            "2. Images have invalid filenames (contains \\/?%*:|"
        )
    print(f"\n💾 Saved processed features to {cache_file}")
    return features

def detect_and_compute_features(img, orb):
    """Detect keypoints and compute descriptors for an image."""
    keypoints, descriptors = orb.detectAndCompute(img, None)
    return keypoints, descriptors

def match_features(des1, des2, matcher):
    """Match descriptors between two images and return the number of good matches."""
    if des1 is None or des2 is None:
        return 0
    matches = matcher.knnMatch(des1, des2, k=2)
    # Apply Lowe's ratio test
    good_matches = [m for m, n in matches if m.distance < 0.75 * n.distance]
    return len(good_matches)

def recognize_pokemon_card(test_image_path, ref_dir):
    """Recognize a Pokémon card by comparing it to reference images."""
    # Initialize ORB detector
    orb = cv2.ORB_create()
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    # Load test image
    with open(test_image_path, 'rb') as f:
        test_bytes = f.read()
    try:
        test_img = cv2.imdecode(np.frombuffer(test_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
        if test_img is None or not isinstance(test_img, np.ndarray) or test_img.size == 0:
            raise ValueError('Failed to decode image or empty result')
    except Exception as e:
        return f"Error loading test image: {str(e)}"
    
    # Validate image dimensions
    if test_img.shape[0] < 100 or test_img.shape[1] < 100:
        return "Error: Test image too small (min 100x100 pixels required)"

    # Detect features in test image
    test_kp, test_des = detect_and_compute_features(test_img, orb)

    # Load reference images
    try:
        ref_images = load_reference_images(ref_dir)
    except ValueError as e:
        return f"Error: {str(e)}"

    # Compare test image to each reference image
    matches = []
    for filename, ref_img in ref_images.items():
        ref_kp, ref_des = detect_and_compute_features(ref_img, orb)
        num_matches = match_features(test_des, ref_des, matcher)
        matches.append((filename, num_matches))
    
    # Sort matches by score and keep top 5 with at least 10 matches
    sorted_matches = sorted(matches, key=lambda x: x[1], reverse=True)
    top_matches = [m for m in sorted_matches if m[1] >= 10][:5]

    # Threshold for minimum matches to consider a valid recognition
    if not top_matches:
        return "No clear match found."

    # Format multiple results
    results = []
    for i, (filename, score) in enumerate(top_matches, 1):
        card_name = os.path.splitext(filename)[0]
        results.append(f"{i}. {card_name} ({score} matches) - {os.path.join(ref_dir, filename)}")
    
    return "Possible matches:\n" + "\n".join(results)

import argparse

def is_valid_filename(filename):
    # Allow any characters except Windows forbidden ones: \ / ? % * : | " < >
    return re.match(r'^[^\\/?%*:|\"<>]+\.(jpg|jpeg|png)$', filename, re.IGNORECASE) is not None

def main():
    # Set up command-line arguments
    parser = argparse.ArgumentParser(description='Pokémon Card Recognition')
    parser.add_argument('--test_dir', type=str, required=True,
                      help='Path to directory containing test images')
    parser.add_argument('--ref_dir', type=str, required=False, default=r'.\scripts\card_small_images',
                      help='Path to directory containing reference card images (default: "images")')
    args = parser.parse_args()

    # Validate directories and contents
    if not os.path.isdir(args.test_dir):
        print(f"Error: Test directory {args.test_dir} not found")
        return
    
    args.ref_dir = os.path.abspath(os.path.expanduser(args.ref_dir))
    print(f"Using reference directory: {args.ref_dir}")
    if not os.path.isdir(args.ref_dir):
        print(f"Error: Reference directory {args.ref_dir} not found")
        return

    try:
        # Validate reference directory contains images
        load_reference_images(args.ref_dir)
    except ValueError as e:
        print(f"Error: {str(e)}")
        return

    # Check for valid test images
    test_files = [f for f in os.listdir(args.test_dir) if is_valid_filename(f)]
    print(f"Found {len(test_files)} valid test images")
    if not test_files:
        print(f"Error: No valid images found in test directory {args.test_dir}")
        return

    # Process all valid images in test directory
    total_start = time.time()
    processed = 0
    for filename in os.listdir(args.test_dir):
        filename = os.fsdecode(filename)
        if is_valid_filename(filename):
            test_image_path = os.path.join(args.test_dir, filename)
            print(f"\nProcessing {filename}:")
            try:
                start_time = time.time()
                result = recognize_pokemon_card(test_image_path, args.ref_dir)
                elapsed = (time.time() - start_time) * 1000
                print(f"Processing time: {elapsed:.2f}ms")
                print(result)
                processed += 1
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
    
    total_elapsed = (time.time() - total_start) * 1000
    print(f"\nTotal processing time: {total_elapsed:.2f}ms")
    if processed == 0:
        print("\nNo images processed successfully. Check file formats and image validity")

if __name__ == "__main__":
    main()