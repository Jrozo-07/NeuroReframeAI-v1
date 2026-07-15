// =====================================================================
// APP.JS — Osciloscopio · Validación · Carga · Voz · Formulario · Reporte
// Las variables globales currentBpm, currentConductancia, currentBeta y
// stressIndex se definen en el <script> inline de index.html (detector
// de ritmo de escritura en tiempo real).
// =====================================================================

// Elementos de UI reutilizados desde index.html
// thoughtInput ya está declarado en el <script> inline de index.html
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
  const regex = /(Paso\s+[1-3]|PASO\s+[1-3])[:\-\s]*(.*?)(?=(?:Paso\s+[1-3]|PASO\s+[1-3])|$)/gsi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    let title = match[1].toUpperCase();
    let content = match[2].trim();
    
    if (title.includes('1')) title = 'Paso 1: Cruce Psicomotor';
    if (title.includes('2')) title = 'Paso 2: Evaluación Cognitiva';
    if (title.includes('3')) title = 'Paso 3: Síntesis Tono-Contenido';

    steps.push({ title, content });
  }

  if (steps.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    if (lines.length >= 3) {
      const fallbackTitles = [
        'Cruce Psicomotor',
        'Evaluación Cognitiva',
        'Síntesis Tono-Contenido'
      ];
      for (let i = 0; i < Math.min(3, lines.length); i++) {
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
