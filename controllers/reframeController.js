const genAI = require('../config/gemini');

/**
 * Controlador que procesa el pensamiento negativo y los datos biométricos
 * (generados a partir del ritmo de tecleo del usuario) utilizando Gemini
 * con una estrategia CoT (Chain of Thought) unificada.
 */
exports.reframeThought = async (req, res) => {
  try {
    const { pensamiento, biometria } = req.body;
    const { frecuencia_cardiaca, conductancia_cutanea, ondas_cerebrales } = biometria;

    // Obtener modelo con salida estructurada JSON forzada
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
              description: 'Resumen clínico sobre el perfil psicofisiológico basándose en el ritmo cardíaco, estrés de la piel y ondas beta.'
            },
            razonamiento_cot: {
              type: 'STRING',
              description: 'Explicación del razonamiento CoT secuencial (Paso 1: Cruce Psicomotor, Paso 2: Evaluación Cognitiva, Paso 3: Coherencia de Tono, Paso 4: Propuesta de Reencuadre).'
            },
            reencuadres: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Arreglo con exactamente 3 reencuadres alternativos. Deben ser calmantes y empáticos si el pulso fue alto.'
            }
          },
          required: ['sesgo_detectado', 'analisis_fisiologico', 'razonamiento_cot', 'reencuadres']
        }
      }
    });

    const prompt = `
Eres NeuroReframeAI, una inteligencia artificial clínica experta en psicología cognitiva y retroalimentación biológica (biofeedback).
Analiza el pensamiento negativo del paciente cruzándolo con sus datos biométricos de tecleo (ritmo y correcciones en tiempo real).

Datos de Entrada del Paciente:
- PENSAMIENTO NEGATIVO: "${pensamiento}"
- BIOMETRÍA PSICOMOTORA:
  * Ritmo Cardíaco: ${frecuencia_cardiaca} BPM (rango normal: 60-80, alto estrés: 95-115).
  * Conductancia Cutánea: ${conductancia_cutanea} uS (rango normal: 2.0-5.0, alto estrés: 6.0-10.0).
  * Actividad Ondas Beta (cerebral): ${ondas_cerebrales} (rango normal: <0.4, alto estrés: >0.6).

Ejecuta de manera estricta una Cadena de Pensamiento (Chain of Thought - CoT) unificada en los siguientes pasos:

- PASO 1 (Cruce Psicomotor): Evalúa si la tensión del pensamiento coincide con la tensión física enviada en las métricas BCI (generadas por el ritmo de tecleo rápido o correcciones).
- PASO 2 (Evaluación Cognitiva): Identifica la distorsión cognitiva o sesgo del pensamiento (ej. catastrofismo, pensamiento polarizado, generalización excesiva, etc.).
- PASO 3 (Coherencia de Tono): Analiza si las pulsaciones altas del paciente (ritmo cardíaco >= 90 BPM) sugieren ansiedad o tensión biológica activa. Si es así, adapta el tono de tus reencuadres en el Paso 4 para que sean marcadamente más pausados, empáticos, reconfortantes y orientados a mitigar la ansiedad física (ej. frases cortas, técnicas de respiración lógica, tono compasivo). Si el pulso es bajo o normal, redacta reencuadres directos y lógicos.
- PASO 4 (Propuesta de Reencuadre): Redacta exactamente 3 propuestas de reencuadre cognitivo estructuradas bajo el tono correspondiente.

Genera tu respuesta únicamente bajo el formato JSON estructurado solicitado. El campo "razonamiento_cot" debe contener el desglose secuencial del razonamiento realizado en los pasos 1, 2, 3 y 4.
`;

    // Consulta a la API de Gemini
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
    console.error('Error en el controlador reframeController:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar el reencuadre cognitivo.',
      details: error.message
    });
  }
};
