/**
 * PSLSC Soccer School — config de la landing (/school).
 *
 * Es el ÚNICO archivo que hay que tocar para conectar ActiveCampaign y analytics.
 * Mientras activeCampaign no esté completo, el formulario NO envía: muestra un error y deja un
 * console.error. Nunca finge éxito. Ver README.md → "Conectar ActiveCampaign".
 */
export const CONFIG = {
  activeCampaign: {
    // Subdominio de la cuenta (https://<account>.activehosted.com).
    account: 'portstluciesc',
    // Form "Soccer School — Pre-registration" (embed.php?id=16).
    formId: '16',
    // Campos ocultos del "full embed" de AC (u, f, s, c, m, act, v, or). Si se re-crea el form en AC,
    // copiarlos de nuevo del export "full embed".
    tokens: { u: '16', f: '16', s: '', c: '0', m: '0', act: 'sub', v: '2', or: '22b4bda6-acb8-4f31-b2b1-507aab255d36' },
    // Campo nuestro → `name` del campo en el form de AC (del export "full embed").
    fields: {
      parentName: 'fullname',   // campo estándar "Full Name" de AC
      email: 'email',           // campo estándar de AC
      kidsAges: 'field[54][]',  // checkbox "Kids' ages", opciones "5"…"13"
      consent: 'field[55][]',   // checkbox "Consent" (una sola opción, ver consentValue)
      utm_source: 'field[58]',
      utm_medium: 'field[56]',
      utm_campaign: 'field[57]',
      utm_content: 'field[59]',
      utm_term: 'field[60]',
    },
    // Valor exacto de la única opción del checkbox "Consent" en AC.
    consentValue: "I'm the parent or guardian and agree to be contacted about the Soccer School.",
  },
  analytics: {
    metaPixelId: '1148178920880972', // Meta/Facebook Pixel del club (pasado por Agustín Sastre, 2026-10-28). Vacío = no se carga
    ga4Id: '',                  // vacío = no se carga GA4 (formato 'G-XXXXXXX')
  },
};
