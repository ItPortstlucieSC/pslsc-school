# pslsc-school — PSLSC Soccer School · landing v1 (preinscripción)

Landing para captar **preinscripciones** de familias (chicos de 5 a 13 años) mientras se arma el micrositio
definitivo, que después la reemplaza en la misma URL.

Repo propio del club (`ItPortstlucieSC`), separado del sitio de WordPress (`pslsc`). Salió de la carpeta `school/`
de la rama `school` de `pslsc` (2026-10-13); ahí queda la historia previa. **No es WordPress**: HTML/CSS/JS libre,
sin las reglas de bloques. Se publica en Vercel desde este repo, en la raíz del dominio (`/`).

Ramas: `develop` (trabajo, cualquier colaborador) → `main` (producción, solo con PR aprobado por la cuenta del club).

Spec: [`docs/specs/2026-10-07-soccer-school-landing-design.md`](docs/specs/2026-10-07-soccer-school-landing-design.md) ·
Plan: [`docs/plans/2026-10-07-soccer-school-landing.md`](docs/plans/2026-10-07-soccer-school-landing.md) ·
Identidad: [`docs/soccer-school/`](docs/soccer-school/) (manual + fuentes del logo y la portada)

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página. Los textos que no son de la editora llevan `<!-- COPY: revisar -->`. |
| `school.css` | Estilos. Tokens de marca en `:root`. Mobile-first, un breakpoint a 960px. |
| `config.js` | **Lo único que hay que tocar** para conectar ActiveCampaign y analytics. |
| `form.js` | Lógica pura del form (UTM, validación, mapeo a AC). Tests: `node --test "tools/tests/*.test.mjs"`. |
| `school.js` | Cableado del form (proxy a AC, estados, honeypot), analytics opcional, intro y movimiento (titulares palabra por palabra, ítems escalonados, FAQ animado). La coreografía está en `school.css`, sección "Movimiento". |
| `assets/` | Generados con `python3 tools/school-assets.py` (logo aqua, og-image, íconos, escudo, ancla, fuentes). |
| `assets/intro/` | El video del intro, cortado y comprimido a mano (ver "Intro"). |

## Intro

Al entrar se reproduce a pantalla completa el video del club ([YouTube](https://www.youtube.com/watch?v=g9vyEQWpi3E),
sin audio) hasta *"Your journey starts here"*, como pantalla de carga: una línea aqua pegada al borde de arriba del
video crece con el avance, y el *Loading %* acompaña la punta. 0,6 s antes del final la landing sube (fade in up) fundiéndose con el video, en 0,9 s. Sin autoplay (modo
ahorro de iOS), con *reduced motion*, sin JS o si el video no arranca en 5 s, no hay intro y se ve la landing.

- **Corte:** cuadros 0–233 (9,36 s); el 234 ya es la toma de *"Learn. Play. Enjoy."*.
- **Encuadre:** apaisado, el video cubre la pantalla. Vertical, va adentro de una elipse con la proporción del logo
  (2,1:1), de 210vw de ancho, que sobresale por los costados; se ve el 48% central del ancho y el 85% del alto del
  cuadro, donde cae todo el texto del video (verificado cuadro por cuadro). El fondo (`#FF0052`) es el rojo de las
  placas tal como lo pinta Chrome.
- **Calidad:** 720p en teléfonos (1,4 MB) y 1080p en pantallas grandes (2,6 MB).
- **Regenerar** (desde la raíz del repo, con el video bajado como `src.mp4`; en zsh `$X264` no se separa en palabras, usar `bash`):

  ```bash
  X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an"
  ffmpeg -i src.mp4 -frames:v 234 -crf 28 $X264 assets/intro/intro-1080.mp4
  ffmpeg -i src.mp4 -frames:v 234 -vf scale=1280:720:flags=lanczos -crf 28 $X264 assets/intro/intro-720.mp4
  ffmpeg -i src.mp4 -frames:v 1 -vf scale=1280:720:flags=lanczos -c:v libwebp -quality 78 assets/intro/intro-poster.webp
  ```

## Ver localmente

```bash
python3 -m http.server 4321   # → http://localhost:4321/
```

Las rutas son absolutas desde la raíz (`/assets/…`): serví la raíz del repo.
El `http.server` de Python no soporta pedidos `Range`: en Chrome el intro anda, pero Safari no reproduce el video
(se saltea el intro). Vercel sí los soporta.

## Conectar ActiveCampaign (antes de difundir la URL)

Mientras falte la config, el form valida, muestra *"Something went wrong on our end"* y deja un
`console.error`: **no envía y no finge éxito**.

1. **En AC**, crear el form *"Soccer School — Pre-registration"* que suscriba a la lista del mismo nombre, con:
   *Full Name* · *Email* · *Kids' ages* (checkbox con opciones `5` a `13`) · *Consent* (checkbox) ·
   *utm_source*, *utm_medium*, *utm_campaign*, *utm_content*, *utm_term* (ocultos). Idealmente, con un email
   de confirmación automático.
2. Del **código de embed** del form: el subdominio (`https://<account>.activehosted.com`) → `account`, y el id
   (`embed.php?id=N`) → `formId`, en `config.js`.
3. Del **export "full embed"**: el `name` de cada campo → `config.js > fields` (los checkboxes son `field[NN][]`).
4. **Probar**: abrir `/?utm_source=test`, preinscribir un email de prueba y verificar en AC nombre, edades,
   consentimiento y UTM. Después, borrar el contacto de prueba.

Cómo funciona el envío: la página monta el *embed simple* de AC oculto en `#ac-proxy`, le copia los valores
y dispara su submit (el mismo patrón que tryouts, newsletter y partners en el sitio; ver el comentario de
`school.js`). El éxito se detecta en `._form-thank-you` y el error en `._form_error`, con un timeout de 15 s.

## Analytics (opcional)

`config.js > analytics`: con `metaPixelId` se carga el pixel (PageView + `Lead` al preinscribirse); con
`ga4Id`, GA4 (`generate_lead`). Vacíos = no se carga nada.

## Pendientes

- **Revisión de copy** por la editora: buscar `COPY: revisar` en `index.html`.
- **Texto legal** del consentimiento: hoy reusa el de tryouts (*USL privacy policy* y *emails from USL*). Confirmar que aplica.
- **Rangos de edad** por categoría (las tarjetas van sin edades).
- **Tipografías del manual**: el archivo de *Druk XCond* es Trial y no hay *Coolvetica*; hoy van Druk Heavy y
  Proxima Nova (licencias del club). Cambiar las `@font-face` de `school.css` cuando haya licencias web.
- **Dominio propio** para la pauta: al cambiarlo, actualizar `canonical`, `og:url` y `og:image` en `index.html`.
