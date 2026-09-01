import { LOGO_SIZE, squareCrop } from './geometry';

/**
 * The logo repository's ceiling, matching Trust Wallet's convention.
 *
 * Module-private: the Action in the logo repository is the only validator that
 * counts, so nothing outside this file has a reason to know the number. It was
 * exported with no consumer, which reads as an API other code may rely on.
 */
const MAX_LOGO_BYTES = 100 * 1024;

/**
 * Centre-crops to square, scales to 256x256 and re-encodes as PNG.
 *
 * Re-encoding is not only about size: decoding and redrawing strips EXIF, so a
 * photo carrying GPS coordinates does not travel to a public repository
 * attached to the submitter's wallet address.
 *
 * No unit test: jsdom implements none of `createImageBitmap`, `getContext` or
 * `toBlob`, and this repo has no `canvas` package. The geometry this delegates
 * to is tested exhaustively in `geometry.test.ts`.
 */
export async function normalizeLogo(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, size } = squareCrop(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = LOGO_SIZE;
  canvas.height = LOGO_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the image in this browser.');

  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, LOGO_SIZE, LOGO_SIZE);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) throw new Error('Could not prepare the image in this browser.');

  if (blob.size > MAX_LOGO_BYTES) {
    throw new Error(
      `That image is too detailed to compress under ${MAX_LOGO_BYTES / 1024} KB. Try a simpler mark.`,
    );
  }

  return blob;
}
