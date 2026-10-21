/**
 * Utilidades para la estandarización y limpieza de Entidades Locales (EELL)
 * Elimina 'Ayuntamiento de...', 'Ayto. de...', 'Diputación de...', etc.
 * dejando exclusivamente el nombre del municipio o entidad local.
 */

export const limpiarNombreEELL = (nombre?: string | null): string => {
  if (!nombre) return '';
  return nombre
    .replace(
      /^(ayuntamiento\s+de\s+|ayuntamiento\s+del\s+|ayuntamiento\s+|ayto\.\s+de\s+|ayto\s+de\s+|ayto\.\s+|ayto\s+|diputación\s+de\s+|diputacion\s+de\s+|diputación\s+|diputacion\s+|e\.l\.a\.\s+de\s+|ela\s+de\s+|e\.l\.a\.\s+|ela\s+|e\.l\.m\.\s+de\s+|elm\s+de\s+|m\.i\.\s+ayuntamiento\s+de\s+|excelentísimo\s+ayuntamiento\s+de\s+|excmo\.\s+ayto\.\s+de\s+|excmo\.\s+ayuntamiento\s+de\s+|i\.m\.\s+ayuntamiento\s+de\s+)/i,
      ''
    )
    .trim();
};
