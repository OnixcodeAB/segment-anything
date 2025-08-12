import * as ort from "onnxruntime-web";
import type { modeDataProps } from "./interfaces";

export const modelData = ({ clicks, tensor, modelScale }: modeDataProps) => {
  const imageEmbedding = tensor;
  let pointCoords;
  let pointLabels;
  let pointCoordsTensor;
  let pointLabelsTensor;

  // Check there are input click prompts
  if (clicks) {
    let n = clicks.length;

    // If there is no box input, a single padding point with
    // label -1 and coordinates (0.0, 0.0) should be concatenated
    // so initialize the array to support (n + 1) points.
    pointCoords = new Float32Array((n + 1) * 2);
    pointLabels = new Float32Array(n + 1);

    // Add clicks and scale to what SAM expects
    for (let i = 0; i < n; i++) {
      pointCoords[i * 2] = clicks[i].x * modelScale.samScale;
      pointCoords[i * 2 + 1] = clicks[i].y * modelScale.samScale;
      pointLabels[i] = clicks[i].clickType;
    }

    // Add in the extra point/label when only clicks and no box
    // The extra point is at (0, 0) with label -1
    pointCoords[n * 2] = 0.0;
    pointCoords[n * 2 + 1] = 0.0;
    pointLabels[n] = -1;

    // Create the tensor
    pointCoordsTensor = new ort.Tensor("float32", pointCoords, [1, n + 1, 2]);
    pointLabelsTensor = new ort.Tensor("float32", pointLabels, [1, n + 1]);
  }
  const imageSizeTensor = new ort.Tensor("float32", [
    modelScale.height,
    modelScale.width,
  ]);

  if (pointCoordsTensor === undefined || pointLabelsTensor === undefined) {
    // If there are no clicks, return an empty object
    return;
  }

  // There is no previous mask, so default to an empty tensor
  const maskInput = new ort.Tensor(
    "float32",
    new Float32Array(256 * 256),
    [1, 1, 256, 256]
  );

  // There is no previous mask, so default to 0
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
