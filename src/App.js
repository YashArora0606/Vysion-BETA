import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
// e.g. import * as tfmodel from "@tensorflow-models/tfmodel";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
// e.g. import { drawRect } from "./utilities";
import { drawRect } from "./utilities";

import * as secret from './secret.json';

import Speech from 'speak-tts' // es6
import Clarifai from "clarifai";

import vision from "react-cloud-vision-api";

vision.init({ auth: secret.CloudVisionApiKey })

const clarifai = new Clarifai.App({
  apiKey: '0e8a54fdb85b471b92a80fe9992d30d5'
 });
 

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoConstraints, setVideoConstraints] = useState(null);

  const [lastObj, setLastObj] = useState(null);

  const runCoco = async () => {
    const net = await cocossd.load();
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const readPrediction = async () => {
    const speech = new Speech() // will throw an exception if not browser supported

    lastObj.forEach(prediction => {
      const guess = prediction['class'];
      speech.speak({
        text: guess,
      })
    })
  }

  const readPredictions = async (predictions) => {
    const speech = new Speech() // will throw an exception if not browser supported

    predictions.forEach(prediction => {
      const guess = prediction.description;
      speech.speak({
        text: guess,
      })
    })
  }

  const detectWithGoogle = async() => {
    const b64 = webcamRef.current.getScreenshot();

    const req = new vision.Request({
      image: new vision.Image({
        base64: b64
      }),
      features: [
        new vision.Feature('TEXT_DETECTION', 4),
        new vision.Feature('LABEL_DETECTION', 10),
      ]
    });
    console.log(req)
    vision.annotate(req).then((res) => {
      console.log(res.responses[0].labelAnnotations)
      readPredictions(res.responses[0].labelAnnotations)
      console.log(res.responses[0].textAnnotations)
    }, (e) => {
      console.log('Error: ', e)
    })
  }

  const detectWithClarifai = async () => {
    clarifai.models.predict(Clarifai.GENERAL_MODEL, "https://i1.wp.com/www.allstate.com/blog/wp-content/uploads/2019/02/Stop-sign-along-country-road_Getty_cropped.jpg").then(
      function (response) {
        console.log(response.outputs[0].data.concepts);
      },
      function (err) {
      }
    );
  }

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {

      if (!webcamRef.current.state.hasUserMedia) {
        setVideoConstraints({
          facingMode: "user"
        });
      }

      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const obj = await net.detect(video);

      setLastObj(obj)

      const ctx = canvasRef.current.getContext("2d");

      // drawRect(obj, ctx);
    }
  };

  useEffect(()=>{
    
    runCoco();

    setVideoConstraints({
      facingMode: { exact: "environment" }
    });
  
  },[]);

  return (
    <div className="App">
        <button onClick={readPrediction}>
          Read what's in this picture
        </button>
        {/* <button onClick={detectWithClarifai}>
          Detect with Clarifai  
        </button> */}
        <button onClick={detectWithGoogle}>
          Detect with Google  
        </button>
        <Webcam
          ref={webcamRef}
          mirrored={false}
          muted={true} 
          style={{
            zindex: 9,
            width: 640,
            height: 480,
          }}
          videoConstraints={videoConstraints}
        />
        <canvas
          ref={canvasRef}
          style={{
            zindex: 8,
            width: 640,
            height: 480,
          }}
        />

    </div>
  );
}

export default App;
