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

// Define image, embedding and model paths

const MODEL_DIR = "../model/sam_onnx_example.onnx";
const EMBEDDING_API_URL = "https://ba8dbe084edb.ngrok-free.app/embed"; // Your backend endpoint

function App() {
  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
  } = useContext(AppContext)!;
  const [model, setModel] = useState<ort.InferenceSession | null>(null);
  const [tensor, setTensor] = useState<ort.Tensor | null>(null); // Image embedding tensor
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // The ONNX model expects the input to be rescaled to 1024.
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    const initializeModel = async () => {
      try {
        // Load the ONNX model
        setIsLoading(true);
        const session = await ort.InferenceSession.create(MODEL_DIR);
        setModel(session);
        setIsLoading(false);
        //console.log("Model loaded successfully");
      } catch (error) {
        console.error("Failed to load the model:", error);
        setError("Failed to load the model");
        setIsLoading(false);
      }
    };

    initializeModel();

    //console.log("Image embedding loaded successfully");
  }, []);

  //console.log({ model, clicks, tensor, modelScale, image, maskImg });

  // Handle image and embedding loading when URLs change
  const handleLoad = async () => {
    if (!imageUrl) {
      setError("Please provide both image URLs");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // First load the image
      await loadImage(imageUrl);

      // Then fetch the embedding from the backend
      await fetchEmbedding(imageUrl);

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading resources:", error);
      setError("Failed to load image or embedding");
      setIsLoading(false);
    }
  };

  // Fetch embedding from backend API
  const fetchEmbedding = async (imageUrl: string) => {
    try {
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      const response = await fetch(EMBEDDING_API_URL, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Get the blob data from the response
      const blob = await response.blob();

      // Convert the to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Create a temporary URL for the blob
      const tempUrl = URL.createObjectURL(
        new Blob([arrayBuffer], { type: "application/octet-stream" })
      );

      // Load the numpy tensor from the blob data
      const embedding = await loadNpyTensor(tempUrl, "float32");

      // Set the tensor state
      setTensor(embedding as ort.Tensor);

      // Clean up the temporary URL
      URL.revokeObjectURL(tempUrl);
      //console.log("Embedding loaded successfully", tensor);
    } catch (error) {
      throw error;
    }
  };

  // Load the image
  const loadImage = async (url: string) => {
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
            reject(new Error(`Failed to load image from ${url}`));
          };
        }
      );

      img.src = url;

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
    try {
      let npLoader = new npyjs();
      const npArray = await npLoader.load(tensorFile);
      const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
      return tensor;
    } catch (error) {
      console.error("Error loading numpy tensor:", error);
      throw error;
    }
  };

  // Run the ONNX model every time clicks has changed
  const runModel = async () => {
    try {
      if (model === null || !clicks || !tensor || !modelScale) {
        console.warn("Model or clicks or modelScale is not ready");
        return;
      } else {
        const feeds = modelData({ clicks, tensor, modelScale });
        if (!feeds) {
          console.warn("No input clicks provided");
          return;
        }
        const results = await model.run(feeds);

        // The output is an array of tensors, we assume the first one is the mask
        // and it is the only output of the model.
        // If the model has multiple outputs, you may need to adjust this.
        const output = results[model.outputNames[0]];
        if (!output) {
          console.warn("Model did not return any results");
          return;
        }

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
      <div className="p-5 mb-5">
        <div>
          <label htmlFor="image-url" className="p-2 w-30">Image URL:</label>
          <input
            id="image-url"
            className="p-2 border-1 rounded-lg"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
          />
        </div>

        <button
          className="p-2 border-1 mt-2 rounded-lg cursor-pointer bg-[#4CAF50] disabled:bg-gray-400 text-white"
          type="button"
          onClick={handleLoad}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Process Image"} button
        </button>
        {error && <div className="text-red-400 mt-3">{error}</div>}
      </div>

      <Stage />
    </>
  );
}

export default App;
