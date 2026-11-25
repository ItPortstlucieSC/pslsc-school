/**
 * Lógica pura del formulario de preinscripción (sin DOM): lectura de UTM, validación y armado del
 * plan de campos y del POST directo a ActiveCampaign. Tests: node --test "tools/tests/*.test.mjs"
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ZIP de EE. UU.: 5 dígitos, o ZIP+4 (12345-6789 / 123456789). A AC se mandan solo los 5 primeros.
const ZIP_RE = /^\d{5}(-?\d{4})?$/;
const REQUIRED_FIELDS = ['parentName', 'email', 'kidsAges', 'consent'];

/** UTM presentes en la query string (recortados a 200 caracteres; los vacíos se omiten). */
export function readUtms(search) {
  const params = new URLSearchParams(search);
  const utms = {};
  for (const key of UTM_KEYS) {
    const value = (params.get(key) || '').trim();
    if (value) utms[key] = value.slice(0, 200);
  }
  return utms;
}

/** Primer error en el orden visual del form, o null si todo está bien. */
export function validate({ parentName, email, zipCode, kidsAges, consent }) {
  if (!parentName || !parentName.trim()) return { field: 'parentName', message: 'Please add your name.' };
  if (!EMAIL_RE.test((email || '').trim())) return { field: 'email', message: 'Enter a valid email so we can reach you.' };
  if (!ZIP_RE.test((zipCode || '').trim())) return { field: 'zipCode', message: 'Enter your 5-digit ZIP code.' };
  if (!kidsAges || kidsAges.length === 0) return { field: 'kidsAges', message: 'Pick at least one age.' };
  if (!consent) return { field: 'consent', message: 'Please confirm you’re the parent or guardian.' };
  return null;
}

/** ZIP normalizado: los 5 primeros dígitos. */
export function normalizeZip(zipCode) {
  return (zipCode || '').trim().slice(0, 5);
}

/**
 * true si la config de AC alcanza para enviar: cuenta, form y los cuatro campos obligatorios.
 * zipCode NO está en la lista a propósito: si todavía no se mapeó en config.js, el form sigue enviando
 * (sin el ZIP) en vez de cortarse. Ver README → "ActiveCampaign".
 */
export function isConfigured(ac) {
  if (!ac || !ac.account || !ac.formId || !ac.fields) return false;
  return REQUIRED_FIELDS.every((key) => Boolean(ac.fields[key]));
}

/**
 * Qué hay que escribir en el form de AC:
 *   text:        [name, value] para inputs de texto u ocultos (nombre, email, UTM configurados)
 *   checkGroups: [name, values[]] para checkboxes múltiples (edades)
 *   checks:      [name] para checkboxes simples que van tildados (consentimiento)
 */
export function buildProxyPlan(values, utms, fields) {
  const text = [
    [fields.parentName, values.parentName.trim()],
    [fields.email, values.email.trim()],
  ];
  if (fields.zipCode && values.zipCode) text.push([fields.zipCode, normalizeZip(values.zipCode)]);
  for (const key of UTM_KEYS) {
    if (fields[key] && utms[key]) text.push([fields[key], utms[key]]);
  }
  return {
    text,
    checkGroups: [[fields.kidsAges, values.kidsAges.map(String)]],
    checks: values.consent ? [fields.consent] : [],
  };
}

/**
 * Pares [name, value] del POST directo a proc.php de ActiveCampaign, en el mismo orden y formato que
 * serializa el embed de AC: primero los campos ocultos del form (tokens), después texto, y en cada
 * checkbox el marcador "~|" seguido de las opciones tildadas.
 */
export function buildPostPairs(plan, tokens, consentValue) {
  const pairs = Object.entries(tokens || {}).map(([k, v]) => [k, String(v)]);
  for (const [name, value] of plan.text) pairs.push([name, value]);
  for (const [name, values] of plan.checkGroups) {
    pairs.push([name, '~|']);
    for (const value of values) pairs.push([name, value]);
  }
  for (const name of plan.checks) {
    pairs.push([name, '~|']);
    pairs.push([name, consentValue]);
  }
  return pairs;
}
