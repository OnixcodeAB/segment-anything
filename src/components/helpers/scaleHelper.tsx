export const handleImageScale = (img: HTMLImageElement) => {
  //console.log("Scaling image:", img);
  // Input images to SAM must be resized so the longest side is 1024
  const LONG_SIDE_LENGTH = 1024;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const samScale = LONG_SIDE_LENGTH / Math.max(w, h);
  return { height: h, width: w, samScale };
};
