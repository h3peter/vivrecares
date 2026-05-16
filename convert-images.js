const fs = require('fs');
const path = require('path');
const convert = require('heic-convert');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, 'vivrecares-frontend/src/assets/additional assets');

// Mapping of old names to new names
const renameMap = {
  // Equipment
  'machine 1.HEIC': 'equipment-hydro-facial-cleansing',
  'IMG_3679.HEIC': 'equipment-laser-resurfacing-tower',
  'IMG_3686.HEIC': 'equipment-hifu-skin-tightening',
  'IMG_3684.HEIC': 'equipment-diode-hair-removal',
  'IMG_3681.HEIC': 'equipment-co2-fractional-laser',
  'IMG_3688.HEIC': 'equipment-rf-contouring-console',
  'IMG_3680.HEIC': 'equipment-thermal-skin-rejuvenation',
  
  // Lounge & Hallways
  'lounge.HEIC': 'interior-main-lounge-view1',
  'IMG_3674.HEIC': 'interior-lounge-seating-view2',
  'IMG_3676.HEIC': 'interior-lounge-sofa-wide',
  'IMG_3656.HEIC': 'interior-clinic-front-facade',
  'IMG_3659.HEIC': 'interior-main-hallway-corridor',
  
  // Treatment & Procedure Rooms
  'IMG_3665.HEIC': 'room-treatment-bed-angle1',
  'IMG_3667.HEIC': 'room-treatment-corner-view',
  'IMG_3673.HEIC': 'room-treatment-double-bed-wide',
  'IMG_3662.HEIC': 'room-facial-bed-cozy',
  'IMG_3664.HEIC': 'room-laser-room-setup',
  'IMG_3663.HEIC': 'room-private-treatment-space',
  'IMG_3672.HEIC': 'room-premium-treatment-suite',
  'IMG_3671.HEIC': 'room-recovery-bed-warm-lighting',
  'IMG_3671(1).HEIC': 'room-recovery-bed-warm-lighting-alt',
  
  // Details & Close-ups
  'IMG_3675.HEIC': 'detail-lounge-table-magazines',
  'IMG_3670.HEIC': 'interior-consultation-desk-wide',
  'IMG_3660.HEIC': 'detail-product-display-shelves',
  'IMG_3666.HEIC': 'interior-consultation-office-corner',
  'IMG_3669.HEIC': 'detail-vanity-mirror-desk',
  'IMG_3668.HEIC': 'detail-wall-decor-and-certificates',
  'IMG_3668(1).HEIC': 'detail-wall-decor-and-certificates-alt',
  'IMG_3661.HEIC': 'detail-skincare-product-rack',
  'IMG_3661(1).HEIC': 'detail-skincare-product-rack-alt',
};

async function convertAndRenameImages() {
  try {
    const files = fs.readdirSync(assetsDir);
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (file.endsWith('.HEIC') && renameMap[file]) {
        const oldPath = path.join(assetsDir, file);
        const newName = renameMap[file] + '.webp';
        const newPath = path.join(assetsDir, newName);

        try {
          console.log(`Converting: ${file} → ${newName}`);

          // Read HEIC file
          const heicData = fs.readFileSync(oldPath);

          // Convert HEIC to PNG buffer first
          const pngBuffer = await convert({
            blob: heicData,
            toType: 'image/png',
          });

          // Convert PNG to WebP using sharp for best quality and compression
          await sharp(pngBuffer)
            .webp({ quality: 80, alphaQuality: 100 })
            .toFile(newPath);

          // Delete original HEIC file
          fs.unlinkSync(oldPath);

          console.log(`✓ Success: ${newName}`);
          successCount++;
        } catch (err) {
          console.error(`✗ Error converting ${file}:`, err.message);
          errorCount++;
        }
      }
    }

    console.log(`\n=== Conversion Complete ===`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

convertAndRenameImages();