/**
 * Utilidades de imágenes: validar, redimensionar y comprimir a dataURL
 * para almacenar en IndexedDB sin saturar el almacenamiento.
 */

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB de entrada

export class ImageError extends Error {}

export async function fileToCompressedDataUrl(file: File, maxSide = 320, quality = 0.82): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new ImageError('Formato no válido. Usa JPG, PNG o WebP.');
  }
  if (file.size > MAX_BYTES) {
    throw new ImageError('La imagen excede 5 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return canvas.toDataURL('image/webp', quality);
}
