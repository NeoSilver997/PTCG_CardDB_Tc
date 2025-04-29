import cv2
import os
import numpy as np
import time
import re
import json

def is_valid_filename(filename):
    # Allow any characters except Windows forbidden ones: \ / ? % * : | " < >
    return re.match(r'^[^\\/?%*:|"<>]+\.(jpg|jpeg|png)$', filename, re.IGNORECASE) is not None

def load_reference_images(ref_dir, orb):
    """Load all reference images from the specified directory."""
    ref_images = {}
    valid_count = 0
    print(f"\n🔍 Scanning reference directory: {ref_dir}")
    
    for root, dirs, files in os.walk(ref_dir):
        print(f"📁 {os.path.relpath(root, ref_dir) or 'Main directory'}: {len(files)} files")
        for filename in files:
            filename = os.fsdecode(filename)
            if is_valid_filename(filename):
                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, ref_dir)
                with open(filepath, 'rb') as f:
                    img_bytes = f.read()
                img = cv2.imdecode(np.frombuffer(img_bytes, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    _, descriptors = detect_and_compute_features(img, orb)
                    ref_images[rel_path] = {
                        'image': img,
                        'descriptors': descriptors
                    }
                    valid_count += 1
                    # print(f"✅ Valid: {rel_path}")
            else:
                print(f"❌ Invalid: {filename}")

    print(f"\nTotal valid reference images: {valid_count}")
    if valid_count == 0:
        raise ValueError(
            f"No valid images found in {ref_dir}\n"
            "Supported formats: JPG/JPEG/PNG\n"
            "Example valid name: 'Pikachu_皮卡丘123.jpg'"
        )
    return ref_images

def detect_and_compute_features(img, orb):
    """Detect keypoints and compute descriptors for an image."""
    keypoints, descriptors = orb.detectAndCompute(img, None)
    if descriptors is None:  # Handle case with no features
        return (None, None)
    return (keypoints, descriptors)

def process_single_card(card_img, ref_images, orb, matcher):
    """Process a single card image through the matching pipeline."""
    test_kp, test_des = detect_and_compute_features(card_img, orb)
    if test_des is None:
        return []
    
    matches = []
    for filename, ref_data in ref_images.items():
        ref_des = ref_data['descriptors']
        num_matches = match_features(test_des, ref_des, matcher)
        matches.append((filename, num_matches))
    
    return matches

def match_features(des1, des2, matcher):
    """Match descriptors between two images and return the number of good matches."""
    if des1 is None or des2 is None:
        return 0
    matches = matcher.knnMatch(des1, des2, k=2)
    # Apply adaptive Lowe's ratio test
    good_matches = []
    for match in matches:
        if len(match) != 2:
            continue
        m, n = match
        if m.distance < 0.6 * n.distance and m.distance < 50:
            good_matches.append(m)
    # Require minimum match distance difference
    if len(good_matches) > 1:
        sorted_matches = sorted(good_matches, key=lambda x: x.distance)
        distance_ratio = sorted_matches[0].distance / sorted_matches[1].distance
        if distance_ratio > 0.85:
            return 0
    return len(good_matches)

def detect_card_contours(img):
    """Detect card contours in an image using edge detection and contour analysis."""
    debug_img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    # Preprocess image
    # Adaptive thresholding for better edge detection
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    # Hybrid edge detection approach
    edged_canny = cv2.Canny(blurred, 30, 100)
    edged_adapt = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY, 11, 2)
    edged = cv2.bitwise_or(edged_canny, edged_adapt)
    # Morphological operations to separate cards
    kernel = np.ones((3,3), np.uint8)
    edged = cv2.morphologyEx(edged, cv2.MORPH_OPEN, kernel, iterations=2)
    edged = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    # Find contours and sort by area
    contours, _ = cv2.findContours(edged, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:15]
    
    card_contours = []
    img_area = img.shape[0] * img.shape[1]
    for contour in contours:
        # Filter by area (at least 3% of image area)
        if cv2.contourArea(contour) < img_area * 0.03:
            continue
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.03 * peri, True)
        # Validate card-like shapes using aspect ratio and convexity
        rect = cv2.minAreaRect(approx)
        (w, h) = rect[1]
        aspect = max(w, h) / min(w, h) if min(w, h) > 0 else 0
        # Allow slightly concave contours for damaged cards
        if len(approx) >=4 and len(approx) <=6 and 1.1 < aspect < 2.2:
            card_contours.append(approx)
    
        # Save debug images
    cv2.imwrite('debug_edges.jpg', edged)
    cv2.imwrite('debug_contours.jpg', debug_img)
    return card_contours

def recognize_pokemon_card(test_image_path, ref_dir, output_dir):
    """Recognize Pokémon cards in an image, handling multiple cards."""
    # Use FLANN-based matcher for better accuracy
    orb = cv2.ORB_create(nfeatures=2000)
    flann_params = dict(algorithm=6, table_number=6, key_size=12, multi_probe_level=1)
    matcher = cv2.FlannBasedMatcher(flann_params, {})

    # Load and preprocess image
    with open(test_image_path, 'rb') as f:
        test_bytes = f.read()
    test_img_color = cv2.imdecode(np.frombuffer(test_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if test_img_color is None:
        return "Error: Could not load test image."
    test_img_gray = cv2.cvtColor(test_img_color, cv2.COLOR_BGR2GRAY)

    # Load reference images with cached features
    try:
        ref_images = load_reference_images(ref_dir, orb)
    except ValueError as e:
        return f"Error loading references: {str(e)}"


    # Detect card regions
    contours = detect_card_contours(test_img_gray)
    
    # Store match results for annotation
    annotation_data = []

    # Process card matches and collect data
    all_results = []
    for i, contour in enumerate(contours, 1):
        x, y, w, h = cv2.boundingRect(contour)
        card_img = test_img_gray[y:y+h, x:x+w]
        
        matches = process_single_card(card_img, ref_images, orb, matcher)
        # Apply confidence threshold (top match must be >1.5x better than 2nd)
        sorted_matches = sorted(matches, key=lambda x: x[1], reverse=True)
        if len(sorted_matches) >= 2 and sorted_matches[0][1] < 1.2 * sorted_matches[1][1]:
            continue  # Reject uncertain matches
        top_matches = [m for m in sorted_matches if m[1] >= 10][:2]  # Adjusted minimum matches
        
        if top_matches:
            top_score = top_matches[0][1]
            annotation_data.append((i, contour, top_score))
            
            card_results = [f"Card {i}:"]
            # Validate against known expansions
            try:
                with open('metadata.json') as f:
                    metadata = json.load(f)
                valid_matches = []
                for filename, score in top_matches:
                    expansion_code = filename.split('\\')[0]
                    if metadata['expansions'].get(expansion_code, {}).get('valid', False):
                        valid_matches.append((filename, score))
                
                if not valid_matches:
                    continue
                
                for j, (filename, score) in enumerate(valid_matches, 1):
                    card_name = os.path.splitext(filename)[0]
                    card_results.append(f"  {j}. {card_name} ({score} matches)")
            except Exception as e:
                print(f"Metadata error: {str(e)}")
            all_results.append("\n".join(card_results))

    # Draw annotations with numbers and scores
    cv2.drawContours(test_img_color, contours, -1, (0, 255, 0), 2)
    for idx, contour, score in annotation_data:
        x, y, w, h = cv2.boundingRect(contour)
        cv2.putText(test_img_color, f"Card {idx}", (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        cv2.putText(test_img_color, f"Score: {score}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)

    output_path = os.path.join(output_dir, os.path.basename(test_image_path))
    cv2.imwrite(output_path, test_img_color)
    print(f"\n📌 Saved annotated image with card locations: {output_path}")
    
    if not contours:
        return "No cards detected in image"

    return "\n\n".join(all_results) if all_results else "No identifiable cards found"

import argparse

def is_valid_filename(filename):
    # Allow any characters except Windows forbidden ones: \ / ? % * : | " < >
    return re.match(r'^[^\\/?%*:|\"<>]+\.(jpg|jpeg|png)$', filename, re.IGNORECASE) is not None

def main():
    # Set up command-line arguments
    parser = argparse.ArgumentParser(description='Pokémon Card Recognition')
    parser.add_argument('--test_dir', type=str, required=True,
                      help='Path to directory containing test images (supports multi-card images)')
    parser.add_argument('--ref_dir', type=str, required=False, default=r'.\scripts\card_small_images',
                      help='Path to directory containing reference card images (default: "images")')
    parser.add_argument('--output_dir', type=str, default='output',
                      help='Path to save annotated images (default: "output")')
    args = parser.parse_args()

    # Validate directories and contents
    if not os.path.isdir(args.test_dir):
        print(f"Error: Test directory {args.test_dir} not found")
        return
    
    args.ref_dir = os.path.abspath(os.path.expanduser(args.ref_dir))
    print(f"Using reference directory: {args.ref_dir}")
    os.makedirs(args.output_dir, exist_ok=True)
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
                result = recognize_pokemon_card(test_image_path, args.ref_dir, args.output_dir)
                elapsed = (time.time() - start_time) * 1000
                print(f"Processing time: {elapsed:.2f}ms")
                
                # Handle multi-card results formatting
                if '\n\n' in result:
                    print("Detected cards:")
                    print(result)
                else:
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