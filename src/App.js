import React, { useRef, useState, useEffect } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as secret from './secret.json';
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import Speech from 'speak-tts'
import Clarifai from "clarifai";
import vision from "react-cloud-vision-api";
import Toggle from 'react-toggle'

import VisibilityRoundedIcon from '@material-ui/icons/VisibilityRounded';
import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { SignalCellularNull } from "@material-ui/icons";


vision.init({ auth: secret.CloudVisionApiKey });

var cloudsight = require ('cloudsight') ({
  apikey: '35c205f6bf33ea2c4a573cee2f321fcf'
});
 
var image = {
  remote_image_url: '../resources/img1.jpg',
  locale: 'en-US'
};

const clarifai = new Clarifai.App({
  apiKey: secret.ClarifaiApiKey
});

function App() {
  const webcamRef = useRef(null);

  const [videoConstraints, setVideoConstraints] = useState(null);
  const [objectPredictions, setObjectPredictions] = useState([]);
  const [textPredictions, setTextPredictions] = useState([]);
  const [fullTextPrediction, setFullTextPrediction] = useState("No prediction made.");
  const [textToSpeech, setTextToSpeech] = useState(true);


  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });


  // const [lastObj, setLastObj] = useState(null);

  // const runCoco = async () => {
  //   const net = await cocossd.load();
  //   setInterval(() => {
  //     detect(net);
  //   }, 10);
  // };

  // const readPrediction = async () => {
  //   const speech = new Speech() // will throw an exception if not browser supported

  //   lastObj.forEach(prediction => {
  //     const guess = prediction['class'];
  //     speech.speak({
  //       text: guess,
  //     })
  //   })
  // }

  const readPredictions = async (predictions) => {
    const speech = new Speech() // will throw an exception if not browser supported

    predictions.forEach(prediction => {
      const guess = prediction.description;
      speech.speak({
        text: guess,
      })
    })
  }

  const readPrediction = async (guess) => {
    const speech = new Speech() // will throw an exception if not browser supported
    speech.speak({
      text: guess,
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
    // console.log(req)
    vision.annotate(req).then((res) => {
      console.log(res.responses)

      if (typeof res.responses !== 'undefined' && res.responses.length > 0) {

        const resp = res.responses[0];

        if (typeof resp.labelAnnotations !== 'undefined') {
          setObjectPredictions(res.responses[0].labelAnnotations);
        } 
        if (typeof resp.textAnnotations !== 'undefined') {
          setTextPredictions(res.responses[0].textAnnotations);
        }
        if (typeof resp.fullTextAnnotation !== 'undefined') {
          setFullTextPrediction(res.responses[0].fullTextAnnotation.text)
          readPrediction(res.responses[0].fullTextAnnotation.text)
        }
      }      
    }, (e) => {
      console.log('Error: ', e)
    });
  }

  // const detectWithClarifai = async () => {
  //   clarifai.models.predict(Clarifai.GENERAL_MODEL, secret.TestImgURL).then(
  //     function (response) {
  //       console.log(response.outputs[0].data.concepts);
  //     },
  //     function (err) {
  //     }
  //   );
  // }

  // const detect = async (net) => {
  //   if (
  //     typeof webcamRef.current !== "undefined" &&
  //     webcamRef.current !== null &&
  //     webcamRef.current.video.readyState === 4
  //   ) {

  //     if (!webcamRef.current.state.hasUserMedia) {
  //       setVideoConstraints({
  //         facingMode: "user", aspectRatio: 1
  //       });
  //     }

  //     const video = webcamRef.current.video;
  //     const videoWidth = webcamRef.current.video.videoWidth;
  //     const videoHeight = webcamRef.current.video.videoHeight;

  //     webcamRef.current.video.width = videoWidth;
  //     webcamRef.current.video.height = videoHeight;

  //     // const obj = await net.detect(video);
  //     // setLastObj(obj)
  //     // drawRect(obj, ctx);
  //   }
  // };

  const toggleTextToSpeech = () => {
    setTextToSpeech(!textToSpeech);
  }

  useEffect(() => {

    // runCoco();

    function handleResize() {

      // console.log(window.innerWidth)
      
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
    // console.log("setting to outer cam")

    if (!webcamRef.current.state.hasUserMedia) {
      setVideoConstraints({
        facingMode: "user", aspectRatio: 1
      });
      // console.log("setting to inner cam")

    }

    return () => {
      window.removeEventListener("resize", handleResize)
    };

  },[webcamRef]);

  return (
    <div className="App">
        <div className="header">
          <p>Vysion2 BETA</p>
        </div>
        <div className="webcam-wrapper"> 
          <Webcam
            ref={webcamRef}
            mirrored={false}
            muted={true} 
            style={{
              zindex: 9,
              width: windowSize.width > 480 ? 480 : windowSize.width,
              height: windowSize.width > 480 ? 480 : windowSize.width,
            }}
            forceScreenshotSourceSize="true"
            videoConstraints={videoConstraints}
          />
        </div>
        <div>
          <label>
            <Toggle
              defaultChecked={textToSpeech}
              icons={false}
              onChange={toggleTextToSpeech} />
            <span>Text to Speech</span>
          </label>
        </div>
        <div>
            <p>
              {fullTextPrediction}
            </p>
            <p>
              {objectPredictions.map((object) => {
                return <span key={object.description}>{object.description}</span>
              })}
            </p>
        </div>
        <div>
          <Button
            size="large"
            variant="contained"
            color="default"
            className={"button"}
            startIcon={<VisibilityRoundedIcon />}
            onClick={detectWithGoogle}
          >
            Read Text
          </Button>
        </div>



    </div>
  );
}

export default App;
