// main.js
let audioCtx = null;
let cyberWorkletNode = null;

// Inicialización del motor de audio (requiere interacción del usuario)
async function initAudioEngine() {
  if (audioCtx) return;

  // Crear contexto de audio a 48 kHz
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass({ sampleRate: 48000 });

  // Cargar el módulo AudioWorklet
  try {
    await audioCtx.audioWorklet.addModule('audio-processor.js');
    cyberWorkletNode = new AudioWorkletNode(audioCtx, 'cyber-audio-processor');
    
    // Conectar el nodo de audio a los altavoces
    cyberWorkletNode.connect(audioCtx.destination);
    console.log('⚡ Cyber Engine: AudioWorklet cargado y listo.');
  } catch (error) {
    console.error('Error al cargar el AudioWorklet:', error);
  }
}

// Mapeo de controles de la interfaz
document.addEventListener('DOMContentLoaded', () => {
  const btnPlay = document.getElementById('btnPlay');
  const btnStop = document.getElementById('btnStop');

  btnPlay.addEventListener('click', async () => {
    await initAudioEngine();
    
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Enviar señal de inicio al procesador
    cyberWorkletNode.port.postMessage({
      type: 'SET_PARAM',
      key: 'isPlaying',
      value: true
    });

    btnPlay.classList.add('neon-button-active');
  });

  btnStop.addEventListener('click', () => {
    if (!cyberWorkletNode) return;

    // Enviar señal de detención al procesador
    cyberWorkletNode.port.postMessage({
      type: 'SET_PARAM',
      key: 'isPlaying',
      value: false
    });

    btnPlay.classList.remove('neon-button-active');
  });
});
