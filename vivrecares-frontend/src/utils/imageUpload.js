const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_BYTES * 0.9);
const MAX_DIMENSION = 1600;
const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif']);
const WEB_SAFE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const loadImageFromBlob = (blob) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('We could not read that image file.'));
    };

    image.src = objectUrl;
  });

const blobToFile = (blob, fileName) =>
  new File([blob], fileName, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });

const buildSafeFileName = (originalName, extension) => {
  const baseName = String(originalName || 'profile-photo')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'profile-photo';

  return `${baseName}.${extension}`;
};

const convertHeicToJpeg = async (file) => {
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error('We could not convert that iPhone photo. Please try a different image.');
  }

  return blobToFile(blob, buildSafeFileName(file.name, 'jpg'));
};

const compressImageFile = async (file) => {
  const sourceImage = await loadImageFromBlob(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Your browser could not prepare the selected image.');
  }

  const largestSide = Math.max(sourceImage.width, sourceImage.height) || 1;
  const scale = Math.min(1, MAX_DIMENSION / largestSide);
  canvas.width = Math.max(1, Math.round(sourceImage.width * scale));
  canvas.height = Math.max(1, Math.round(sourceImage.height * scale));
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let outputBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  while (outputBlob && outputBlob.size > TARGET_UPLOAD_BYTES && quality > 0.45) {
    quality -= 0.1;
    outputBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  if (!outputBlob) {
    throw new Error('We could not prepare that image for upload.');
  }

  return blobToFile(outputBlob, buildSafeFileName(file.name, 'jpg'));
};

export const prepareProfilePhotoUpload = async (file) => {
  if (!(file instanceof File)) {
    throw new Error('No image file was selected.');
  }

  let preparedFile = file;
  const mimeType = String(file.type || '').toLowerCase();

  if (HEIC_MIME_TYPES.has(mimeType)) {
    preparedFile = await convertHeicToJpeg(file);
  } else if (!WEB_SAFE_TYPES.has(mimeType)) {
    throw new Error('Please choose a JPG, PNG, WebP, or iPhone HEIC photo.');
  }

  if (preparedFile.size > TARGET_UPLOAD_BYTES || HEIC_MIME_TYPES.has(mimeType)) {
    preparedFile = await compressImageFile(preparedFile);
  }

  if (preparedFile.size > MAX_UPLOAD_BYTES) {
    throw new Error('That image is still too large after processing. Please choose a smaller photo.');
  }

  return preparedFile;
};
