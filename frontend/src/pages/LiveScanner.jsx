import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function LiveScanner(){
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading models & labels...');
  const faceMatcherRef = useRef(null);
  const labelsRef = useRef([]); // array of { user_id, name, descriptors }
  const cooldownRef = useRef({}); // user_id -> timestamp last recorded

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // load face-api in browser
        const faceapi = await import('face-api.js');

        setStatus('Loading models...');
        // Load models from CDN instead of backend
        const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        setStatus('Fetching labels...');
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:4000/api/labels', { headers: { Authorization: 'Bearer ' + token } });
        const labels = res.data || [];

        // build LabeledFaceDescriptors
        const labeledDescriptors = labels.map(l => {
          const descriptors = l.descriptors.map(d => new Float32Array(d));
          return new faceapi.LabeledFaceDescriptors(String(l.user_id), descriptors);
        });

        faceMatcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.55); // threshold: 0.55
        labelsRef.current = labels;

        setStatus('Starting camera...');
        await startCamera();

        // start periodic detection
        setStatus('Scanning...');
        const intervalId = setInterval(() => detectAndMatch(faceapi), 800);

        setLoading(false);

        // cleanup on unmount
        return () => {
          mounted = false;
          clearInterval(intervalId);
          stopCamera();
        };
      } catch (e) {
        console.error(e);
        setStatus('Initialization failed: ' + (e.message || e));
        setLoading(false);
      }
    })();

    // cleanup handled above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera(){
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  function stopCamera(){
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  async function detectAndMatch(faceapi){
    if (!videoRef.current || videoRef.current.readyState !== 4) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    // detect faces
    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
    const resized = faceapi.resizeResults(detections, displaySize);

    // draw
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const det of resized) {
      const box = det.detection.box;
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      if (!faceMatcherRef.current) continue;
      const best = faceMatcherRef.current.findBestMatch(det.descriptor);
      const label = best.label; // user_id string or 'unknown'
      const distance = best.distance;

      // draw label
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.font = '14px sans-serif';
      ctx.fillRect(box.x, box.y - 22, box.width, 22);
      ctx.fillStyle = '#fff';
      const name = label === 'unknown' ? 'Unknown' : (labelsRef.current.find(l => String(l.user_id) === label)?.name || 'Unknown');
      ctx.fillText(`${name} (${distance.toFixed(2)})`, box.x + 4, box.y - 6);

      if (label !== 'unknown') {
        const userId = Number(label);
        // cooldown to prevent duplicates (10 seconds)
        const last = cooldownRef.current[userId] || 0;
        const now = Date.now();
        if (now - last > 10000) {
          // record attendance
          recordAttendance(userId);
          cooldownRef.current[userId] = now;
        }
      }
    }
  }

  async function recordAttendance(user_id) {
    try {
      setStatus('Recording attendance for user ' + user_id);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:4000/api/attendance', { user_id }, { headers: { Authorization: 'Bearer ' + token } });
      // visual feedback
      setStatus('Attendance recorded: ' + user_id + ' ?');
      // optionally play a sound or flash UI
      setTimeout(()=>setStatus('Scanning...'), 1500);
    } catch (e) {
      console.error(e);
      setStatus('Failed to record attendance: ' + (e.message || e));
    }
  }

  async function captureAndUpload(userIdIfKnown = null) {
    // capture current frame to send to backend as photo (for e.g. student wants to upload live)
    if (!videoRef.current) return alert('Camera not ready');
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      try {
        const form = new FormData();
        form.append('photo', blob, 'capture.jpg');
        // if you want to associate it with the currently logged-in student or temp user
        const currentUserId = userIdIfKnown || prompt('Enter user id to attach (or leave blank)');
        if (currentUserId) form.append('user_id', currentUserId);
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:4000/api/upload-photo', form, { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' }});
        alert('Upload complete. If you attached a user, teacher should register descriptor.');
      } catch (err) {
        console.error(err);
        alert('Upload failed: ' + (err.message || err));
      }
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-3">Live Attendance Scanner</h2>
      <div className="mb-2 text-sm text-gray-600">{status}</div>

      <div style={{ position: 'relative', width: 640, maxWidth: '100%' }}>
        <video ref={videoRef} width="640" height="480" style={{ borderRadius: 6, background: '#000' }} muted />
        <canvas ref={canvasRef} width="640" height="480" style={{ position: 'absolute', left: 0, top: 0 }} />
      </div>

      <div className="mt-3 flex gap-2">
        <button className="btn" onClick={() => captureAndUpload()}>Capture & Upload Photo</button>
        <button className="btn btn-ghost" onClick={() => { cooldownRef.current = {}; setStatus('Cooldown cleared'); }}>Clear Cooldown</button>
      </div>

      <p className="mt-3 text-sm text-gray-500">Models loaded from CDN. Make sure your browser allows camera access.</p>
    </div>
  );
}
