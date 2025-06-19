    // const chatBox = document.getElementById("chat");
    // const audioInput = document.getElementById("audioInput");

    // audioInput.addEventListener("change", async (e) => {
    // const file = e.target.files[0];
    // if (!file || !file.type.startsWith("audio/")) {
    //     alert("Please upload a valid audio file.");
    //     return;
    // }

    // const audioBlobUrl = URL.createObjectURL(file);
    // appendAudioMessage(audioBlobUrl);
    // appendTextMessage("Transcribing...", "bot");

    // const wavFile = await convertToWav(file);
    // const responseText = await sendToAPI(wavFile);
    // updateLastBotMessage(responseText);
    // });

    // function appendAudioMessage(audioUrl) {
    // const wrapper = document.createElement("div");
    // wrapper.className = "message-block";

    // const avatar = document.createElement("div");
    // avatar.className = "avatar";

    // const audioDiv = document.createElement("div");
    // audioDiv.className = "audio-block";
    // audioDiv.innerHTML = `   <audio controls>
    //     <source src="${audioUrl}" type="audio/wav">
    //     Your browser does not support the audio element.
    //     </audio>
    // `;

    // wrapper.appendChild(avatar);
    // wrapper.appendChild(audioDiv);
    // chatBox.appendChild(wrapper);
    // }

    // function appendTextMessage(text, sender) {
    // const wrapper = document.createElement("div");
    // wrapper.className = "message-block";

    // const avatar = document.createElement("div");
    // avatar.className = "avatar";

    // const textDiv = document.createElement("div");
    // textDiv.className = "text-message";
    // textDiv.textContent = text;

    // wrapper.appendChild(avatar);
    // wrapper.appendChild(textDiv);
    // chatBox.appendChild(wrapper);
    // chatBox.scrollTop = chatBox.scrollHeight;
    // }

    // function updateLastBotMessage(newText) {
    // const messages = document.querySelectorAll(".text-message");
    // if (messages.length > 0) {
    //     messages[messages.length - 1].textContent = newText;
    // }
    // }

    // // Convert to WAV
    // async function convertToWav(file) {
    // return new Promise((resolve, reject) => {
    //     const context = new AudioContext();
    //     const reader = new FileReader();

    //     reader.onload = async () => {
    //     try {
    //         const arrayBuffer = reader.result;
    //         const audioBuffer = await context.decodeAudioData(arrayBuffer);
    //         const wav = encodeWav(audioBuffer);
    //         const blob = new Blob([wav], { type: "audio/wav" });
    //         resolve(new File([blob], "converted.wav", { type: "audio/wav" }));
    //     } catch (e) {
    //         reject(e);
    //     }
    //     };

    //     reader.readAsArrayBuffer(file);
    // });
    // }

    // function encodeWav(audioBuffer) {
    // const numChannels = audioBuffer.numberOfChannels;
    // const sampleRate = audioBuffer.sampleRate;
    // const length = audioBuffer.length * numChannels * 2 + 44;
    // const buffer = new ArrayBuffer(length);
    // const view = new DataView(buffer);

    // const writeString = (view, offset, str) => {
    //     for (let i = 0; i < str.length; i++) {
    //     view.setUint8(offset + i, str.charCodeAt(i));
    //     }
    // };

    // writeString(view, 0, "RIFF");
    // view.setUint32(4, length - 8, true);
    // writeString(view, 8, "WAVE");
    // writeString(view, 12, "fmt ");
    // view.setUint32(16, 16, true);
    // view.setUint16(20, 1, true);
    // view.setUint16(22, numChannels, true);
    // view.setUint32(24, sampleRate, true);
    // view.setUint32(28, sampleRate * numChannels * 2, true);
    // view.setUint16(32, numChannels * 2, true);
    // view.setUint16(34, 16, true);
    // writeString(view, 36, "data");
    // view.setUint32(40, length - 44, true);

    // let offset = 44;
    // for (let i = 0; i < audioBuffer.length; i++) {
    //     for (let ch = 0; ch < numChannels; ch++) {
    //     const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
    //     view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    //     offset += 2;
    //     }
    // }

    // return buffer;
    // }

    // // Send to transcription API
    // async function sendToAPI(file) {
    // const formData = new FormData();
    // formData.append("file", file);

    // try {
    //     const res = await fetch("http://98.70.11.123:3045/transcribe", {
    //     method: "POST",
    //     body: formData
    //     });
    //     const data = await res.json();
    //     return data.transcription || "No transcription received.";
    // } catch (err) {
    //     console.error(err);
    //     return "Error transcribing audio.";
    //   }
    // }




let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let recognition;

const micBtn = document.getElementById("micBtn");

micBtn.addEventListener("mousedown", async () => {
  isRecording = true;
  startSpeechRecognition();
  await startAudioRecording();
});

micBtn.addEventListener("mouseup", () => {
  isRecording = false;
  stopSpeechRecognition();
  stopAudioRecording();
});

// 🎤 Speech Recognition Setup
function startSpeechRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = event.results[event.results.length - 1][0].transcript;
    appendTextMessage(transcript, "user"); // Live update user message

    if (event.results[event.results.length - 1].isFinal) {
      sendToAPI(transcript).then(response => {
        appendTextMessage(response, "bot");
      });
    }
  };

  recognition.start();
}

function stopSpeechRecognition() {
  if (recognition) {
    recognition.stop();
  }
}

// 🎙 Audio Recording Setup
async function startAudioRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    appendAudioMessage(audioUrl, "user"); // 👈 Add recorded audio to chat
  };

  mediaRecorder.start();
}

function stopAudioRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

// 📤 Send transcript to API
async function sendToAPI(text) {
  try {
    const res = await fetch("http://98.70.11.123:3045/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    return data.response || "No response.";
  } catch (err) {
    console.error("API error:", err);
    return "Error from server.";
  }
}
