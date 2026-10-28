// Shrinks a picture chosen by the user to a small square JPEG (data URL) in the browser,
// so it is small enough to be saved with the user's profile (no file storage needed).

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB picked file
const MAX_OUTPUT_CHARS = 150_000; // about 110 KB of image data

export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Please choose a JPEG, PNG or WebP picture");
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error("The picture is too big (maximum 10 MB)");

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This picture could not be read"));
      el.src = url;
    });

    // crop the middle square, then scale it down
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot process pictures");
    ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background in the JPEG
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_OUTPUT_CHARS) return dataUrl;
    }
    throw new Error("The picture is too detailed. Please choose a simpler one");
  } finally {
    URL.revokeObjectURL(url);
  }
}
