/** Redimensionne et compresse une photo (JPEG) pour qu’elle tienne dans le stockage du navigateur. */
export function compressImage(file: File, maxSide = 1400, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Ce fichier n’est pas une image."));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.round(image.width * ratio);
      const height = Math.round(image.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Impossible de traiter l’image."));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    image.src = url;
  });
}
