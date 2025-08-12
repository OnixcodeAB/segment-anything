import { useContext, useEffect, useState } from "react";
import * as ort from "onnxruntime-web";
import "./App.css";
import type { modelScaleProps } from "./components/helpers/interfaces";
import AppContext from "./components/hooks/context";
import { handleImageScale } from "./components/helpers/scaleHelper";
import npyjs from "npyjs";
import { modelData } from "./components/helpers/onnxModelAPI";
import { onnxMaskToImage } from "./components/helpers/maskUtils";
import { Stage } from "./components/Stage";

import truck from "./assets/data/truck.jpg";

// Define image, embedding and model paths
//const IMAGE_PATH = "./assets/data/truck.jpg";
const IMAGE_EMBEDDING = "../model/truck_embedding.npy";
const MODEL_DIR = "../model/sam_onnx_example.onnx";

function App() {
  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
  } = useContext(AppContext)!;
  const [model, setModel] = useState<ort.InferenceSession | null>(null);
  const [tensor, setTensor] = useState<ort.Tensor | null>(null); // Image embedding tensor

  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    const initializeModel = async () => {
      try {
        // Load the ONNX model
        const session = await ort.InferenceSession.create(MODEL_DIR);
        setModel(session);
        //console.log("Model loaded successfully");
      } catch (error) {
        console.error("Failed to load the model:", error);
      }
    };

    initializeModel();
    const url = new URL(truck, location.origin);
    //console.log("Loading image from:", url);
    loadImage(url);
    // Load the Segment Anything pre-computed embedding
    // from the Numpy file
    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(
      (embedding) => setTensor(embedding)
    );
    //console.log("Image embedding loaded successfully");
  }, []);

  //console.log({ model, clicks, tensor, modelScale, image, maskImg });

  // Load the image
  const loadImage = async (url: URL) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Important if loading from different domains

      // Create a promise to handle the loading
      const imageLoadPromise = new Promise<HTMLImageElement>(
        (resolve, reject) => {
          img.onload = () => {
            const { height, width, samScale } = handleImageScale(img);
            setModelScale({ height, width, samScale });
            img.width = width;
            img.height = height;
            resolve(img);
          };

          img.onerror = () => {
            reject(new Error(`Failed to load image from ${url.href}`));
          };
        }
      );

      img.src = url.href;

      // Wait for the image to load and then update state
      const loadedImage = await imageLoadPromise;
      setImage(loadedImage);
      //console.log("Image loaded successfully", loadedImage);

      return loadedImage;
    } catch (error) {
      console.error("Error loading image:", error);
      setImage(null); // Explicitly set to null on error
      throw error; // Re-throw if you want to handle the error upstream
    }
  };

  // Decode a Numpy file into a tensor.
  const loadNpyTensor = async (tensorFile: string, dType: any) => {
    let npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  // Run the ONNX model every time clicks has changed
  const runModel = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      ) {
        console.warn("Model or clicks or modelScale is not ready");
        return;
      } else {
        const feeds = modelData({ clicks, tensor, modelScale });
        if (feeds === undefined) {
          console.warn("No input clicks provided");
          return;
        }
        const results = await model.run(feeds);
        if (
          results === undefined ||
          results[model.outputNames[0]] === undefined
        ) {
          console.warn("Model did not return any results");
          return;
        }
        //console.log("Model results:", results);
        // The output is an array of tensors, we assume the first one is the mask
        // and it is the only output of the model.
        // If the model has multiple outputs, you may need to adjust this.

        const output = results[model.outputNames[0]]; // Get the output tensor
        //console.log("Model output names:", output);

        // The predicted mask returned from the ONNX model is an array which is
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(
          onnxMaskToImage(output.data, output.dims[2], output.dims[3])
        );
      }
    } catch (error) {}
  };

  useEffect(() => {
    runModel();
  }, [clicks]);

  return (
    <>
      <Stage />
    </>
  );
}

export default App;
