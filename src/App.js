import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as secret from './secret.json';
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import Speech from 'speak-tts'
import Clarifai from "clarifai";
import vision from "react-cloud-vision-api";

vision.init({ auth: secret.CloudVisionApiKey })

const clarifai = new Clarifai.App({
  apiKey: secret.ClarifaiApiKey
});

function App() {
  const webcamRef = useRef(null);

  const [videoConstraints, setVideoConstraints] = useState(null);

  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });


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
    clarifai.models.predict(Clarifai.GENERAL_MODEL, secret.TestImgURL).then(
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
          facingMode: "user", aspectRatio: 1
        });
      }

      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      const obj = await net.detect(video);

      setLastObj(obj)


      // drawRect(obj, ctx);
    }
  };

  useEffect(() => {

    runCoco();

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();

    setVideoConstraints({
      facingMode: { exact: "environment" }, aspectRatio: 1
    });

    return () => {
      window.removeEventListener("resize", handleResize)
    };

  },[]);

  return (
    <div className="App">
        <button onClick={readPrediction}>
          Read what's in this picture
        </button>

        <button onClick={detectWithGoogle}>
          Detect with Google  
        </button>
        <div className="webcam-wrapper"> 
          <Webcam
            ref={webcamRef}
            mirrored={false}
            muted={true} 
            style={{
              zindex: 9,
              width: windowSize.width,
              height: 480,
            }}
            forceScreenshotSourceSize="true"
            videoConstraints={videoConstraints}
          />
        </div>


    </div>
  );
}

export default App;
