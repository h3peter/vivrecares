#!/usr/bin/env python3
import os
from pathlib import Path
from PIL import Image
import pillow_heif

# Register HEIF opener
pillow_heif.register_heif_opener()

assets_dir = Path(__file__).parent / 'vivrecares-frontend' / 'src' / 'assets' / 'additional_assets'

def compress_images():
    """Re-compress all WebP images with lower quality for faster loading"""
    
    print(f"Compressing images in: {assets_dir}")
    print("-" * 60)
    
    total_before = 0
    total_after = 0
    
    for webp_file in sorted(assets_dir.glob('*.webp')):
        try:
            # Get original size
            original_size = webp_file.stat().st_size / 1024
            
            # Open and re-compress with lower quality
            with Image.open(webp_file) as img:
                # Save with quality 65 (aggressive compression)
                img.save(webp_file, 'WEBP', quality=65, method=6)
            
            # Get new size
            new_size = webp_file.stat().st_size / 1024
            reduction = ((original_size - new_size) / original_size) * 100
            
            print(f"✓ {webp_file.name}")
            print(f"  {original_size:.1f}KB → {new_size:.1f}KB (-{reduction:.1f}%)")
            
            total_before += original_size
            total_after += new_size
            
        except Exception as e:
            print(f"✗ Error: {webp_file.name} - {str(e)}")
    
    total_reduction = ((total_before - total_after) / total_before) * 100 if total_before > 0 else 0
    print("-" * 60)
    print(f"\n=== Compression Complete ===")
    print(f"Total: {total_before:.1f}KB → {total_after:.1f}KB (-{total_reduction:.1f}%)")

if __name__ == '__main__':
    compress_images()
