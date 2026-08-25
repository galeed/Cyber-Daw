// Activar comportamiento interactivo en controles de pista (M, S, R)
document.querySelectorAll('.track-controls').forEach((group) => {
  group.addEventListener('click', (e) => {
    const btn = e.target;
    if (!btn.classList.contains('btn-mini')) return;

    const action = btn.textContent.trim();

    if (action === 'M') {
      btn.classList.toggle('active-mute');
    } else if (action === 'S') {
      btn.classList.toggle('active-solo');
    } else if (action === 'R') {
      btn.classList.toggle('btn-rec');
      btn.classList.toggle('active');
    }
  });
});

// Cambio de pestañas en el dock inferior
const tabs = document.querySelectorAll('.dock-tabs .tab');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    // Aquí se renderizará el contenido de la pestaña seleccionada
    console.log(`Vista cambiada a: ${tab.textContent}`);
  });
});


// Control táctil / ratón para los Faders del Mezclador
document.querySelectorAll('.fader-container').forEach((fader) => {
  const handle = fader.querySelector('.fader-handle');
  const dbText = fader.nextElementSibling;
  let isDragging = false;

  const updateFader = (e) => {
    if (!isDragging) return;
    const rect = fader.getBoundingClientRect();
    let offsetY = e.clientY - rect.top;

    // Limitar movimiento dentro del fader
    offsetY = Math.max(0, Math.min(offsetY, rect.height));
    const percent = 100 - (offsetY / rect.height) * 100;
    
    handle.style.bottom = `${percent}%`;

    // Convertir porcentaje a escala aproximada de dB (-60 dB a +6 dB)
    const db = ((percent / 100) * 66 - 60).toFixed(1);
    if (dbText) dbText.textContent = `${db > 0 ? '+' + db : db} dB`;

    // Enviar cambio de volumen al AudioWorklet si la pista está conectada
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
