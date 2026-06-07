import { FormSchema } from './types';
import playerCss from './static/player.css.txt';
import playerJs from './static/player.js.txt';

export { playerCss, playerJs };

export function renderPlayerHtml(
  schemaInput: FormSchema | string,
  formId: string,
  isPreview: boolean = false,
  turnstilePublicKey?: string,
  lang: string = 'en'
): string {
  const schemaObj = typeof schemaInput === 'string' ? JSON.parse(schemaInput) : schemaInput;

  // Escape the schema for safe inline injection into a <script> tag
  const schemaJson = JSON.stringify(schemaObj).replace(/<\/script>/gi, '<\\/script>');
  const title = escapeHtml(schemaObj.title) || 'Form';
  const siteKey = turnstilePublicKey || '0x4AAAAAAA-wS6ZfQh649eTz';

  // Normalize and validate language
  const allowedLanguages = ['en', 'fi'];
  const normalizedLang = allowedLanguages.includes(lang) ? lang : 'en';

  // Turnstile script tag — only added when the form uses it
  const turnstileScriptTag = schemaObj.turnstileEnabled
    ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
    : '';

  return `<!DOCTYPE html>
<html lang="${normalizedLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- Load marked Markdown parser -->
  <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
  <link rel="stylesheet" href="/player.css">
</head>
<body>

  <!-- Progress bar -->
  <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Form progress">
    <div class="progress-bar-fill" id="progressBar"></div>
  </div>

  <main class="form-container" aria-label="Form">
    <div id="screensWrapper">
      <!-- Dynamic Form Screens will be rendered here -->
    </div>
  </main>

  <!-- Bottom Navigation -->
  <footer class="footer-controls" aria-label="Form navigation">
    <div class="nav-buttons">
      <button class="btn-nav" id="btnPrev" onclick="goBack()" title="Previous Question (Up Arrow)" aria-label="Previous question">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="btn-nav" id="btnNext" onclick="submitCurrentField()" title="Next Question (Down Arrow)" aria-label="Next question">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <span style="font-size: 0.8rem; color: var(--text-secondary);" id="footerCount" aria-live="polite">Page 1 of 1</span>
  </footer>

  <!-- Toast Notifier -->
  <div id="toast" role="status" aria-live="polite" aria-atomic="true"></div>

  ${turnstileScriptTag}

  <!-- Server-side config injected here; player.js reads window.__PLAYER_CONFIG__ -->
  <script>
    window.__PLAYER_CONFIG__ = {
      schema: ${schemaJson},
      formId: ${JSON.stringify(formId)},
      isPreview: ${isPreview},
      serverLang: ${JSON.stringify(normalizedLang)},
      turnstileSiteKey: ${JSON.stringify(siteKey)}
    };
  </script>
  <script src="/player.js"></script>
</body>
</html>`;
}

// Server-side escapeHtml — used during TypeScript HTML generation (not shipped to the browser)
function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
