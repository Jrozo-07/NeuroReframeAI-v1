// Variables de estado del Simulador BCI (Valores iniciales base)
let currentBpm = 72;
let currentConductancia = 4.2;
let currentBeta = 0.35;
let stressIndex = 0.35;

// Variables de monitoreo de escritura en tiempo real
let keystrokes = [];
let backspaces = [];

// Elementos de la UI
const valBpm = document.getElementById('valBpm');
const valConductancia = document.getElementById('valConductancia');
const valBeta = document.getElementById('valBeta');
const stressBar = document.getElementById('stressBar');
const stressPercentage = document.getElementById('stressPercentage');
const heartVisual = document.getElementById('heartVisual');

const valWpm = document.getElementById('valWpm');
const valBackspace = document.getElementById('valBackspace');

const thoughtInput = document.getElementById('thoughtInput');
const charCount = document.getElementById('charCount');
const charError = document.getElementById('charError');
const reframeForm = document.getElementById('reframeForm');
const btnSubmit = document.getElementById('btnSubmit');

const placeholderResults = document.getElementById('placeholderResults');
const loaderContainer = document.getElementById('loaderContainer');
const loaderStatus = document.getElementById('loaderStatus');
const resultsContainer = document.getElementById('resultsContainer');

const resSesgo = document.getElementById('resSesgo');
const resFisiologico = document.getElementById('resFisiologico');
const resCot = document.getElementById('resCot');
const resReframeList = document.getElementById('resReframeList');
const btnSpeak = document.getElementById('btnSpeak');

// --- 1. CAPTURA Y ANÁLISIS DEL RITMO DE ESCRITURA ---
// Evento keydown en el textarea para monitorear pulsaciones y teclas de retroceso (Backspace)
thoughtInput.addEventListener('keydown', (e) => {
  const now = Date.now();
  keystrokes.push(now);
  
  if (e.key === 'Backspace') {
    backspaces.push(now);
  }
});

// Función periódica que procesa la velocidad de escritura y calcula métricas biológicas
function updateBiometricsFromTyping() {
  const now = Date.now();
  
  // Filtrar eventos de los últimos 5 segundos (ventana deslizante)
  keystrokes = keystrokes.filter(t => now - t < 5000);
  backspaces = backspaces.filter(t => now - t < 5000);
  
  // Calcular WPM instantáneo (cada 5 caracteres equivalen a 1 palabra promedio)
  // WPM = (pulsaciones en 5s / 5) * 12
  const wpm = Math.round((keystrokes.length / 5) * 12);
  const backspaceCount = backspaces.length;
  
  // Mostrar métricas de escritura en la UI
  if (valWpm) valWpm.innerText = wpm;
  if (valBackspace) valBackspace.innerText = backspaceCount;

  let targetBpm, targetConductancia, targetBeta;
  
  // LOGICA DE TRADUCCIÓN: Ritmo de escritura -> Biometría
  // 1. Escritura rápida (>80 WPM) o correcciones constantes (más de 2 retrocesos recientes)
  if (wpm > 80 || backspaceCount > 2) {
    targetBpm = 95 + Math.random() * 20; // Rango 95-115 BPM
    targetConductancia = 6.0 + Math.random() * 4.0; // Rango 6-10 uS
    targetBeta = 0.65 + Math.random() * 0.25; // Alta agitación cerebral
  }
  // 2. Escritura pausada, rítmica y tranquila (entre 10 y 80 WPM)
  else if (wpm >= 10 && wpm <= 80) {
    targetBpm = 70 + Math.random() * 10; // Rango 70-80 BPM
    targetConductancia = 3.0 + Math.random() * 1.5; // Rango 3.0-4.5 uS
    targetBeta = 0.25 + Math.random() * 0.15; // Concentración relajada
  }
  // 3. Detenido o sin actividad de escritura
  else {
    targetBpm = 62 + Math.random() * 6; // Retorno suave a reposo (62-68 BPM)
    targetConductancia = 2.0 + Math.random() * 0.5; // Retorno a 2.0-2.5 uS
    targetBeta = 0.10 + Math.random() * 0.10; // Relajación basal
  }

  // Interpolación suave (amortiguación) para evitar saltos drásticos en la interfaz visual
  currentBpm = Math.round(currentBpm * 0.75 + targetBpm * 0.25);
  currentConductancia = parseFloat((currentConductancia * 0.75 + targetConductancia * 0.25).toFixed(2));
  currentBeta = parseFloat((currentBeta * 0.75 + targetBeta * 0.25).toFixed(2));

  // Normalización para barra de índice de tensión somática
  const bpmNorm = Math.max(0, Math.min(1, (currentBpm - 60) / 50));
  const condNorm = Math.max(0, Math.min(1, (currentConductancia - 2) / 8));
  const betaNorm = Math.max(0, Math.min(1, (currentBeta - 0.1) / 0.8));
  stressIndex = (bpmNorm * 0.4) + (condNorm * 0.3) + (betaNorm * 0.3);
  const stressPercent = Math.round(stressIndex * 100);

  // Actualizar UI
  valBpm.innerText = currentBpm;
  valConductancia.innerText = currentConductancia.toFixed(1);
  valBeta.innerText = currentBeta.toFixed(2);
  
  stressBar.style.width = `${stressPercent}%`;
  stressPercentage.innerText = `${stressPercent}%`;

  // Control dinámico de la velocidad de latido del corazón visual
  if (heartVisual) {
    const animationDurationSeconds = 60 / currentBpm;
    heartVisual.style.animationDuration = `${animationDurationSeconds}s`;
  }

  // Color de barra de estrés
  if (stressPercent < 45) {
    stressBar.style.backgroundColor = '#10b981';
  } else if (stressPercent < 75) {
    stressBar.style.backgroundColor = '#f59e0b';
  } else {
    stressBar.style.backgroundColor = '#ef4444';
  }
}

// Ejecutar análisis de ritmo de escritura cada 1 segundo (reemplaza el simulador periódico anterior)
setInterval(updateBiometricsFromTyping, 1000);
updateBiometricsFromTyping();


// --- 2. GRAFICADOR CLÍNICO (MONITOR OSCILOSCOPIO) ---
const canvas = document.getElementById('bciCanvas');
const ctx = canvas.getContext('2d');
let offset = 0;

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 60; 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawOscilloscope() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Rejilla de osciloscopio
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.5;
  const spacing = 15;
  
  for (let x = 0; x < canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Línea de señal
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#3b82f6';

  const amp1 = 8 + (stressIndex * 6);
  const freq1 = 0.015 + (currentBeta * 0.015);
  const amp2 = 2 + (stressIndex * 4);
  const freq2 = 0.06 + (currentBeta * 0.04);

  for (let x = 0; x < canvas.width; x++) {
    const y1 = Math.sin(x * freq1 + offset) * amp1;
    const y2 = Math.sin(x * freq2 - offset * 1.5) * amp2;
    const y = canvas.height / 2 + y1 + y2;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  offset += (currentBpm / 60) * 0.04;
  requestAnimationFrame(drawOscilloscope);
}
drawOscilloscope();


// --- 3. VALIDACIÓN DE TEXTO ---
thoughtInput.addEventListener('input', () => {
  const len = thoughtInput.value.length;
  charCount.innerText = `${len} caracteres (mínimo 10)`;
  
  if (len === 0) {
    charError.innerText = '';
    thoughtInput.style.borderColor = '#1f2937';
    btnSubmit.disabled = true;
  } else if (len < 10) {
    charError.innerText = 'El pensamiento debe ser más descriptivo (mín. 10 caracteres).';
    thoughtInput.style.borderColor = 'var(--danger)';
    btnSubmit.disabled = true;
  } else {
    charError.innerText = '';
    thoughtInput.style.borderColor = 'var(--panel-border)';
    btnSubmit.disabled = false;
  }
});


// --- 4. SECUENCIA DE PASOS DE CARGA ---
const loadingSteps = [
  'Procesando señales fisiológicas basales...',
  'Filtrando interferencias somáticas...',
  'Analizando semántica del texto del paciente...',
  'Correlacionando biofeedback y distorsiones cognitivas...',
  'Consultando motor CoT de reencuadre racional...'
];
let stepInterval;

function startLoadingAnimation() {
  let idx = 0;
  loaderStatus.innerText = loadingSteps[idx];
  
  stepInterval = setInterval(() => {
    idx = (idx + 1) % loadingSteps.length;
    loaderStatus.innerText = loadingSteps[idx];
  }, 2000);
}

function stopLoadingAnimation() {
  clearInterval(stepInterval);
}


// --- 5. API DE VOZ DE GOOGLE/SO NATIVO (window.speechSynthesis) ---
let currentUtterance = null;

function speakText(text) {
  window.speechSynthesis.cancel();
  
  if (!text) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.95; // Tono calmado
  utterance.pitch = 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.startsWith('es'));
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }
  
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}


// --- 6. GESTIÓN DEL FORMULARIO Y CONSULTA A LA API ---
reframeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const pensamiento = thoughtInput.value.trim();
  if (pensamiento.length < 10) return;

  // Despacha el objeto biometria capturado en tiempo real en ese instante exacto
  const payload = {
    pensamiento: pensamiento,
    biometria: {
      frecuencia_cardiaca: currentBpm,
      conductancia_cutanea: currentConductancia,
      ondas_cerebrales: currentBeta
    }
  };

  placeholderResults.style.display = 'none';
  resultsContainer.style.display = 'none';
  loaderContainer.style.display = 'flex';
  btnSubmit.disabled = true;
  startLoadingAnimation();

  window.speechSynthesis.cancel();

  try {
    const response = await fetch('/api/reframe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Fallo de procesamiento en el servidor');
    }

    renderClinicalReport(data);

  } catch (error) {
    alert(`Error de Diagnóstico: ${error.message}`);
    placeholderResults.style.display = 'flex';
  } finally {
    stopLoadingAnimation();
    loaderContainer.style.display = 'none';
    btnSubmit.disabled = false;
  }
});


// --- 7. RENDERIZADO DE REPORTE CLÍNICO Y TEXT-TO-SPEECH ---
function renderClinicalReport(data) {
  // 1. Distorsión
  resSesgo.innerText = data.sesgo_detectado;

  // 2. Perfil somático
  resFisiologico.innerText = data.analisis_fisiologico;

  // 3. Cadena de Razonamiento (CoT)
  resCot.innerHTML = '';
  const parsedSteps = parseCot(data.razonamiento_cot);
  
  parsedSteps.forEach(step => {
    const block = document.createElement('div');
    block.className = 'cot-block';
    
    const header = document.createElement('div');
    header.className = 'cot-block-header';
    header.innerText = step.title;
    
    const body = document.createElement('div');
    body.className = 'cot-block-body';
    body.innerText = step.content;
    
    block.appendChild(header);
    block.appendChild(body);
    resCot.appendChild(block);
  });

  // 4. Reencuadres sugeridos
  resReframeList.innerHTML = '';
  data.reencuadres.forEach((ref, index) => {
    const card = document.createElement('div');
    card.className = 'reframe-card';
    
    const header = document.createElement('div');
    header.className = 'reframe-card-header';
    header.innerText = `Opción ${index + 1}`;
    
    const body = document.createElement('div');
    body.className = 'reframe-card-body';
    body.innerText = ref;

    const copyIndicator = document.createElement('div');
    copyIndicator.className = 'reframe-copy-indicator';
    copyIndicator.innerText = 'Click para copiar texto';

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(copyIndicator);

    card.addEventListener('click', () => {
      navigator.clipboard.writeText(ref).then(() => {
        copyIndicator.innerText = 'Copiado al portapapeles';
        copyIndicator.style.color = 'var(--success)';
        setTimeout(() => {
          copyIndicator.innerText = 'Click para copiar texto';
          copyIndicator.style.color = 'var(--text-secondary)';
        }, 1500);
      });
    });

    resReframeList.appendChild(card);
  });

  // Asignar evento al botón "Escuchar"
  btnSpeak.onclick = () => {
    const speechText = `Diagnóstico biométrico corporal: ${data.analisis_fisiologico}. Filtro mental y sesgo detectado: ${data.sesgo_detectado}.`;
    speakText(speechText);
  };

  resultsContainer.style.display = 'flex';

  // Leer automáticamente el diagnóstico biométrico y el sesgo mental detectado
  const autoSpeechText = `Diagnóstico biométrico corporal: ${data.analisis_fisiologico}. Filtro mental y sesgo detectado: ${data.sesgo_detectado}.`;
  
  setTimeout(() => {
    speakText(autoSpeechText);
  }, 300);
}

/**
 * Parsea el texto del CoT para separar por pasos lógicos
 */
function parseCot(text) {
  const steps = [];
  const regex = /(Paso\s+[1-4]|PASO\s+[1-4])[:\-\s]*(.*?)(?=(?:Paso\s+[1-4]|PASO\s+[1-4])|$)/gsi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    let title = match[1].toUpperCase();
    let content = match[2].trim();
    
    if (title.includes('1')) title = 'Paso 1: Diagnóstico Somático';
    if (title.includes('2')) title = 'Paso 2: Evaluación Cognitiva';
    if (title.includes('3')) title = 'Paso 3: Análisis de Coherencia Somático-Mental';
    if (title.includes('4')) title = 'Paso 4: Propuesta de Reencuadre';

    steps.push({ title, content });
  }

  if (steps.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    if (lines.length >= 4) {
      const fallbackTitles = [
        'Análisis de Telemetría Basal',
        'Evaluación de Distorsiones Cognitivas',
        'Cruce Somato-Cognitivo',
        'Alternativas de Reencuadre Racional'
      ];
      for (let i = 0; i < Math.min(4, lines.length); i++) {
        steps.push({
          title: fallbackTitles[i],
          content: lines[i].trim()
        });
      }
    } else {
      steps.push({
        title: 'Diagnóstico Clínico Completo',
        content: text
      });
    }
  }

  return steps;
}
