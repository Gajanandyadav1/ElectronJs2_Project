const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const video = document.querySelector('video');
const audioPlayer = document.getElementById('audioPlayer');

let mediaRecorder;
let recordedChunks = [];

startButton.addEventListener('click', async () => {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true // System audio
    });

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // System audio
    const systemSource = audioContext.createMediaStreamSource(displayStream);
    systemSource.connect(destination);

    // Mic audio
    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);

    // Final audio-only stream
    const combinedAudioStream = new MediaStream([
      ...destination.stream.getAudioTracks()
    ]);

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(combinedAudioStream, {
      mimeType: 'audio/webm'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      audioPlayer.src = url;
      audioPlayer.controls = true;
      audioPlayer.play();

      // Create download link with .mp3 name (even though it's webm format)
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'recorded_audio.mp3'; // Just name, still webm content
      downloadLink.textContent = 'Download MP3';
      downloadLink.style.display = 'inline-block';
      downloadLink.style.marginTop = '10px';
      downloadLink.style.color = '#007bff';
      downloadLink.style.textDecoration = 'underline';

      const existingLink = document.getElementById('downloadLink');
      if (existingLink) existingLink.remove();

      downloadLink.id = 'downloadLink';
      document.getElementById('tab3').appendChild(downloadLink);
    };

    mediaRecorder.start();
  } catch (e) {
    console.error('Error capturing audio:', e);
  }
});


stopButton.addEventListener('click', () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
});