import cv2
import os
import numpy as np

def load_reference_images(ref_dir):
    """Load all reference images from the specified directory."""
    ref_images = {}
    valid_count = 0
    for root, dirs, files in os.walk(ref_dir):
        for filename in files:
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
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
    best_match = None
    max_matches = 0
    for filename, ref_img in ref_images.items():
        ref_kp, ref_des = detect_and_compute_features(ref_img, orb)
        num_matches = match_features(test_des, ref_des, matcher)
        if num_matches > max_matches:
            max_matches = num_matches
            best_match = filename

    # Threshold for minimum matches to consider a valid recognition
    if max_matches < 10:
        return "No clear match found."

    # Extract card name from filename (remove extension)
    card_name = os.path.splitext(best_match)[0]
    return f"Recognized Pokémon card: {card_name} ({max_matches} matches) - Reference Path: {os.path.join(ref_dir, best_match)}"

import argparse

def main():
    # Set up command-line arguments
    parser = argparse.ArgumentParser(description='Pokémon Card Recognition')
    parser.add_argument('--test_dir', type=str, required=True,
                      help='Path to directory containing test images')
    parser.add_argument('--ref_dir', type=str, required=False, default='images',
                      help='Path to directory containing reference card images (default: "images")')
    args = parser.parse_args()

    # Validate directories and contents
    if not os.path.isdir(args.test_dir):
        print(f"Error: Test directory {args.test_dir} not found")
        return
    
    if not os.path.isdir(args.ref_dir):
        print(f"Error: Reference directory {args.ref_dir} not found")
        return

    # Check for valid test images
    test_files = [f for f in os.listdir(args.test_dir) 
                if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not test_files:
        print(f"Error: No valid images found in test directory {args.test_dir}")
        return

    # Process all valid images in test directory
    processed = 0
    for filename in os.listdir(args.test_dir):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            test_image_path = os.path.join(args.test_dir, filename)
            print(f"\nProcessing {filename}:")
            try:
                result = recognize_pokemon_card(test_image_path, args.ref_dir)
                print(result)
                processed += 1
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
    
    if processed == 0:
        print("\nNo images processed successfully. Check file formats and image validity")

if __name__ == "__main__":
    main()