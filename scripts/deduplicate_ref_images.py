import os
import hashlib
import shutil
from PIL import Image
import imagehash

def calculate_phash(image_path):
    try:
        with Image.open(image_path) as img:
            return str(imagehash.phash(img))
    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")
        return None

def find_duplicates(ref_dir, similarity_threshold=95):
    hashes = {}
    print(f"🔍 Scanning {ref_dir} for duplicates...")
    
    for root, _, files in os.walk(ref_dir):
        for filename in files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(root, filename)
                phash = calculate_phash(path)
                if phash:
                    hashes.setdefault(phash, []).append(path)

    duplicates = {}
    for h, paths in hashes.items():
        if len(paths) > 1:
            duplicates[h] = paths
    return duplicates

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Pokémon Card Reference Image Deduplicator')
    parser.add_argument('--ref_dir', required=False, default=r'.\scripts\card_small_images', help='Path to reference images directory')
    parser.add_argument('--backup_dir', default='duplicate_backup', help='Backup directory for duplicates')
    args = parser.parse_args()

    duplicates = find_duplicates(args.ref_dir)
    os.makedirs(args.backup_dir, exist_ok=True)

    print(f"\nFound {sum(len(v)-1 for v in duplicates.values())} potential duplicates")
    for h, paths in duplicates.items():
        print(f"\n📌 Group with hash {h}:")
        for path in paths[1:]:  # Keep first occurrence
            dest = os.path.join(args.backup_dir, os.path.relpath(path, args.ref_dir))
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.move(path, dest)
            print(f"Moved duplicate: {path} -> {dest}")

if __name__ == '__main__':
    main()