const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

export async function isAllowedImageFile(file: File): Promise<boolean> {
  const type = file.type;
  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(type)) {
    return false;
  }
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (JPEG.every((byte, index) => header[index] === byte)) {
    return type === "image/jpeg" || type === "image/jpg";
  }
  if (PNG.every((byte, index) => header[index] === byte)) {
    return type === "image/png";
  }
  const riff = String.fromCharCode(...header.slice(0, 4));
  const webp = String.fromCharCode(...header.slice(8, 12));
  return riff === "RIFF" && webp === "WEBP" && type === "image/webp";
}
