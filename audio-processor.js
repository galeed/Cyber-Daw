// audio-processor.js
class CyberAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    // Escuchar mensajes desde el hilo principal (main.js)
    this.port.onmessage = (event) => {
      if (event.data.type === 'SET_PARAM') {
        this[event.data.key] = event.data.value;
      }
    };
    this.frequency = 220; // Frecuencia base en Hz
    this.gain = 0.2;       // Volumen inicial
    this.isPlaying = false;
  }

  // Define los parámetros audibles que pueden automatizarse
  static get parameterDescriptors() {
    return [
      { name: 'customGain', defaultValue: 0.2, minValue: 0, maxValue: 1 }
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelLeft = output[0];
    const channelRight = output[1];

    if (!channelLeft) return true;

    // Generación de audio muestra por muestra (128 samples por bloque)
    for (let i = 0; i < channelLeft.length; i++) {
      let sample = 0;

      if (this.isPlaying) {
        // Generador simple de onda diente de sierra (Sawtooth)
        this.phase += this.frequency / sampleRate;
        if (this.phase >= 1.0) this.phase -= 1.0;
        sample = (this.phase * 2 - 1) * this.gain;
      }

      // Escribir en canal izquierdo y derecho
      channelLeft[i] = sample;
      if (channelRight) channelRight[i] = sample;
    }

    return true; // Mantiene vivo el hilo del procesador
  }
}

registerProcessor('cyber-audio-processor', CyberAudioProcessor);
