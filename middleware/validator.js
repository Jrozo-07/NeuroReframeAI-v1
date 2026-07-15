/**
 * Middleware para validar el cuerpo de la petición en la ruta /api/reframe.
 * Asegura que "pensamiento" sea un string de mínimo 10 caracteres y
 * "biometria" sea un objeto con datos numéricos válidos.
 */
module.exports = (req, res, next) => {
  const { pensamiento, biometria } = req.body;

  // Validación de pensamiento
  if (!pensamiento || typeof pensamiento !== 'string' || pensamiento.trim().length < 10) {
    return res.status(400).json({
      error: 'El campo "pensamiento" es requerido, debe ser un texto y tener al menos 10 caracteres.'
    });
  }

  // Validación de biometría
  if (!biometria || typeof biometria !== 'object' || Array.isArray(biometria)) {
    return res.status(400).json({
      error: 'El campo "biometria" es requerido y debe ser un objeto con los datos biológicos.'
    });
  }

  const { frecuencia_cardiaca, conductancia_cutanea, ondas_cerebrales } = biometria;

  // Validación de frecuencia cardíaca
  if (frecuencia_cardiaca === undefined || typeof frecuencia_cardiaca !== 'number' || isNaN(frecuencia_cardiaca)) {
    return res.status(400).json({
      error: 'El campo "biometria.frecuencia_cardiaca" es requerido y debe ser un número válido.'
    });
  }

  // Validación de conductancia cutánea
  if (conductancia_cutanea === undefined || typeof conductancia_cutanea !== 'number' || isNaN(conductancia_cutanea)) {
    return res.status(400).json({
      error: 'El campo "biometria.conductancia_cutanea" es requerido y debe ser un número válido.'
    });
  }

  // Validación de ondas cerebrales
  if (ondas_cerebrales === undefined || typeof ondas_cerebrales !== 'number' || isNaN(ondas_cerebrales)) {
    return res.status(400).json({
      error: 'El campo "biometria.ondas_cerebrales" es requerido y debe ser un número válido.'
    });
  }

  // Si todo es correcto, continuar
  next();
};
