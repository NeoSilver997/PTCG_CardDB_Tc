import cv2
import os
import numpy as np
import time
import re

def load_reference_images(ref_dir):
    """Load all reference images from the specified directory."""
    ref_images = {}
    valid_count = 0
    for root, dirs, files in os.walk(ref_dir):
        for filename in files:
            filename = os.fsdecode(filename)
            if is_valid_filename(filename):
                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, ref_dir)
                img = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    ref_images[rel_path] = img
                    valid_count += 1
    if valid_count == 0:
        raise ValueError(f"No valid images found in {ref_dir} or its subdirectories")
    return ref_images

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
    test_img = cv2.imread(test_image_path, cv2.IMREAD_GRAYSCALE)
    if test_img is None:
        return "Error: Could not load test image."

    # Detect features in test image
    test_kp, test_des = detect_and_compute_features(test_img, orb)

    # Load reference images
    ref_images = load_reference_images(ref_dir)
    if not ref_images:
        return "Error: No reference images found."

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