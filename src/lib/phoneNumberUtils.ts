/**
 * Utilitaires pour formater les numéros de téléphone
 * Gère la conversion de la notation scientifique (2.25E+12) vers le format normal
 */

/**
 * Convertit un numéro de téléphone depuis la notation scientifique vers le format normal
 * @param phone - Le numéro au format string ou number
 * @returns Le numéro formaté en string sans notation scientifique
 */
export function normalizePhoneNumber(phone: string | number | null | undefined): string {
  if (!phone && phone !== 0) return '';
  
  const phoneStr = typeof phone === 'number' ? phone.toString() : String(phone);
  
  // Si le numéro contient la notation scientifique (E+, e+, E-, e-)
  if (phoneStr.includes('E+') || phoneStr.includes('e+') || phoneStr.includes('E-') || phoneStr.includes('e-')) {
    try {
      const num = parseFloat(phoneStr);
      if (!isNaN(num)) {
        // Convertir en entier (pas de décimales pour les numéros de téléphone)
        return Math.floor(num).toString();
      }
    } catch (e) {
      // Si la conversion échoue, retourner tel quel
      console.warn('Erreur lors de la conversion du numéro:', phoneStr, e);
    }
  }
  
  return phoneStr.trim();
}

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param phone - Le numéro à formater
 * @returns Le numéro formaté
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  return normalizePhoneNumber(phone);
}


