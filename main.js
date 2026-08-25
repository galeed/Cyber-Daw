// main.js - Código Unificado e Interactivo
let audioCtx = null;
let cyberWorkletNode = null;
let playheadX = 0;

// 1. INICIALIZACIÓN DEL MOTOR DE AUDIO
async function initAudioEngine() {
  if (audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass({ sampleRate: 48000 });

  try {
    await audioCtx.audioWorklet.addModule('audio-processor.js');
    cyberWorkletNode = new AudioWorkletNode(audioCtx, 'cyber-audio-processor');
    cyberWorkletNode.connect(audioCtx.destination);
    console.log('⚡ Cyber Engine: AudioWorklet listo.');
  } catch (error) {
    console.error('Error al cargar AudioWorklet:', error);
  }
}

// 2. TIMELINE CANVAS (REJILLA Y PLAYHEAD)
const canvas = document.getElementById('timelineCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawCanvasWithPlayhead();
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Rejilla vertical (Compases)
  const gridSpacing = 60;
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Divisiones horizontales (Pistas)
  const trackHeight = 74;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  for (let y = trackHeight; y < canvas.height; y += trackHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawCanvasWithPlayhead() {
  drawGrid();
  // Aguja de reproducción (Playhead)
  ctx.strokeStyle = '#ff0055';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, canvas.height);
  ctx.stroke();
}

// 3. EVENTOS Y CONTROLADORES INTERACTIVOS
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Canvas
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Clic en Timeline para mover el Playhead
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    playheadX = e.clientX - rect.left;
    drawCanvasWithPlayhead();
  });

  // Botones de Transporte (Play, Stop, Rec)
  const btnPlay = document.getElementById('btnPlay');
  const btnStop = document.getElementById('btnStop');
  const btnRec = document.getElementById('btnRec');

  btnPlay.addEventListener('click', async () => {
    await initAudioEngine();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    cyberWorkletNode.port.postMessage({
      type: 'SET_PARAM',
      key: 'isPlaying',
      value: true
    });

    btnPlay.classList.add('neon-button-active');
  });

  btnStop.addEventListener('click', () => {
    if (!cyberWorkletNode) return;
    cyberWorkletNode.port.postMessage({
      type: 'SET_PARAM',
      key: 'isPlaying',
      value: false
    });

    btnPlay.classList.remove('neon-button-active');
  });

  btnRec.addEventListener('click', () => {
    btnRec.classList.toggle('active');
  });

  // Botones de Pista (Mute, Solo, Record)
  document.querySelectorAll('.track-controls').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target;
      if (!btn.classList.contains('btn-mini')) return;

      const action = btn.textContent.trim();
      if (action === 'M') btn.classList.toggle('active-mute');
      if (action === 'S') btn.classList.toggle('active-solo');
      if (action === 'R') btn.classList.toggle('btn-rec');
    });
  });

  // Pestañas del Dock Inferior
  const tabs = document.querySelectorAll('.dock-tabs .tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Faders del Mezclador (Arrastrar con el ratón)
  document.querySelectorAll('.fader-container').forEach((fader) => {
    const handle = fader.querySelector('.fader-handle');
    const dbText = fader.nextElementSibling;
    let isDragging = false;

    const updateFader = (e) => {
      if (!isDragging) return;
      const rect = fader.getBoundingClientRect();
      let offsetY = e.clientY - rect.top;

      offsetY = Math.max(0, Math.min(offsetY, rect.height));
      const percent = 100 - (offsetY / rect.height) * 100;
      handle.style.bottom = `${percent}%`;

      const db = ((percent / 100) * 66 - 60).toFixed(1);
      if (dbText) dbText.textContent = `${db > 0 ? '+' + db : db} dB`;

      if (cyberWorkletNode) {
        cyberWorkletNode.port.postMessage({
          type: 'SET_PARAM',
          key: 'gain',
          value: percent / 100
        });
      }
    };

    handle.addEventListener('mousedown', () => (isDragging = true));
    window.addEventListener('mouseup', () => (isDragging = false));
    window.addEventListener('mousemove', updateFader);
  });
});
