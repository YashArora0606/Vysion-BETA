import React, { useRef, useState, useEffect } from "react";
import "./App.css";
// import * as tf from "@tensorflow/tfjs";
// import * as secret from './secret.json';
// import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import Speech from 'speak-tts'
// import Clarifai from "clarifai";
import vision from "react-cloud-vision-api";
// import Toggle from 'react-toggle'

import VisibilityRoundedIcon from '@material-ui/icons/VisibilityRounded';
// import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';
// import { makeStyles } from '@material-ui/core/styles';
// import { SignalCellularNull } from "@material-ui/icons";
import Logo from "./logo.png"



// vision.init({ auth: secret.CloudVisionApiKey });

// var cloudsight = require ('cloudsight') ({
//   apikey: '35c205f6bf33ea2c4a573cee2f321fcf'
// });
// var image = {
//   remote_image_url: '../resources/img1.jpg',
//   locale: 'en-US'
// };
// const clarifai = new Clarifai.App({
//   apiKey: secret.ClarifaiApiKey
// });

function App() {
  const webcamRef = useRef(null);

  const [videoConstraints, setVideoConstraints] = useState(null);
  const [objectPredictions, setObjectPredictions] = useState("No detections made.");
  const [fullTextPrediction, setFullTextPrediction] = useState("No detections made.");
  const [textToSpeech, setTextToSpeech] = useState(false);


  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  const readPrediction = async (guess) => {
    if (textToSpeech) {
      const speech = new Speech()
      speech.speak({
        text: guess,
      });
    }
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
    vision.annotate(req).then((res) => {

      console.log(res.responses)

      if (typeof res.responses !== 'undefined' && res.responses.length > 0) {

        const resp = res.responses[0];

        if (typeof resp.labelAnnotations !== 'undefined') {

          var result = resp.labelAnnotations[0].description;
          for (var i = 1; i < resp.labelAnnotations.length; i++) {
            result += ", " + resp.labelAnnotations[i].description;
          }
          setObjectPredictions(result);
        } else {
          const noObjects = "No objects in this image."
          setObjectPredictions(noObjects)
        }


        if (typeof resp.fullTextAnnotation !== 'undefined') {
          var result = resp.fullTextAnnotation.text.replace(/\n/g, ", ");
          setFullTextPrediction(result)
          readPrediction(result)
        } else {
          const noText = "No text in this image."
          setFullTextPrediction(noText)
          readPrediction(noText)
        }
      }      
    }, (e) => {
      console.log('Error: ', e)
    });
  }

  const toggleTextToSpeech = () => {
    setTextToSpeech(!textToSpeech);
  }

  useEffect(() => {

    function handleResize() {      
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    // setVideoConstraints({
    //   facingMode: { exact: "environment" }, aspectRatio: 1
    // });

    if (!webcamRef.current.state.hasUserMedia) {
      setVideoConstraints({
        facingMode: "user", aspectRatio: 1
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize)
    };

  },[webcamRef]);

  return (
    <div className="App">
        <div className="header">
          <img className="photo" src={Logo} alt=""/>
          {/* <div className="title">
            Vysion
          </div> */}
        </div>
        <div className="webcam-wrapper"> 
          <Webcam
            className="webcam"
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
        {/* <div>
          <label>
            <Toggle
              defaultChecked={textToSpeech}
              icons={false}
              onChange={toggleTextToSpeech} />
            <span>Text to Speech</span>
          </label>
        </div> */}
        <div className="predictions">
            <p>
              <b>Unfortunately, some dependencies for Vysion have been depricated 😞. <br></br> Don't worry though, we're coming back better than ever on iOS by mid October!<br></br></b>
            </p>

        </div>
        {/* <div className="detect">
          <Button
            size="large"
            variant="contained"
            color="default"
            className={"button"}
            startIcon={<VisibilityRoundedIcon />}
            onClick={detectWithGoogle}
          >
            Detect
          </Button>
        </div> */}
        {/* <div className="predictions">
            <p>
              <b>Text:<br></br></b>
              {fullTextPrediction}
            </p>
            <p>
              <b>Objects:<br></br></b>
              {objectPredictions}
            </p>
        </div> */}
        <div className="footer">
          <p>
            Made with ❤️ and ☕
            <br></br>
            © Yash Arora 2021
          </p>
        </div>

    </div>
  );
}

export default App;
