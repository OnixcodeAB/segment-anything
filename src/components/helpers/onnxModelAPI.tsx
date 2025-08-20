import * as ort from "onnxruntime-web";
import type { modeDataProps } from "./interfaces";

export const modelData = ({
  clicks,
  box,
  tensor,
  modelScale,
}: modeDataProps) => {
  const imageEmbedding = tensor;
  let pointCoords;
  let pointLabels;
  let pointCoordsTensor;
  let pointLabelsTensor;
  let n; // Handling Bounding Box (Box Mode)

  if (box) {
    n = 2; // Bounding box has two points (top-left and bottom-right)
    const { x, y, width, height } = box;
    const x1 = x;
    const y1 = y;
    const x2 = x + width;
    const y2 = y + height; // Create arrays for coordinates and labels

    pointCoords = new Float32Array(n * 2);
    pointLabels = new Float32Array(n); // Add bounding box coordinates and scale to what SAM expects

    pointCoords[0] = x1 * modelScale.samScale;
    pointCoords[1] = y1 * modelScale.samScale;
    pointCoords[2] = x2 * modelScale.samScale;
    pointCoords[3] = y2 * modelScale.samScale; // Add bounding box labels (2 for top-left, 3 for bottom-right)

    pointLabels[0] = 2;
    pointLabels[1] = 3; // Create the tensor

    pointCoordsTensor = new ort.Tensor("float32", pointCoords, [1, n, 2]);
    pointLabelsTensor = new ort.Tensor("float32", pointLabels, [1, n]);
  } // Handling Clicks (Hover Mode)
  else if (clicks) {
    n = clicks.length;

    pointCoords = new Float32Array((n + 1) * 2);
    pointLabels = new Float32Array(n + 1);

    for (let i = 0; i < n; i++) {
      pointCoords[i * 2] = clicks[i].x * modelScale.samScale;
      pointCoords[i * 2 + 1] = clicks[i].y * modelScale.samScale;
      pointLabels[i] = clicks[i].clickType;
    }

    pointCoords[n * 2] = 0.0;
    pointCoords[n * 2 + 1] = 0.0;
    pointLabels[n] = -1;

    pointCoordsTensor = new ort.Tensor("float32", pointCoords, [1, n + 1, 2]);
    pointLabelsTensor = new ort.Tensor("float32", pointLabels, [1, n + 1]);
  }

  const imageSizeTensor = new ort.Tensor("float32", [
    modelScale.height,
    modelScale.width,
  ]);

  if (pointCoordsTensor === undefined || pointLabelsTensor === undefined) {
    return;
  }

  const maskInput = new ort.Tensor(
    "float32",
    new Float32Array(256 * 256),
    [1, 1, 256, 256]
  );

  const hasMaskInput = new ort.Tensor("float32", [0]);

  return {
    image_embeddings: imageEmbedding,
    point_coords: pointCoordsTensor,
    point_labels: pointLabelsTensor,
    orig_im_size: imageSizeTensor,
    mask_input: maskInput,
    has_mask_input: hasMaskInput,
  };
};
