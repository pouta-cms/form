import { FormSchema } from './types';

export function renderPlayerHtml(
  schemaInput: FormSchema | string,
  formId: string,
  isPreview: boolean = false,
  turnstilePublicKey?: string,
  lang: string = 'en'
): string {
  const schemaObj = typeof schemaInput === 'string' ? JSON.parse(schemaInput) : schemaInput;
  const schemaJsonStr = JSON.stringify(schemaObj);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>` + escapeHtml(schemaObj.title || 'Form') + `</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- Load marked Markdown parser -->
  <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
  <style>
    :root {
      --bg-main: #0b0f19;
      --bg-card: rgba(20, 28, 47, 0.6);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --accent-color: #F59E0B;
      --accent-grad: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
      --error-color: #ef4444;
      --success-color: #10b981;
      --transition-normal: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-main);
      color: var(--text-primary);
      min-height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 40%);
    }

    .form-container {
      width: 100%;
      max-width: 680px;
      padding: 2rem;
      position: relative;
      height: 70vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    /* Screen Transitions */
    .screen {
      display: none;
      opacity: 0;
      transform: translateY(20px);
      transition: var(--transition-normal);
      flex-direction: column;
      width: 100%;
    }

    .screen.active {
      display: flex;
      opacity: 1;
      transform: translateY(0);
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Form Fields Typography */
    .question-title {
      font-size: 1.75rem;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 1.5rem;
      color: var(--text-primary);
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .question-description {
      font-size: 1.1rem;
      line-height: 1.5;
      color: var(--text-secondary);
      margin-top: -1rem;
      margin-bottom: 1.5rem;
      font-weight: 400;
    }

    .question-description p {
      margin: 0 0 0.5rem 0;
    }

    .question-description p:last-child {
      margin-bottom: 0;
    }

    .question-index {
      color: var(--accent-color);
      font-size: 1.1rem;
      font-weight: 700;
      margin-top: 0.3rem;
    }

    .question-required {
      color: var(--error-color);
      font-size: 1rem;
      margin-left: 0.25rem;
    }

    /* Welcome screen styling */
    .welcome-screen {
      text-align: center;
      align-items: center;
    }

    .welcome-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: var(--accent-grad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .welcome-text {
      color: var(--text-secondary);
      font-size: 1.15rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      max-width: 500px;
    }

    .welcome-logo-container {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .welcome-logo {
      height: 72px;
      width: 72px;
      animation: pulse 4s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.95; }
      50% { transform: scale(1.05); opacity: 1; }
    }

    .welcome-content-wrapper {
      text-align: left;
      width: 100%;
      max-width: 600px;
      margin-bottom: 2rem;
    }
    .welcome-content-wrapper h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 1.25rem;
      background: var(--accent-grad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }
    .welcome-content-wrapper h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    .welcome-content-wrapper h3 {
      font-size: 1.4rem;
      font-weight: 600;
      margin-top: 1.25rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .welcome-content-wrapper p {
      color: var(--text-secondary);
      font-size: 1.15rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .welcome-content-wrapper ul, .welcome-content-wrapper ol {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
      color: var(--text-secondary);
    }
    .welcome-content-wrapper li {
      margin-bottom: 0.5rem;
      font-size: 1.15rem;
      line-height: 1.6;
    }
    .welcome-content-wrapper strong {
      color: var(--text-primary);
    }

    /* Input Fields styling */
    .input-wrapper {
      position: relative;
      margin-bottom: 2rem;
    }

    input[type="text"], input[type="email"], input[type="number"], input[type="tel"], textarea {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      padding: 0.75rem 0;
      font-family: inherit;
      font-size: 1.5rem;
      color: white;
      outline: none;
      transition: var(--transition-normal);
    }

    textarea {
      font-size: 1.25rem;
      min-height: 120px;
      resize: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
    }

    input:focus, textarea:focus {
      border-color: var(--accent-color);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.05);
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .contact-field-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    /* Radio buttons styling */
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
      align-items: flex-start;
      width: 100%;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      padding: 0.9rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      max-width: 600px;
      transition: var(--transition-fast);
      user-select: none;
      position: relative;
    }

    .radio-label:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .radio-label input[type="radio"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .radio-custom {
      position: relative;
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color);
      border-radius: 50%;
      background: transparent;
      transition: var(--transition-fast);
      flex-shrink: 0;
    }

    .radio-label input[type="radio"]:checked ~ .radio-custom {
      border-color: var(--accent-color);
      background: var(--accent-color);
    }

    .radio-custom::after {
      content: "";
      position: absolute;
      display: none;
      top: 5px;
      left: 5px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: white;
    }

    .radio-label input[type="radio"]:checked ~ .radio-custom::after {
      display: block;
    }

    .radio-label input[type="radio"]:focus ~ .radio-custom {
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
    }

    .radio-label:has(input[type="radio"]:checked) {
      border-color: var(--accent-color);
      background: rgba(99, 102, 241, 0.05);
    }

    .radio-text {
      font-size: 1.05rem;
      color: var(--text-primary);
    }

    /* Select Option Cards styling */
    .options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .option-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      padding: 0.9rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.1rem;
      font-weight: 500;
      transition: var(--transition-normal);
      user-select: none;
    }

    .option-card:hover {
      background: rgba(99, 102, 241, 0.08);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateX(4px);
    }

    .option-card:focus-visible {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
      transform: translateX(4px);
    }

    .option-card.selected {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--accent-color);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);
    }

    .option-badge {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .option-card:hover .option-badge, .option-card.selected .option-badge {
      background: var(--accent-color);
      color: white;
      border-color: var(--accent-color);
    }

    /* Buttons styling */
    .btn-action {
      background: var(--accent-grad);
      color: white;
      border: none;
      padding: 0.8rem 1.8rem;
      border-radius: 8px;
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
      transition: var(--transition-normal);
      width: fit-content;
    }

    .btn-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
    }

    .keyboard-hint {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-left: 1rem;
      font-weight: 400;
      align-self: center;
    }

    .error-msg {
      color: var(--error-color);
      font-size: 0.9rem;
      margin-top: -1.5rem;
      margin-bottom: 1.5rem;
      display: none;
      animation: fadeIn 0.2s ease-out;
    }

    /* Navigation & Progress styling */
    .footer-controls {
      position: fixed;
      bottom: 2rem;
      left: 0;
      right: 0;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 680px;
      margin: 0 auto;
      z-index: 10;
    }

    .nav-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-nav {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition-normal);
    }

    .btn-nav:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: white;
    }

    .btn-nav:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .progress-bar-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(255, 255, 255, 0.05);
      z-index: 100;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--accent-grad);
      width: 0%;
      transition: width 0.3s ease-out;
    }

    /* Submitting Screen State */
    .success-screen {
      text-align: center;
      align-items: center;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--success-color);
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .turnstile-container {
      margin: 1.5rem 0;
      display: flex;
      justify-content: center;
    }

    /* Toast Elements */
    #toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      background: #1e293b;
      border: 1px solid var(--border-color);
      color: white;
      font-weight: 500;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
    }

    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 768px) {
      body {
        overflow-y: auto;
      }

      .form-container {
        height: auto;
        min-height: calc(100vh - 100px);
        padding: 1.5rem 1rem 6rem 1rem;
        justify-content: flex-start;
      }

      .question-title {
        font-size: 1.35rem;
        line-height: 1.4;
        margin-bottom: 1.2rem;
      }

      .question-description {
        font-size: 0.95rem;
        margin-top: -0.8rem;
        margin-bottom: 1.2rem;
      }

      .welcome-content-wrapper h1, .welcome-title {
        font-size: 1.85rem;
        margin-bottom: 1rem;
      }

      .welcome-content-wrapper h2 {
        font-size: 1.45rem;
      }

      .welcome-content-wrapper h3 {
        font-size: 1.25rem;
      }

      .welcome-content-wrapper p, .welcome-content-wrapper li {
        font-size: 1rem;
        line-height: 1.5;
      }

      input[type="text"], input[type="email"], input[type="number"], input[type="tel"], textarea {
        font-size: 1.2rem;
      }

      .option-card {
        font-size: 1rem;
        padding: 0.75rem 1rem;
      }

      .keyboard-hint {
        display: none !important;
      }

      .footer-controls {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        max-width: 100%;
        padding: 1rem;
        background: rgba(11, 15, 25, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-top: 1px solid var(--border-color);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
        margin: 0;
      }

      .btn-action {
        width: 100%;
        justify-content: center;
        padding: 0.9rem 1.5rem;
      }

      .error-msg {
        margin-top: -1rem;
        margin-bottom: 1rem;
      }

      .page-section-header {
        font-size: 0.75rem;
        margin-bottom: 0.8rem;
      }

      .contact-grid {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }

    .page-section-header {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-color);
      margin-bottom: 1.25rem;
      align-self: flex-start;
    }
  </style>
</head>
<body>

  <!-- Progress bar -->
  <div class="progress-bar-container">
    <div class="progress-bar-fill" id="progressBar"></div>
  </div>

  <div class="form-container">
    <div id="screensWrapper">
      <!-- Dynamic Form Screens will be rendered here -->
    </div>
  </div>

  <!-- Bottom Navigation -->
  <div class="footer-controls">
    <div class="nav-buttons">
      <button class="btn-nav" id="btnPrev" onclick="goBack()" title="Previous Question (Up Arrow)">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="btn-nav" id="btnNext" onclick="submitCurrentField()" title="Next Question (Down Arrow)">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <span style="font-size: 0.8rem; color: var(--text-secondary);" id="footerCount">Page 1 of 1</span>
  </div>

  <!-- Toast Notifier -->
  <div id="toast"></div>

  <!-- Turnstile verification script (only added if enabled) -->
  ` + (schemaObj.turnstileEnabled ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : '') + `

  <script>
    // Injected Schema State
    const schema = ` + schemaJsonStr + `;
    const formId = "` + formId + `";
    const isPreview = ` + isPreview + `;
    const serverLang = "` + lang + `";
    
    let answers = {};
    let pageHistory = []; // Tracks indexes of visited pages for correct back navigation with jumps
    let currentPageIdx = 0;

    const urlParams = new URLSearchParams(window.location.search);
    const activeLang = (urlParams.get('lang') || serverLang).toLowerCase() === 'fi' ? 'fi' : 'en';

    const translations = {
      en: {
        startForm: "Start Form",
        defaultWelcome: "Welcome! Let's get started with this questionnaire.",
        placeholder: "Type your answer here...",
        ok: "OK",
        fieldRequired: "This field is required.",
        readyToSubmit: "Ready to Submit",
        submitDesc: "All questions completed. Submit your responses below.",
        submitBtn: "Submit Responses",
        spamValidation: "Please complete the spam validation.",
        thankYou: "Thank you!",
        successDesc: "Your submission has been securely registered on the Edge.",
        pressEnter: "press",
        enter: "Enter",
        submitting: "Submitting...",
        pageOf: "Page {current} of {total}",
        emptyFormTitle: "Empty Form",
        emptyFormDesc: "This form does not have any pages configured yet.",
        simulatedSuccess: "Form submission simulated successfully! (Preview Mode)",
        successToast: "Form submitted successfully!",
        failedToast: "Submission failed: {error}",
        networkError: "Network error during submission.",
        prevTooltip: "Previous Question (Up Arrow)",
        nextTooltip: "Next Question (Down Arrow)",
        contactFirstName: "First Name",
        contactFirstNamePlaceholder: "Jane",
        contactLastName: "Last Name",
        contactLastNamePlaceholder: "Doe",
        contactEmail: "Email Address",
        contactEmailPlaceholder: "jane.doe@example.com",
        contactPhone: "Phone Number",
        contactPhonePlaceholder: "+1 (555) 000-0000",
        contactCompany: "Company",
        contactCompanyPlaceholder: "Acme Corp"
      },
      fi: {
        startForm: "Aloita",
        defaultWelcome: "Tervetuloa! Aloitetaan kysely.",
        placeholder: "Kirjoita vastaus tähän...",
        ok: "OK",
        fieldRequired: "Tämä kenttä on pakollinen.",
        readyToSubmit: "Valmis lähetettäväksi",
        submitDesc: "Kaikki kysymykset vastattu. Lähetä vastauksesi alta.",
        submitBtn: "Lähetä vastaukset",
        spamValidation: "Suorita roskapostin esto.",
        thankYou: "Kiitos!",
        successDesc: "Vastauksesi on tallennettu onnistuneesti.",
        pressEnter: "paina",
        enter: "Enter",
        submitting: "Lähetetään...",
        pageOf: "Sivu {current} / {total}",
        emptyFormTitle: "Tyhjä lomake",
        emptyFormDesc: "Tässä lomakkeessa ei ole vielä sivuja määritettynä.",
        simulatedSuccess: "Lomakkeen lähetys simuloitu onnistuneesti! (Esikatselutila)",
        successToast: "Lomake lähetetty onnistuneesti!",
        failedToast: "Lähetys epäonnistui: {error}",
        networkError: "Verkkovirhe lähetyksen aikana.",
        prevTooltip: "Edellinen kysymys (Ylänuoli)",
        nextTooltip: "Seuraava kysymys (Alanuoli)",
        contactFirstName: "Etunimi",
        contactFirstNamePlaceholder: "Matti",
        contactLastName: "Sukunimi",
        contactLastNamePlaceholder: "Meikäläinen",
        contactEmail: "Sähköpostiosoite",
        contactEmailPlaceholder: "matti.meikalainen@esimerkki.fi",
        contactPhone: "Puhelinnumero",
        contactPhonePlaceholder: "040 123 4567",
        contactCompany: "Yritys / Yhteisö",
        contactCompanyPlaceholder: "Yritys Oy"
      }
    };

    const dict = translations[activeLang];

    function t(key, replacements = {}) {
      let val = dict[key] || translations['en'][key] || '';
      for (const [k, v] of Object.entries(replacements)) {
        val = val.replace('{' + k + '}', v);
      }
      return val;
    }
    
    // Generate/retrieve unique submission ID for progress saves
    function generateUUID() {
      return 'sub_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }
    const submissionId = isPreview 
      ? 'preview-session' 
      : (sessionStorage.getItem('pouta_sub_id_' + formId) || generateUUID());
    if (!isPreview) {
      sessionStorage.setItem('pouta_sub_id_' + formId, submissionId);
    }

    // Build the Screen Nodes
    function initForm() {
      const wrapper = document.getElementById('screensWrapper');
      wrapper.innerHTML = '';

      if (!schema.pages || schema.pages.length === 0) {
        wrapper.innerHTML = \`
          <div class="screen active welcome-screen">
            <div class="welcome-logo-container">
              <img src="\${schema.logoUrl || '/logo.svg'}" alt="Logo" class="welcome-logo">
            </div>
            <h2 class="welcome-title">\${t('emptyFormTitle')}</h2>
            <p class="welcome-text">\${t('emptyFormDesc')}</p>
          </div>
        \`;
        document.getElementById('progressBar').style.display = 'none';
        document.querySelector('.footer-controls').style.display = 'none';
        return;
      }

      let questionNum = 0;
      schema.pages.forEach((page, pageIdx) => {
        const screenDiv = document.createElement('div');
        screenDiv.className = 'screen';
        screenDiv.id = 'page-' + pageIdx;

        // Check if page contains a welcome screen field
        const welcomeField = page.fields.find(f => f.type === 'welcome');
        if (welcomeField) {
          screenDiv.classList.add('welcome-screen');
          let contentHtml = '';
          if (welcomeField.welcomeMarkdown) {
            contentHtml = typeof marked !== 'undefined' ? marked.parse(welcomeField.welcomeMarkdown) : welcomeField.welcomeMarkdown;
          } else {
            contentHtml = \`
              <h1 class="welcome-title">\${escapeHtml(welcomeField.label || '')}</h1>
              <p class="welcome-text">\${escapeHtml(welcomeField.description || t('defaultWelcome'))}</p>
            \`;
          }

          const buttonLabel = welcomeField.buttonLabel || t('startForm');
          const buttonSubtextHtml = welcomeField.buttonSubtext ? \`
            <span class="keyboard-hint" style="margin-left: 0; display: flex; align-items: center; gap: 0.25rem; justify-content: center; margin-top: 0.5rem;">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 2px;"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>
              \${escapeHtml(welcomeField.buttonSubtext)}
            </span>
          \` : \`
            <span class="keyboard-hint" style="margin-left: 0;">\${t('pressEnter')} <strong>\${t('enter')} ↵</strong></span>
          \`;

          screenDiv.innerHTML = \`
            <div class="welcome-logo-container">
              <img src="\${schema.logoUrl || '/logo.svg'}" alt="Logo" class="welcome-logo">
            </div>
            <div class="welcome-content-wrapper">
              \${contentHtml}
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
              <button class="btn-action" onclick="goToNextPage()">
                <span>\${escapeHtml(buttonLabel)}</span>
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              \${buttonSubtextHtml}
            </div>
          \`;
        } else {
          // Standard page containing inputs/questions
          let fieldsHtml = '';
          page.fields.forEach((field, fIdx) => {
            questionNum++;
            fieldsHtml += renderFieldHtml(field, pageIdx, fIdx, questionNum);
          });

          let pageTitleHtml = '';
          if (page.title && page.title.trim()) {
            pageTitleHtml = \`
              <div class="page-section-header">
                \${escapeHtml(page.title.toUpperCase())}
              </div>
            \`;
          }

          screenDiv.innerHTML = \`
            \${pageTitleHtml}
            <div class="fields-container">
              \${fieldsHtml}
            </div>
            <div class="error-msg" id="error-page-\${pageIdx}">\${t('fieldRequired')}</div>
            <div style="display: flex; align-items: center; margin-top: 1rem;">
              <button class="btn-action" onclick="submitCurrentField()">
                <span>\${t('ok')}</span>
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <span class="keyboard-hint">\${t('pressEnter')} <strong>\${t('enter')} ↵</strong></span>
            </div>
          \`;
        }

        wrapper.appendChild(screenDiv);
      });

      // Append Final Submission / Success Page
      const finalScreen = document.createElement('div');
      finalScreen.className = 'screen success-screen';
      finalScreen.id = 'page-submit';
      
      const turnstileSiteKey = "` + (turnstilePublicKey || '0x4AAAAAAA-wS6ZfQh649eTz') + `";
      const turnstileHtml = schema.turnstileEnabled && !isPreview
        ? \`
          <div class="turnstile-container">
            <div class="cf-turnstile" data-sitekey="\${turnstileSiteKey}"></div>
          </div>
        \`
        : '';

      finalScreen.innerHTML = \`
        <div class="success-icon">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h2 class="welcome-title" style="font-size: 2rem;">\${t('readyToSubmit')}</h2>
        <p class="welcome-text" style="margin-bottom: 1rem;">\${t('submitDesc')}</p>
        \${turnstileHtml}
        <div class="error-msg" id="error-final" style="display:none; margin-top:0;">\${t('spamValidation')}</div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn-action" onclick="finalizeSubmission()">
            <span>\${t('submitBtn')}</span>
          </button>
          <span class="keyboard-hint" style="margin-left: 0;">\${t('pressEnter')} <strong>\${t('enter')} ↵</strong></span>
        </div>
      \`;
      wrapper.appendChild(finalScreen);

      // Set localized tooltips on footer buttons
      document.getElementById('btnPrev').title = t('prevTooltip');
      document.getElementById('btnNext').title = t('nextTooltip');

      // Render first screen
      showScreen(0);
    }

    function renderFieldHtml(field, pageIdx, fIdx, questionNum) {
      const isRequired = !!field.required;
      const labelEscaped = escapeHtml(field.label);
      const descHtml = field.description ? \`<div class="question-description">\${typeof marked !== 'undefined' ? marked.parse(field.description) : escapeHtml(field.description)}</div>\` : '';

      let inner = '';
      if (field.type === 'select') {
        const options = field.options || [];
        let cards = '';
        options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx); // A, B, C...
          cards += \`
            <div class="option-card" role="radio" aria-checked="false" tabindex="0" data-val="\${escapeHtml(opt)}" data-letter="\${letter}"
              onclick="selectOptionCard(this, '\${field.id}')"
              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectOptionCard(this,'\${field.id}');}">
              <span class="option-badge">\${letter}</span>
              <span>\${escapeHtml(opt)}</span>
            </div>
          \`;
        });
        inner = \`<div class="options-grid" id="input-\${field.id}" role="radiogroup">\${cards}</div>\`;
      } else if (field.type === 'multiselect') {
        const options = field.options || [];
        let cards = '';
        options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx); // A, B, C...
          cards += \`
            <div class="option-card" role="checkbox" aria-checked="false" tabindex="0" data-val="\${escapeHtml(opt)}" data-letter="\${letter}"
              onclick="toggleOptionCard(this, '\${field.id}')"
              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleOptionCard(this,'\${field.id}');}">
              <span class="option-badge">\${letter}</span>
              <span>\${escapeHtml(opt)}</span>
            </div>
          \`;
        });
        inner = \`<div class="options-grid" id="input-\${field.id}" role="group">\${cards}</div>\`;
      } else if (field.type === 'radio') {
        const options = field.options || [];
        let radioItems = '';
        options.forEach((opt, oIdx) => {
          const optId = \`radio-\${field.id}-\${oIdx}\`;
          radioItems += \`
            <label class="radio-label" for="\${optId}">
              <input type="radio" name="\${field.id}" id="\${optId}" value="\${escapeHtml(opt)}" onclick="selectRadioOption('\${field.id}', this.value)" \${answers[field.id] === opt ? 'checked' : ''}>
              <span class="radio-custom"></span>
              <span class="radio-text">\${escapeHtml(opt)}</span>
            </label>
          \`;
        });
        inner = \`<div class="radio-group" id="input-\${field.id}">\${radioItems}</div>\`;
      } else if (field.type === 'textarea') {
        inner = \`
          <div class="input-wrapper">
            <textarea id="input-\${field.id}" placeholder="\${t('placeholder')}" onkeydown="handleTextareaKeydown(event)"></textarea>
          </div>
        \`;
      } else if (field.type === 'contact') {
        const sub = field.subFields || {
          firstName: { visible: true, required: true },
          lastName: { visible: true, required: true },
          email: { visible: true, required: true },
          phone: { visible: true, required: false },
          company: { visible: true, required: false }
        };

        const row1Html = [];
        if (sub.firstName?.visible !== false) {
          row1Html.push(\`
            <div class="input-wrapper" style="margin-bottom: 0.75rem;">
              <label class="contact-field-label" for="input-\${field.id}-firstName">\${t('contactFirstName')} \${sub.firstName?.required ? '*' : ''}</label>
              <input type="text" id="input-\${field.id}-firstName" placeholder="\${t('contactFirstNamePlaceholder')}" autocomplete="given-name" style="font-size: 1.2rem; padding: 0.5rem 0;">
            </div>
          \`);
        }
        if (sub.lastName?.visible !== false) {
          row1Html.push(\`
            <div class="input-wrapper" style="margin-bottom: 0.75rem;">
              <label class="contact-field-label" for="input-\${field.id}-lastName">\${t('contactLastName')} \${sub.lastName?.required ? '*' : ''}</label>
              <input type="text" id="input-\${field.id}-lastName" placeholder="\${t('contactLastNamePlaceholder')}" autocomplete="family-name" style="font-size: 1.2rem; padding: 0.5rem 0;">
            </div>
          \`);
        }
        
        let emailHtml = '';
        if (sub.email?.visible !== false) {
          emailHtml = \`
            <div class="input-wrapper" style="margin-bottom: 0.75rem; margin-top: 0.75rem;">
              <label class="contact-field-label" for="input-\${field.id}-email">\${t('contactEmail')} \${sub.email?.required ? '*' : ''}</label>
              <input type="email" id="input-\${field.id}-email" placeholder="\${t('contactEmailPlaceholder')}" autocomplete="email" style="font-size: 1.2rem; padding: 0.5rem 0;">
            </div>
          \`;
        }
        
        const row2Html = [];
        if (sub.phone?.visible !== false) {
          row2Html.push(\`
            <div class="input-wrapper" style="margin-bottom: 0.75rem;">
              <label class="contact-field-label" for="input-\${field.id}-phone">\${t('contactPhone')} \${sub.phone?.required ? '*' : ''}</label>
              <input type="tel" id="input-\${field.id}-phone" placeholder="\${t('contactPhonePlaceholder')}" autocomplete="tel" style="font-size: 1.2rem; padding: 0.5rem 0;">
            </div>
          \`);
        }
        if (sub.company?.visible !== false) {
          row2Html.push(\`
            <div class="input-wrapper" style="margin-bottom: 0.75rem;">
              <label class="contact-field-label" for="input-\${field.id}-company">\${t('contactCompany')} \${sub.company?.required ? '*' : ''}</label>
              <input type="text" id="input-\${field.id}-company" placeholder="\${t('contactCompanyPlaceholder')}" autocomplete="organization" style="font-size: 1.2rem; padding: 0.5rem 0;">
            </div>
          \`);
        }
        
        let innerHtml = '';
        if (row1Html.length > 0) {
          innerHtml += \`<div class="contact-grid">\${row1Html.join('')}</div>\`;
        }
        innerHtml += emailHtml;
        if (row2Html.length > 0) {
          const topMargin = (row1Html.length > 0 || emailHtml) ? '0.75rem' : '0';
          innerHtml += \`<div class="contact-grid" style="margin-top: \${topMargin};">\${row2Html.join('')}</div>\`;
        }
        
        inner = \`<div class="contact-group">\${innerHtml}</div>\`;
      } else {
        const inputType = field.type === 'number' ? 'number' : (field.type === 'email' ? 'email' : (field.type === 'tel' ? 'tel' : 'text'));
        inner = \`
          <div class="input-wrapper">
            <input type="\${inputType}" id="input-\${field.id}" placeholder="\${t('placeholder')}" autocomplete="off">
          </div>
        \`;
      }

      const hasSingleInput = ['text', 'email', 'tel', 'number', 'textarea'].includes(field.type);
      const labelHtml = hasSingleInput 
        ? \`<label for="input-\${field.id}">\${labelEscaped}</label>\` 
        : \`<span>\${labelEscaped}</span>\`;

      return \`
        <div class="field-item" style="margin-bottom: 2rem;">
          <h2 class="question-title">
            <span class="question-index">\${questionNum} →</span>
            \${labelHtml}
            \${isRequired ? '<span class="question-required">*</span>' : ''}
          </h2>
          \${descHtml}
          \${inner}
        </div>
      \`;
    }

        // Interactive selections
    function selectOptionCard(cardEl, fieldId) {
      const parent = cardEl.parentElement;
      parent.querySelectorAll('.option-card').forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      cardEl.classList.add('selected');
      cardEl.setAttribute('aria-checked', 'true');
      
      answers[fieldId] = cardEl.getAttribute('data-val');
      
      // Auto-advance for select cards after selection animation delay
      setTimeout(() => {
        submitCurrentField();
      }, 300);
    }

    function toggleOptionCard(cardEl, fieldId) {
      const isSelected = cardEl.classList.toggle('selected');
      cardEl.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      
      const parent = cardEl.parentElement;
      const selectedCards = parent.querySelectorAll('.option-card.selected');
      const vals = Array.from(selectedCards).map(c => c.getAttribute('data-val'));
      
      answers[fieldId] = vals;
    }

    function selectRadioOption(fieldId, val) {
      answers[fieldId] = val;
    }

    function handleTextareaKeydown(e) {
      // Allow Shift+Enter to newline, Enter alone submits the screen
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitCurrentField();
      }
    }

    // Display page and focus elements
    function showScreen(index) {
      // Handle Success screen specifically
      const wrapper = document.getElementById('screensWrapper');
      const screens = wrapper.querySelectorAll('.screen');
      
      screens.forEach(s => s.classList.remove('active'));
      
      let targetScreen;
      if (index === 'submit') {
        targetScreen = document.getElementById('page-submit');
      } else {
        targetScreen = document.getElementById('page-' + index);
        currentPageIdx = index;
      }

      if (targetScreen) {
        targetScreen.classList.add('active');
        
        // Auto focus input if present
        setTimeout(() => {
          const input = targetScreen.querySelector('input, textarea');
          if (input) input.focus();
        }, 100);
      }

      updateControls();
    }

    // Validation & Routing
    function submitCurrentField() {
      // If we are on the final submit screen, delegate
      if (document.getElementById('page-submit').classList.contains('active')) {
        finalizeSubmission();
        return;
      }

      const page = schema.pages[currentPageIdx];
      
      // Welcome screens don't have validation
      const welcomeField = page.fields.find(f => f.type === 'welcome');
      if (welcomeField) {
        goToNextPage();
        return;
      }

      // Validate all fields on current page
      let isValid = true;
      const errorDiv = document.getElementById('error-page-' + currentPageIdx);
      errorDiv.style.display = 'none';

      page.fields.forEach(field => {
        const val = getFieldValue(field);
        
        if (field.type === 'contact') {
          const sub = field.subFields || {
            firstName: { visible: true, required: true },
            lastName: { visible: true, required: true },
            email: { visible: true, required: true },
            phone: { visible: true, required: false },
            company: { visible: true, required: false }
          };
          const isAttempted = field.required || (val !== undefined);
          if (isAttempted) {
            const keys = ['firstName', 'lastName', 'email', 'phone', 'company'];
            keys.forEach(k => {
              if (sub[k]?.visible !== false && sub[k]?.required) {
                if (!val || !val[k]) {
                  isValid = false;
                }
              }
            });
          }
        } else if (field.required && (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0))) {
          isValid = false;
        }

        if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
          answers[field.id] = val;
        } else {
          delete answers[field.id];
        }
      });

      if (!isValid) {
        errorDiv.style.display = 'block';
        return;
      }

      // Save partial progress in the background (fire-and-forget)
      saveProgressPartial();

      goToNextPage();
    }

    function getFieldValue(field) {
      if (field.type === 'contact') {
        const sub = field.subFields || {
          firstName: { visible: true, required: true },
          lastName: { visible: true, required: true },
          email: { visible: true, required: true },
          phone: { visible: true, required: false },
          company: { visible: true, required: false }
        };
        const res = {};
        let hasData = false;
        const keys = ['firstName', 'lastName', 'email', 'phone', 'company'];
        keys.forEach(k => {
          if (sub[k]?.visible !== false) {
            const el = document.getElementById('input-' + field.id + '-' + k);
            const val = el ? el.value.trim() : '';
            if (val) {
              res[k] = val;
              hasData = true;
            }
          }
        });
        return hasData ? res : undefined;
      }
      if (field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') {
        return answers[field.id];
      }
      const el = document.getElementById('input-' + field.id);
      return el ? el.value.trim() : undefined;
    }

    function goToNextPage() {
      // Evaluate Jumps logic
      const page = schema.pages[currentPageIdx];
      let nextPageIdx = null;

      if (page.jumps && page.jumps.length > 0) {
        for (const rule of page.jumps) {
          if (rule.field && rule.value && rule.to) {
            const answer = answers[rule.field];
            if (answer && answer.toString().toLowerCase() === rule.value.toString().toLowerCase()) {
              // Find index of target page
              const targetIdx = schema.pages.findIndex(p => p.id === rule.to);
              if (targetIdx !== -1) {
                nextPageIdx = targetIdx;
                break;
              }
            }
          }
        }
      }

      // Fallback to sequential
      if (nextPageIdx === null) {
        if (currentPageIdx < schema.pages.length - 1) {
          nextPageIdx = currentPageIdx + 1;
        } else {
          nextPageIdx = 'submit';
        }
      }

      pageHistory.push(currentPageIdx);
      showScreen(nextPageIdx);
    }

    function goBack() {
      if (pageHistory.length > 0) {
        const prevIdx = pageHistory.pop();
        showScreen(prevIdx);
      }
    }

    // Update controls (progress, button enabled states)
    function updateControls() {
      const isSubmitScreen = document.getElementById('page-submit').classList.contains('active');
      
      // Prev Button state
      document.getElementById('btnPrev').disabled = pageHistory.length === 0;
      
      // Next Button title
      const btnNext = document.getElementById('btnNext');
      if (isSubmitScreen) {
        btnNext.disabled = true;
      } else {
        btnNext.disabled = false;
      }

      // Footer counter
      const footerCount = document.getElementById('footerCount');
      if (isSubmitScreen) {
        footerCount.innerText = t('submitting');
      } else {
        footerCount.innerText = t('pageOf', { current: currentPageIdx + 1, total: schema.pages.length });
      }

      // Progress bar percentage
      const progressBar = document.getElementById('progressBar');
      let pct = 0;
      if (isSubmitScreen) {
        pct = 100;
      } else {
        pct = Math.round((currentPageIdx / schema.pages.length) * 100);
      }
      progressBar.style.width = pct + '%';
    }

    // Background Saves
    async function saveProgressPartial() {
      if (isPreview) return;
      try {
        await fetch(\`/forms/\${formId}/submissions\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: submissionId,
            status: 'partial',
            answers: answers
          })
        });
      } catch (err) {
        console.warn('Unable to auto-save partial progress:', err);
      }
    }

    // Finalize Submission
    async function finalizeSubmission() {
      const errorDiv = document.getElementById('error-final');
      errorDiv.style.display = 'none';

      let turnstileToken = null;
      if (schema.turnstileEnabled && !isPreview) {
        // Retrieve Turnstile token
        const cfResEl = document.querySelector('[name="cf-turnstile-response"]');
        turnstileToken = cfResEl ? cfResEl.value : null;

        if (!turnstileToken) {
          errorDiv.style.display = 'block';
          return;
        }
      }

      if (isPreview) {
        showToast(t('simulatedSuccess'));
        setTimeout(() => {
          renderFinishedScreen();
        }, 1000);
        return;
      }

      try {
        const res = await fetch(\`/forms/\${formId}/submissions\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: submissionId,
            status: 'completed',
            answers: answers,
            turnstileToken: turnstileToken
          })
        });

        if (res.ok) {
          showToast(t('successToast'));
          renderFinishedScreen();
        } else {
          const errData = await res.json();
          showToast(t('failedToast', { error: errData.error || 'Server error' }), 'error');
        }
      } catch (err) {
        showToast(t('networkError'), 'error');
      }
    }

    function renderFinishedScreen() {
      // Render beautiful finalized finished screen
      const wrapper = document.getElementById('screensWrapper');
      wrapper.innerHTML = \`
        <div class="screen active success-screen" style="animation: fadeInUp 0.4s ease-out forwards;">
          <div class="success-icon" style="background: rgba(16,185,129,0.15); border-color: var(--success-color);">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h2 class="welcome-title" style="font-size: 2.2rem;">\${t('thankYou')}</h2>
          <p class="welcome-text">\${t('successDesc')}</p>
        </div>
      \`;
      document.querySelector('.footer-controls').style.display = 'none';
      document.getElementById('progressBar').style.width = '100%';
    }

    // Keyboard & Helpers
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const onCard = activeEl && activeEl.classList.contains('option-card');

      // Arrow Up/Down navigation — skip when a card is focused
      if (e.key === 'ArrowUp' && !onCard) {
        e.preventDefault();
        goBack();
      } else if (e.key === 'ArrowDown' && !onCard) {
        e.preventDefault();
        submitCurrentField();
      }

      // Enter key — skip when a card is focused (card's own onkeydown handles it)
      if (e.key === 'Enter' && !onCard) {
        // Don't intercept Enter inside textareas so user can line-break
        if (activeEl && activeEl.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        submitCurrentField();
      }

      // Option shortcut keys A, B, C for select grids
      const activeScreen = document.querySelector('.screen.active');
      if (activeScreen) {
        const selectGrid = activeScreen.querySelector('.options-grid');
        if (selectGrid) {
          const letter = e.key.toUpperCase();
          const card = selectGrid.querySelector(\`[data-letter="\${letter}"]\`);
          if (card) {
            e.preventDefault();
            card.click();
            card.focus();
          }
        }
      }
    });

    // Helper functions
    function escapeHtml(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function showToast(msg, type = 'success') {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.className = 'show';
      if (type === 'error') {
        toast.style.borderLeft = '4px solid var(--error-color)';
      } else {
        toast.style.borderLeft = '4px solid var(--success-color)';
      }
      setTimeout(() => {
        toast.className = '';
      }, 4000);
    }

    // Start
    initForm();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
