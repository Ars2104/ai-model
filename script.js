const URL = "./";

let model;
let labelContainer;
let maxPredictions;
let videoElement;

let smoothedClass = "";
let smoothedProb = 0;
const SMOOTHING = 0.85;

async function init() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        console.log("Loading model...");
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Model loaded!");

        // ✅ Use raw getUserMedia instead of tmImage.Webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        videoElement = document.createElement("video");
        videoElement.srcObject = stream;
        videoElement.width = 300;
        videoElement.height = 300;
        videoElement.autoplay = true;
        videoElement.style.borderRadius = "20px";
        videoElement.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";

        const container = document.getElementById("webcam-container");
        container.innerHTML = "";
        container.appendChild(videoElement);

        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = "";

        videoElement.onloadedmetadata = () => {
            console.log("Camera started!");
            loop();
        };

    } catch (error) {
        console.error("Full error:", error);
        const msg = error?.message || error?.name || String(error);
        alert("Error: " + msg + "\n\nOpen F12 Console for details.");
    }
}

function loop() {
    predict();
    requestAnimationFrame(loop);
}

async function predict() {
    if (!videoElement || videoElement.readyState < 2) return;

    const prediction = await model.predict(videoElement);

    let max = prediction[0];
    for (let i = 1; i < prediction.length; i++) {
        if (prediction[i].probability > max.probability) {
            max = prediction[i];
        }
    }

    smoothedProb = SMOOTHING * smoothedProb + (1 - SMOOTHING) * max.probability;

    if (max.className !== smoothedClass && max.probability > 0.75) {
        smoothedClass = max.className;
    }

    labelContainer.innerHTML = `
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 6px;">
            ${smoothedClass}
        </div>
        <div style="font-size: 16px;">
            ${(smoothedProb * 100).toFixed(1)}%
        </div>
    `;
}