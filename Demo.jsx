import {  useRef, useState } from "react";
import { Paperclip, Mic, Send } from "lucide-react" ;

const ChatApp = () => {
  const [messages, setMessages] = useState([]) ;
  const [input, setInput] = useState("") ;
    const [recording, setRecording] = useState(false) ;
    const audioChunksRef = useRef([]) ; 
    const apiIntervalRef = useRef(null);  
  const chatRef = useRef(null);
 
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Only audio files are allowed!") ;
      return;
    }

    try {
      console.log("🔄 Converting to WAV...");

      // Show Loading Message Before API Response
      setMessages((prev) => [
        ...prev,
        { text: "Loading Response...", sender: "bot", isLoading: true },
      ]);

      const wavFile = await convertToWav(file);
      console.log("✅ WAV File Ready:", wavFile);

      const formData = new FormData();
      formData.append("file", wavFile);

      // Show uploaded file in UI
      setMessages((prev) => [
        ...prev,
        {
          file: URL.createObjectURL(wavFile),
          fileName: wavFile.name,
          fileType: "audio",
          sender: "user",
        },
      ]);

      console.log("🚀 Sending WAV file to API...");
      const response = await fetch("http://98.70.11.123:3045/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(API Error: ${response.statusText});
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      // Remove "Loading Response..." message & Show Transcription
      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading)
          .concat(
            data.success && data.transcription
              ? { text: data.transcription, sender: "bot" }
              : { text: "❌ Transcription failed!", sender: "bot" }
          )
      );
    } catch (error) {
      console.error("❌ Error:", error);
      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading)
          .concat({ text: "Error converting/transcribing audio.", sender: "bot" })
      );
    }
  };

  // ✅ Convert any audio file to WAV before uploading
  const convertToWav = async (file) => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavData = encodeWav(audioBuffer);
          const wavBlob = new Blob([wavData], { type: "audio/wav" });
          const wavFile = new File([wavBlob], file.name.replace(/\.[^/.]+$/, "") + ".wav", {
            type: "audio/wav",
          });

          resolve(wavFile);
        } catch (error) {
          console.error("❌ Error decoding MP3:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // 🔹 Helper function to encode WAV
  const encodeWav = (audioBuffer) => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    writeString(view, 0, "RIFF");
    view.setUint32(4, length - 8, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChannels * 2, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, length - 44, true);

    const channelData = [];
    for (let i = 0; i < numOfChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return buffer;
  };

  // 🔹 Helper function to write strings
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const sendMessage = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { sender: "user", text: input }]);
      setInput("");
    }
  }; 

  const [loading, setLoading] = useState(false);
  const [liveText, setLiveText] = useState("");  
  const recognitionRef = useRef(null);
  let timeoutId = useRef(null);  

  // 🎤 *Start Recording (Live Text + API Call)*
  const startRecording = () => {
    setRecording(true);
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true; // ✅ Continuous speech
    recognition.interimResults = true; // ✅ Real-time text

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let transcript = event.results[event.results.length - 1][0].transcript;
      setLiveText(transcript); // 🔹 Update live text (Google style)

      // 🔹 Final transcript hone par API call set kare (3s delay)
      if (event.results[event.results.length - 1].isFinal) {
        setMessages((prev) => [...prev, { text: transcript, sender: "user" }]);
        setLiveText(""); // 🗑 Clear live typing
        setLoading(true);

        clearTimeout(timeoutId.current);
        timeoutId.current = setTimeout(() => sendToAPI(transcript), 3000);
      }
    };

    recognition.start();
  };

  // 🚀 *Send transcript to API*
  const sendToAPI = async (transcript) => {
    try {
      const response = await fetch("http://98.70.11.123:3045/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data.response, sender: "bot" }]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [...prev, { text: "Error fetching response.", sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  // 🎤 *Stop Recording*
  const stopRecording = () => {
    setRecording(false);
    recognitionRef.current?.stop();
    setLiveText(""); // 🗑 Clear live text
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="w-full sm:w-11/12 md:w-8/12 lg:w-8/12 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col">
      
      {/* Chat messages container */}
      <div className="flex flex-col space-y-3 h-[80vh] overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={flex items-center ${msg.sender === "user" ? "justify-end" : "justify-start"}}>
            {msg.sender === "bot" && (
              <img src="react.svg" alt="Bot" className="rounded-full w-8 h-8 mr-2" />
            )}
            <div className={px-4 py-2 rounded-lg max-w-xs ${msg.sender === "user" ? "bg-green-100 text-black" : "bg-gray-200 text-black"}}>
              {msg.text}
              {msg.file && msg.fileType === "audio" && (
                <audio controls className="mt-2">
                  <source src={msg.file} type="audio/mp3" />
                  Your browser does not support the audio tag.
                </audio>
              )}
            </div>
            {msg.sender === "user" && (
              <img src="/react.svg" alt="User" className="rounded-full w-8 h-8 ml-2" /> 
            )}
          </div>
        ))}
        
        {/* Real-time typing effect */}  
        {liveText && <div className="p-2 my-1 rounded-md bg-blue-200 text-right">{liveText}</div>}
        {loading && <div className="text-white-500"> </div>}
      </div>

      {/* Input Box */}
      <div className="border-t border-gray-300 p-4 flex items-center">
        <input type="file" id="audioInput" accept="audio/*" className="hidden" onChange={handleFileChange} />
        <button className="p-2 text-gray-500 cursor-pointer" onClick={() => document.getElementById("audioInput").click()}>
          <Paperclip size={20} />
        </button>
        
        {/* Mic Button */}
        <button 
          className={p-2 rounded-full transition-all duration-300 ${recording ? "bg-red-500 text-white" : "bg-gray-300 text-black"}} 
          onMouseDown={startRecording} 
          onMouseUp={stopRecording}>
          <Mic size={24} />
        </button>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg p-2 mx-2 outline-none"
        />
        <button onClick={sendMessage} className="bg-black text-white p-2 rounded-lg">
          <Send size={20} />
        </button>
      </div>
    </div>
 
  </div>
  );
};

export default ChatApp;


// ssssssssssssssssssssssssssssssssssssssssssss
