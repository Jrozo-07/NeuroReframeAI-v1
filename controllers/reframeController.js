const genAI = require('../config/gemini');

/**
 * Controlador unificado de reencuadre cognitivo.
 * Recibe el pensamiento + biometría en tiempo real (ritmo de tecleo del frontend)
 * y ejecuta un análisis CoT en un solo viaje a Gemini.
 */
exports.reframeThought = async (req, res) => {
  try {
    const { pensamiento, biometria } = req.body;
    const { frecuencia_cardiaca, conductancia_cutanea, ondas_cerebrales } = biometria;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            sesgo_detectado: {
              type: 'STRING',
              description: 'Identificación detallada del sesgo o distorsión cognitiva detectado en el pensamiento.'
            },
            analisis_fisiologico: {
              type: 'STRING',
              description: 'Resumen clínico del perfil psicofisiológico cruzando ritmo cardíaco, conductancia cutánea y ondas beta.'
            },
            razonamiento_cot: {
              type: 'STRING',
              description: 'Desglose secuencial del CoT en 3 pasos: (1) Cruce psicomotor, (2) Evaluación cognitiva, (3) Síntesis tono-contenido con propuesta.'
            },
            reencuadres: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Arreglo con exactamente 3 propuestas de reencuadre cognitivo. Si el pulso fue alto, deben ser marcadamente pausados y empáticos.'
            }
          },
          required: ['sesgo_detectado', 'analisis_fisiologico', 'razonamiento_cot', 'reencuadres']
        }
      }
    });

    const prompt = `
Eres NeuroReframeAI, IA clínica experta en psicología cognitiva y biofeedback. Ejecuta un análisis unificado en un solo viaje.

DATOS DEL PACIENTE:
- PENSAMIENTO: "${pensamiento}"
- BIOMETRÍA (derivada del ritmo de tecleo en tiempo real):
  * Pulso: ${frecuencia_cardiaca} BPM (normal: 60-80 · estrés: 95-115)
  * Conductancia cutánea: ${conductancia_cutanea} µS (normal: 2-5 · estrés: 6-10)
  * Ondas Beta: ${ondas_cerebrales} (normal: <0.4 · estrés: >0.6)

CADENA DE PENSAMIENTO (CoT) ESTRICTA — ejecuta los 3 pasos en orden:

PASO 1 — CRUCE PSICOMOTOR: Evalúa si la carga semántica del pensamiento coincide con la activación fisiológica enviada (pulso alto + tecleo rápido = tensión activa; pulso normal = elaboración pausada). Conecta explícitamente el ritmo de escritura con la emoción subyacente.

PASO 2 — EVALUACIÓN COGNITIVA: Identifica el sesgo o distorsión dominante (catastrofismo, polarización, generalización excesiva, lectura mental, minimización positiva, etc.) justificándolo con fragmentos del texto.

PASO 3 — SÍNTESIS TONO-CONTENIDO Y PROPUESTA: Si el PASO 1 concluyó que el pulso es alto (≥ 90 BPM), redacta los 3 reencuadres con tono marcadamente pausado, empático y orientado a mitigar la ansiedad física del paciente (frases cortas, validación emocional, sugerencias de respiración o grounding). Si el pulso es normal o bajo, redacta reencuadres directos, lógicos y orientados a la acción. Cada reencuadre debe ser una alternativa concreta y utilizable.

FORMATO DE SALIDA: responde únicamente con el JSON estructurado solicitado. En "razonamiento_cot" incluye el desglose explícito de los 3 pasos.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let jsonResult;
    try {
      jsonResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Error parseando JSON de Gemini:', responseText);
      return res.status(500).json({
        error: 'La respuesta del motor CoT no pudo ser parseada como JSON.',
        raw: responseText
      });
    }

    return res.status(200).json(jsonResult);
  } catch (error) {
    console.error('Error en reframeController:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar el reencuadre cognitivo.',
      details: error.message
    });
  }
};
