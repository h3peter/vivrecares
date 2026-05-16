#!/usr/bin/env python3
import os
from pathlib import Path
from PIL import Image
import pillow_heif

# Register HEIF opener
pillow_heif.register_heif_opener()

assets_dir = Path(__file__).parent / 'vivrecares-frontend' / 'src' / 'assets' / 'additional assets'

# Mapping of old names to new names
rename_map = {
    # Equipment
    'machine 1.HEIC': 'equipment-hydro-facial-cleansing',
    'IMG_3679.HEIC': 'equipment-laser-resurfacing-tower',
    'IMG_3686.HEIC': 'equipment-hifu-skin-tightening',
    'IMG_3684.HEIC': 'equipment-diode-hair-removal',
    'IMG_3681.HEIC': 'equipment-co2-fractional-laser',
    'IMG_3688.HEIC': 'equipment-rf-contouring-console',
    'IMG_3680.HEIC': 'equipment-thermal-skin-rejuvenation',
    
    # Lounge & Hallways
    'lounge.HEIC': 'interior-main-lounge-view1',
    'IMG_3674.HEIC': 'interior-lounge-seating-view2',
    'IMG_3676.HEIC': 'interior-lounge-sofa-wide',
    'IMG_3656.HEIC': 'interior-clinic-front-facade',
    'IMG_3659.HEIC': 'interior-main-hallway-corridor',
    
    # Treatment & Procedure Rooms
    'IMG_3665.HEIC': 'room-treatment-bed-angle1',
    'IMG_3667.HEIC': 'room-treatment-corner-view',
    'IMG_3673.HEIC': 'room-treatment-double-bed-wide',
    'IMG_3662.HEIC': 'room-facial-bed-cozy',
    'IMG_3664.HEIC': 'room-laser-room-setup',
    'IMG_3663.HEIC': 'room-private-treatment-space',
    'IMG_3672.HEIC': 'room-premium-treatment-suite',
    'IMG_3671.HEIC': 'room-recovery-bed-warm-lighting',
    'IMG_3671(1).HEIC': 'room-recovery-bed-warm-lighting-alt',
    
    # Details & Close-ups
    'IMG_3675.HEIC': 'detail-lounge-table-magazines',
    'IMG_3670.HEIC': 'interior-consultation-desk-wide',
    'IMG_3660.HEIC': 'detail-product-display-shelves',
    'IMG_3666.HEIC': 'interior-consultation-office-corner',
    'IMG_3669.HEIC': 'detail-vanity-mirror-desk',
    'IMG_3668.HEIC': 'detail-wall-decor-and-certificates',
    'IMG_3668(1).HEIC': 'detail-wall-decor-and-certificates-alt',
    'IMG_3661.HEIC': 'detail-skincare-product-rack',
    'IMG_3661(1).HEIC': 'detail-skincare-product-rack-alt',
}

def convert_and_rename():
    success_count = 0
    error_count = 0
    
    print(f"Converting images in: {assets_dir}")
    print("-" * 60)
    
    for filename, new_name in rename_map.items():
        old_path = assets_dir / filename
        new_path = assets_dir / f"{new_name}.webp"
        
        if not old_path.exists():
            print(f"⚠ Skipped (not found): {filename}")
            continue
        
        try:
            print(f"Converting: {filename} → {new_name}.webp")
            
            # Open image
            with Image.open(old_path) as img:
                # Convert to RGB if necessary (for RGBA or other modes)
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = rgb_img
                
                # Save as WebP with quality optimization
                img.save(new_path, 'WEBP', quality=80, method=6)
            
            # Delete original HEIC
            old_path.unlink()
            
            # Get file sizes
            new_size = new_path.stat().st_size / 1024  # KB
            print(f"✓ Success: {new_name}.webp ({new_size:.1f} KB)")
            success_count += 1
            
        except Exception as e:
            print(f"✗ Error: {filename} - {str(e)}")
            error_count += 1
    
    print("-" * 60)
    print(f"\n=== Conversion Complete ===")
    print(f"✓ Successful: {success_count}")
    print(f"✗ Errors: {error_count}")

if __name__ == '__main__':
    convert_and_rename()
