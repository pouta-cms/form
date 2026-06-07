export const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pouta Forms - Admin Builder</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- BlockNote Mantine Stylesheet -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@blocknote/core@0.17.0/src/fonts/inter.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@blocknote/mantine@0.17.0/dist/style.css" />
  <!-- Import map for esm.sh CDN -->
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.3.1",
        "react-dom": "https://esm.sh/react-dom@18.3.1",
        "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
        "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
        "@blocknote/core": "https://esm.sh/@blocknote/core@0.17.0?external=react,react-dom",
        "@blocknote/react": "https://esm.sh/@blocknote/react@0.17.0?external=react,react-dom",
        "@blocknote/mantine": "https://esm.sh/@blocknote/mantine@0.17.0?external=react,react-dom"
      }
    }
  </script>
  <style>
    :root {
      --bg-main: #0b0f19;
      --bg-panel: rgba(20, 28, 47, 0.7);
      --bg-sidebar: rgba(15, 23, 42, 0.95);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --accent-grad: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
      --accent-color: #F59E0B;
      --accent-hover: #d97706;
      --danger-color: #ef4444;
      --success-color: #10b981;
      --transition-fast: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
      height: 100vh;
      overflow: hidden;
      display: flex;
    }

    /* Glassmorphism Utilities */
    .glass-card {
      background: var(--bg-panel);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Left Sidebar */
    aside {
      width: 280px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      height: 100%;
      flex-shrink: 0;
      z-index: 10;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-text {
      font-weight: 700;
      font-size: 1.2rem;
      letter-spacing: -0.025em;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
      font-weight: 600;
    }

    .form-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1.5rem;
    }

    .form-item-btn {
      width: 100%;
      text-align: left;
      background: transparent;
      border: 1px solid transparent;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form-item-btn:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-primary);
    }

    .form-item-btn.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.3);
      color: var(--text-primary);
    }

    .btn-create {
      width: 100%;
      background: var(--accent-grad);
      border: none;
      color: white;
      padding: 0.7rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }

    .btn-create:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .user-info {
      font-size: 0.8rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-logout {
      background: transparent;
      border: none;
      color: var(--danger-color);
      font-size: 0.8rem;
      cursor: pointer;
      text-align: left;
      width: fit-content;
      font-weight: 500;
    }

    .btn-logout:hover {
      text-decoration: underline;
    }

    /* Main Content Area */
    main {
      flex: 1;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    header {
      height: 70px;
      border-bottom: 1px solid var(--border-color);
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(11, 15, 25, 0.5);
    }

    .header-left {
      display: flex;
      flex-direction: column;
    }

    .form-heading {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .form-subheading {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Tab Buttons */
    .tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.25rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 0.45rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: var(--transition-fast);
    }

    .tab-btn.active {
      background: var(--accent-grad);
      color: white;
    }

    .btn-publish {
      background: var(--accent-grad);
      border: none;
      color: white;
      padding: 0.55rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      transition: var(--transition-fast);
    }

    .btn-publish:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }

    /* Workspace Content Panel */
    .workspace-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.03), transparent 40%);
    }

    .tab-pane {
      display: none;
      animation: fadeIn 0.2s ease-out;
    }

    .tab-pane.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Welcome view when no form is selected */
    .welcome-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .welcome-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      opacity: 0.9;
    }

    .welcome-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .welcome-text {
      color: var(--text-secondary);
      max-width: 400px;
      font-size: 0.95rem;
    }

    /* Builder View Styles */
    .form-meta-section {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 1.5rem;
      align-items: end;
      margin-bottom: 2rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    input[type="text"], input[type="url"], input[type="number"], select, textarea {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      color: white;
      font-family: inherit;
      font-size: 0.9rem;
      transition: var(--transition-fast);
      width: 100%;
      box-sizing: border-box;
    }

    input[type="text"]:focus, input[type="url"]:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      height: 100%;
      padding-top: 1.5rem;
    }

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--accent-color);
      cursor: pointer;
    }

    /* Pages Container */
    .pages-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-card {
      padding: 1.5rem;
      position: relative;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.75rem;
    }

    .page-title-input {
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      background: transparent !important;
      border-color: transparent !important;
      padding: 0.25rem 0 !important;
      width: 300px !important;
    }

    .page-title-input:focus {
      border-bottom-color: var(--accent-color) !important;
      border-radius: 0 !important;
    }

    .btn-action-danger {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--danger-color);
      padding: 0.35rem 0.7rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .btn-action-danger:hover {
      background: rgba(239, 68, 68, 0.15);
    }

    /* Fields List */
    .fields-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .field-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr auto auto;
      gap: 1rem;
      align-items: end;
      background: rgba(255, 255, 255, 0.015);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.05);
    }

    .field-row.field-row-welcome {
      background: rgba(99, 102, 241, 0.05);
      border: 1px dashed rgba(99, 102, 241, 0.3);
    }

    .blocknote-editor-container,
    .description-editor-container {
      min-height: 250px;
      background: #0f172a;
      border-radius: 8px;
      padding: 0.5rem;
      margin-top: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      text-align: left;
    }

    .description-editor-container {
      min-height: 120px;
    }

    .blocknote-editor-container .bn-editor,
    .description-editor-container .bn-editor {
      background: transparent !important;
      color: #f8fafc !important;
      min-height: 200px;
    }

    .description-editor-container .bn-editor {
      min-height: 100px;
    }

    .field-options-input {
      grid-column: 1 / span 4;
      margin-top: 0.5rem;
    }

    .btn-icon {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      transition: var(--transition-fast);
      align-self: center;
    }

    .btn-icon:hover {
      color: var(--danger-color);
      background: rgba(239, 68, 68, 0.1);
    }

    .btn-icon:disabled {
      color: rgba(255, 255, 255, 0.15) !important;
      background: transparent !important;
      cursor: not-allowed !important;
    }

    .btn-icon-move:hover {
      color: var(--accent-color) !important;
      background: rgba(99, 102, 241, 0.1) !important;
    }

    .btn-add-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed var(--border-color);
      color: var(--text-secondary);
      padding: 0.55rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      text-align: center;
      transition: var(--transition-fast);
    }

    .btn-add-item:hover {
      border-color: var(--accent-color);
      color: var(--text-primary);
      background: rgba(99, 102, 241, 0.03);
    }

    /* Jumps Editor */
    .jumps-container {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.05);
    }

    .jump-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1.5fr 1.5fr auto;
      gap: 1rem;
      align-items: center;
      margin-top: 0.5rem;
    }

    /* Preview Tab Pane */
    pre {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      color: #6ee7b7;
      font-family: monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    /* Submissions Tab Pane */
    .submissions-table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    th {
      background: rgba(15, 23, 42, 0.8);
      padding: 1rem;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: top;
      max-width: 400px;
      overflow-wrap: break-word;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.01);
    }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-completed {
      background: rgba(16, 185, 129, 0.15);
      color: var(--success-color);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .badge-partial {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .json-answers {
      font-family: monospace;
      font-size: 0.8rem;
      color: #a7f3d0;
    }

    /* Toast Notification */
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
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    #toast.success {
      border-left: 4px solid var(--success-color);
    }

    #toast.error {
      border-left: 4px solid var(--danger-color);
    }

    /* Dialog modal */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }

    .dialog-overlay.show {
      opacity: 1;
      pointer-events: auto;
    }

    .dialog-card {
      width: 400px;
      padding: 1.5rem;
      border-radius: 12px;
      animation: zoomIn 0.2s ease-out;
    }

    @keyframes zoomIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .dialog-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.02);
      color: var(--text-primary);
    }
  </style>
</head>
<body>

  <!-- Left Sidebar -->
  <aside>
    <div class="sidebar-header">
      <div class="logo-container">
        <div class="logo-icon">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <g stroke="#F59E0B" stroke-linecap="round">
              <line x1="50" y1="8" x2="50" y2="19" stroke-width="5.5"></line>
              <line x1="50" y1="81" x2="50" y2="92" stroke-width="5.5"></line>
              <line x1="8" y1="50" x2="19" y2="50" stroke-width="5.5"></line>
              <line x1="81" y1="50" x2="92" y2="50" stroke-width="5.5"></line>
              <line x1="21.7" y1="21.7" x2="29.4" y2="29.4" stroke-width="5"></line>
              <line x1="70.6" y1="70.6" x2="78.3" y2="78.3" stroke-width="5"></line>
              <line x1="78.3" y1="21.7" x2="70.6" y2="29.4" stroke-width="5"></line>
              <line x1="29.4" y1="70.6" x2="21.7" y2="78.3" stroke-width="5"></line>
              <line x1="13.4" y1="35.7" x2="20.2" y2="39.6" stroke-width="4.5"></line>
              <line x1="79.8" y1="60.4" x2="86.6" y2="64.3" stroke-width="4.5"></line>
              <line x1="35.7" y1="13.4" x2="39.6" y2="20.2" stroke-width="4.5"></line>
              <line x1="60.4" y1="79.8" x2="64.3" y2="86.6" stroke-width="4.5"></line>
              <line x1="64.3" y1="13.4" x2="60.4" y2="20.2" stroke-width="4.5"></line>
              <line x1="39.6" y1="79.8" x2="35.7" y2="86.6" stroke-width="4.5"></line>
              <line x1="86.6" y1="35.7" x2="79.8" y2="39.6" stroke-width="4.5"></line>
              <line x1="20.2" y1="60.4" x2="13.4" y2="64.3" stroke-width="4.5"></line>
            </g>
            <circle cx="50" cy="50" r="22" stroke="#F59E0B" stroke-width="3.5" fill="none"></circle>
            <circle cx="50" cy="50" r="15" stroke="#F59E0B" stroke-width="2.5" fill="none"></circle>
            <circle cx="50" cy="50" r="9" stroke="#F59E0B" stroke-width="2" fill="none"></circle>
            <circle cx="50" cy="50" r="4" fill="#F59E0B"></circle>
          </svg>
        </div>
        <div class="logo-text">Pouta Forms</div>
      </div>
    </div>
    <div class="sidebar-content">
      <div class="section-title">Forms on Edge</div>
      <ul class="form-list" id="formsListContainer">
        <!-- Dyn list -->
      </ul>
      <button class="btn-create" onclick="openCreateFormDialog()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/></svg>
        New Form Schema
      </button>
    </div>
    <div class="sidebar-footer">
      <div class="user-info" id="userEmailLabel">loading...</div>
      <button class="btn-logout" onclick="logout()">Sign out</button>
    </div>
  </aside>

  <!-- Main Content Space -->
  <main id="workspaceWrapper" style="display: none;">
    <header>
      <div class="header-left">
        <h1 class="form-heading" id="headerFormTitle">Form Title</h1>
        <div class="form-subheading" style="display: flex; gap: 0.5rem; align-items: center; font-size: 0.8rem; color: var(--text-secondary);">
          <span id="headerFormId">ID: test-form</span>
          <span style="color: var(--border-color)">|</span>
          <a id="headerFormLink" href="#" target="_blank" style="color: #F59E0B; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 500; transition: color 0.2s;">
            <span>Open Form</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <span style="color: var(--border-color)">|</span>
          <button onclick="copyFormLink()" style="background: none; border: none; color: #F59E0B; cursor: pointer; font-size: 0.8rem; font-weight: 500; padding: 0; display: inline-flex; align-items: center; gap: 0.25rem; transition: color 0.2s;" title="Copy shareable link">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span id="copyLinkText">Copy Link</span>
          </button>
          <span style="color: var(--border-color)">|</span>
          <button onclick="copyEditLink()" style="background: none; border: none; color: #fbbf24; cursor: pointer; font-size: 0.8rem; font-weight: 500; padding: 0; display: inline-flex; align-items: center; gap: 0.25rem; transition: color 0.2s;" title="Copy admin edit link">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span id="copyEditLinkText">Copy Edit Link</span>
          </button>
        </div>
      </div>
      <div class="header-right">
        <div class="tabs">
          <button class="tab-btn active" onclick="switchTab('builder')">Builder</button>
          <button class="tab-btn" onclick="switchTab('preview')">Preview</button>
          <button class="tab-btn" onclick="switchTab('submissions')">Submissions</button>
          <button class="tab-btn" onclick="switchTab('json')">Schema JSON</button>
        </div>
        <button class="btn-action-danger" style="padding: 0.55rem 1.2rem; font-size: 0.85rem; margin-right: 0.5rem;" onclick="deleteCurrentForm()">Delete Form</button>
        <button class="btn-publish" onclick="publishForm()">Publish to Edge</button>
      </div>
    </header>

    <div class="workspace-content">
      <!-- 1. Builder Tab Pane -->
      <div id="tab-builder" class="tab-pane active">
        <div class="form-meta-section">
          <div class="input-group">
            <label for="metaTitle">Form Title</label>
            <input type="text" id="metaTitle" oninput="updateFormTitle(this.value)">
          </div>
          <div class="input-group">
            <label for="metaLogoUrl">Logo Image URL</label>
            <input type="text" id="metaLogoUrl" placeholder="https://example.com/logo.svg" oninput="updateLogoUrl(this.value)">
          </div>
          <div class="checkbox-group" style="padding-top: 0;">
            <input type="checkbox" id="metaTurnstile" onchange="updateTurnstileEnabled(this.checked)">
            <label for="metaTurnstile">Enable Turnstile</label>
          </div>
        </div>

        <div class="pages-container" id="pagesListContainer">
          <!-- Dyn list of pages -->
        </div>

        <button class="btn-add-item" style="margin-top: 1.5rem;" onclick="addPage()">
          + Add New Page
        </button>
      </div>

      <!-- 2. Submissions Tab Pane -->
      <div id="tab-submissions" class="tab-pane">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0; color: var(--text-primary);">Form Submissions</h2>
          <button class="btn-publish" style="margin: 0;" onclick="exportSubmissionsToCsv()">
            Export to CSV
          </button>
        </div>
        <div class="submissions-table-container">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Status</th>
                <th>Answers Payload</th>
                <th>Last Saved</th>
              </tr>
            </thead>
            <tbody id="submissionsTableBody">
              <!-- Dyn list of submissions -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. Preview Tab Pane -->
      <div id="tab-preview" class="tab-pane">
        <iframe id="previewIframe" style="width: 100%; height: calc(100vh - 180px); border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-main);"></iframe>
      </div>

      <!-- 3. Schema JSON Preview Tab Pane -->
      <div id="tab-json" class="tab-pane">
        <pre id="jsonPreviewBlock"></pre>
      </div>
    </div>
  </main>

  <!-- Empty state welcome screen -->
  <div class="welcome-container" id="emptyWorkspaceState" style="flex: 1;">
    <div class="welcome-icon">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
        <g stroke="#F59E0B" stroke-linecap="round">
          <line x1="50" y1="8" x2="50" y2="19" stroke-width="5.5"></line>
          <line x1="50" y1="81" x2="50" y2="92" stroke-width="5.5"></line>
          <line x1="8" y1="50" x2="19" y2="50" stroke-width="5.5"></line>
          <line x1="81" y1="50" x2="92" y2="50" stroke-width="5.5"></line>
          <line x1="21.7" y1="21.7" x2="29.4" y2="29.4" stroke-width="5"></line>
          <line x1="70.6" y1="70.6" x2="78.3" y2="78.3" stroke-width="5"></line>
          <line x1="78.3" y1="21.7" x2="70.6" y2="29.4" stroke-width="5"></line>
          <line x1="29.4" y1="70.6" x2="21.7" y2="78.3" stroke-width="5"></line>
          <line x1="13.4" y1="35.7" x2="20.2" y2="39.6" stroke-width="4.5"></line>
          <line x1="79.8" y1="60.4" x2="86.6" y2="64.3" stroke-width="4.5"></line>
          <line x1="35.7" y1="13.4" x2="39.6" y2="20.2" stroke-width="4.5"></line>
          <line x1="60.4" y1="79.8" x2="64.3" y2="86.6" stroke-width="4.5"></line>
          <line x1="64.3" y1="13.4" x2="60.4" y2="20.2" stroke-width="4.5"></line>
          <line x1="39.6" y1="79.8" x2="35.7" y2="86.6" stroke-width="4.5"></line>
          <line x1="86.6" y1="35.7" x2="79.8" y2="39.6" stroke-width="4.5"></line>
          <line x1="20.2" y1="60.4" x2="13.4" y2="64.3" stroke-width="4.5"></line>
        </g>
        <circle cx="50" cy="50" r="22" stroke="#F59E0B" stroke-width="3.5" fill="none"></circle>
        <circle cx="50" cy="50" r="15" stroke="#F59E0B" stroke-width="2.5" fill="none"></circle>
        <circle cx="50" cy="50" r="9" stroke="#F59E0B" stroke-width="2" fill="none"></circle>
        <circle cx="50" cy="50" r="4" fill="#F59E0B"></circle>
      </svg>
    </div>
    <h2 class="welcome-title">Pouta Forms Dashboard</h2>
    <p class="welcome-text">Select a form schema from the left sidebar to view details, configure page fields, edit logic jumps, or check submission logs. You can also create a new form configuration instantly.</p>
  </div>

  <!-- Create Form Modal dialog -->
  <div class="dialog-overlay" id="createFormDialog">
    <div class="dialog-card glass-card">
      <div class="dialog-title">Create Form Schema</div>
      <div class="input-group" style="margin-bottom: 1rem;">
        <label for="newFormId">Form Key / ID (alphanumeric, e.g. 'contact-us')</label>
        <input type="text" id="newFormId" placeholder="contact-us">
      </div>
      <div class="input-group">
        <label for="newFormTitle">Form Title</label>
        <input type="text" id="newFormTitle" placeholder="Contact Form">
      </div>
      <div class="dialog-buttons">
        <button class="btn-secondary" onclick="closeCreateFormDialog()">Cancel</button>
        <button class="btn-publish" onclick="createForm()">Create</button>
      </div>
    </div>
  </div>

  <!-- Toast Element -->
  <div id="toast"></div>

  <!-- Frontend Logic -->
  <script>
    // State management
    let state = {
      forms: [],
      currentFormId: null,
      schema: {
        id: '',
        title: '',
        turnstileEnabled: false,
        pages: []
      },
      submissions: [],
      user: null
    };

    // Initialize Page
    async function init() {
      // 1. Verify Authentication
      try {
        const res = await fetch('/admin/verify');
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        const data = await res.json();
        state.user = data;
        document.getElementById('userEmailLabel').innerText = data.email;
      } catch (err) {
        showToast('Authentication check failed', 'error');
        return;
      }

      // 2. Fetch Form List
      await fetchFormsList();

      // 3. Auto-load form from ?form= URL param (deep-link support)
      const params = new URLSearchParams(window.location.search);
      const deepFormId = params.get('form');
      if (deepFormId) {
        await selectForm(deepFormId);
      }
    }

    async function fetchFormsList() {
      try {
        const res = await fetch('/admin/forms');
        if (res.ok) {
          const list = await res.json();
          state.forms = list.keys || [];
          renderFormsList();
        } else {
          showToast('Failed to fetch forms list', 'error');
        }
      } catch (err) {
        showToast('Network error fetching forms', 'error');
      }
    }

    function renderFormsList() {
      const container = document.getElementById('formsListContainer');
      container.innerHTML = '';
      
      if (state.forms.length === 0) {
        container.innerHTML = '<li style="color: var(--text-secondary); font-size: 0.85rem; padding: 0.5rem 0.8rem;">No forms created yet</li>';
        return;
      }

      state.forms.forEach(form => {
        const li = document.createElement('li');
        const activeClass = state.currentFormId === form.name ? 'active' : '';
        li.innerHTML = \`
          <button class="form-item-btn \${activeClass}" onclick="selectForm('\${form.name}')">
            <span>\${form.name}</span>
          </button>
        \`;
        container.appendChild(li);
      });
    }

    async function selectForm(formId) {
      state.currentFormId = formId;
      renderFormsList();

      try {
        // Fetch Schema
        const schemaRes = await fetch(\`/forms/\${formId}\`);
        if (schemaRes.ok) {
          const schema = await schemaRes.json();
          state.schema = {
            ...schema,
            id: formId,
            title: schema.title || 'Untitled Form',
            turnstileEnabled: !!schema.turnstileEnabled,
            pages: schema.pages || []
          };
          
          // Fetch Submissions
          const subsRes = await fetch(\`/admin/submissions/\${formId}\`);
          if (subsRes.ok) {
            const subsData = await subsRes.json();
            state.submissions = subsData.submissions || [];
          } else {
            state.submissions = [];
          }

          // Update Workspace UI
          document.getElementById('emptyWorkspaceState').style.display = 'none';
          const workspace = document.getElementById('workspaceWrapper');
          workspace.style.display = 'flex';

          document.getElementById('headerFormTitle').innerText = state.schema.title;
          document.getElementById('headerFormId').innerText = 'ID: ' + formId;
          document.getElementById('headerFormLink').href = '/forms/' + formId;
          
          document.getElementById('metaTitle').value = state.schema.title;
          document.getElementById('metaLogoUrl').value = state.schema.logoUrl || '';
          document.getElementById('metaTurnstile').checked = state.schema.turnstileEnabled;

          renderPages();
          renderSubmissions();
          renderJsonPreview();
          switchTab('builder');
        } else {
          showToast('Failed to load form schema', 'error');
        }
      } catch (err) {
        showToast('Network error loading form data', 'error');
      }
    }

    // Modal Control
    function openCreateFormDialog() {
      document.getElementById('createFormDialog').classList.add('show');
      document.getElementById('newFormId').value = '';
      document.getElementById('newFormTitle').value = '';
    }

    function closeCreateFormDialog() {
      document.getElementById('createFormDialog').classList.remove('show');
    }

    async function createForm() {
      const rawId = document.getElementById('newFormId').value.trim();
      const title = document.getElementById('newFormTitle').value.trim();
      
      if (!rawId || !title) {
        showToast('Please provide both Form Key and Title', 'error');
        return;
      }

      // Sanitize key
      const id = rawId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

      // Publish empty schema to create
      const newSchema = {
        id,
        title,
        turnstileEnabled: false,
        pages: []
      };

      try {
        const res = await fetch(\`/admin/forms/\${id}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSchema)
        });

        if (res.ok) {
          showToast('Form created successfully', 'success');
          closeCreateFormDialog();
          await fetchFormsList();
          selectForm(id);
        } else {
          const err = await res.json();
          showToast('Create failed: ' + (err.error || 'Server error'), 'error');
        }
      } catch (err) {
        showToast('Network error creating form', 'error');
      }
    }

    // Builder Mutations
    function updateFormTitle(val) {
      state.schema.title = val;
      document.getElementById('headerFormTitle').innerText = val;
      renderJsonPreview();
    }

    function updateLogoUrl(val) {
      state.schema.logoUrl = val;
      renderJsonPreview();
    }

    function copyFormLink() {
      if (!state.currentFormId) return;
      const url = window.location.origin + '/forms/' + state.currentFormId;
      navigator.clipboard.writeText(url).then(() => {
        const el = document.getElementById('copyLinkText');
        el.innerText = 'Copied!';
        setTimeout(() => { el.innerText = 'Copy Link'; }, 2000);
      }).catch(() => {
        // Fallback for non-HTTPS
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const el = document.getElementById('copyLinkText');
        el.innerText = 'Copied!';
        setTimeout(() => { el.innerText = 'Copy Link'; }, 2000);
      });
    }

    function copyEditLink() {
      if (!state.currentFormId) return;
      const url = window.location.origin + '/admin?form=' + state.currentFormId;
      navigator.clipboard.writeText(url).then(() => {
        const el = document.getElementById('copyEditLinkText');
        el.innerText = 'Copied!';
        setTimeout(() => { el.innerText = 'Copy Edit Link'; }, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const el = document.getElementById('copyEditLinkText');
        el.innerText = 'Copied!';
        setTimeout(() => { el.innerText = 'Copy Edit Link'; }, 2000);
      });
    }

    function updateTurnstileEnabled(val) {
      state.schema.turnstileEnabled = val;
      renderJsonPreview();
    }

    function addPage() {
      const pageId = 'page-' + (state.schema.pages.length + 1);
      state.schema.pages.push({
        id: pageId,
        title: 'Untitled Page',
        fields: []
      });
      renderPages();
      renderJsonPreview();
    }

    function deletePage(pageIndex) {
      state.schema.pages.splice(pageIndex, 1);
      renderPages();
      renderJsonPreview();
    }

    function updatePageTitle(pageIndex, val) {
      state.schema.pages[pageIndex].title = val;
      renderJsonPreview();
    }

    function addField(pageIndex) {
      const page = state.schema.pages[pageIndex];
      const fieldId = 'field-' + (page.fields.length + 1);
      page.fields.push({
        id: fieldId,
        type: 'text',
        label: 'New Question',
        required: false
      });
      renderPages();
      renderJsonPreview();
    }

    function updateFieldData(pageIndex, fieldIndex, key, val) {
      const field = state.schema.pages[pageIndex].fields[fieldIndex];
      field[key] = val;
      renderJsonPreview();
    }

    function updateField(pageIndex, fieldIndex, key, val) {
      const field = state.schema.pages[pageIndex].fields[fieldIndex];
      if (key === 'required') {
        field[key] = val;
      } else {
        field[key] = val;
      }

      // Handle extra options field for select/multiselect/radio dropdowns/lists
      if (key === 'type' && (val === 'select' || val === 'multiselect' || val === 'radio')) {
        if (!field.options) {
          field.options = ['Option 1', 'Option 2'];
        }
      } else if (key === 'type') {
        delete field.options;
      }

      // If we switched to a welcome screen, remove required since it's just text
      if (key === 'type' && val === 'welcome') {
        delete field.required;
        if (!field.welcomeMarkdown) {
          const title = field.label && field.label !== 'New Question' ? field.label : 'Welcome to our Form';
          const desc = field.description || "Welcome! Let's get started with this questionnaire.";
          field.welcomeMarkdown = '# ' + title + '\\n\\n' + desc;
        }
      }

      renderPages();
      renderJsonPreview();
    }

    function updateFieldOptions(pageIndex, fieldIndex, commaOptions) {
      const field = state.schema.pages[pageIndex].fields[fieldIndex];
      field.options = commaOptions.split(',').map(o => o.trim()).filter(Boolean);
      renderJsonPreview();
    }

    function deleteField(pageIndex, fieldIndex) {
      state.schema.pages[pageIndex].fields.splice(fieldIndex, 1);
      renderPages();
      renderJsonPreview();
    }

    // Logic Jumps Editor
    function addJumpRule(pageIndex) {
      const page = state.schema.pages[pageIndex];
      if (!page.jumps) page.jumps = [];
      page.jumps.push({
        field: '',
        value: '',
        to: ''
      });
      renderPages();
      renderJsonPreview();
    }

    function updateJumpRule(pageIndex, ruleIndex, key, val) {
      const page = state.schema.pages[pageIndex];
      page.jumps[ruleIndex][key] = val;
      renderJsonPreview();
    }

    function deleteJumpRule(pageIndex, ruleIndex) {
      const page = state.schema.pages[pageIndex];
      page.jumps.splice(ruleIndex, 1);
      if (page.jumps.length === 0) delete page.jumps;
      renderPages();
      renderJsonPreview();
    }

    function movePageUp(pageIndex) {
      if (pageIndex <= 0) return;
      const pages = state.schema.pages;
      const temp = pages[pageIndex];
      pages[pageIndex] = pages[pageIndex - 1];
      pages[pageIndex - 1] = temp;
      renderPages();
      renderJsonPreview();
    }

    function movePageDown(pageIndex) {
      const pages = state.schema.pages;
      if (pageIndex >= pages.length - 1) return;
      const temp = pages[pageIndex];
      pages[pageIndex] = pages[pageIndex + 1];
      pages[pageIndex + 1] = temp;
      renderPages();
      renderJsonPreview();
    }

    function moveFieldUp(pageIndex, fieldIndex) {
      if (fieldIndex <= 0) return;
      const fields = state.schema.pages[pageIndex].fields;
      const temp = fields[fieldIndex];
      fields[fieldIndex] = fields[fieldIndex - 1];
      fields[fieldIndex - 1] = temp;
      renderPages();
      renderJsonPreview();
    }

    function moveFieldDown(pageIndex, fieldIndex) {
      const fields = state.schema.pages[pageIndex].fields;
      if (fieldIndex >= fields.length - 1) return;
      const temp = fields[fieldIndex];
      fields[fieldIndex] = fields[fieldIndex + 1];
      fields[fieldIndex + 1] = temp;
      renderPages();
      renderJsonPreview();
    }

    // Rendering Helpers
    function renderPages() {
      const container = document.getElementById('pagesListContainer');
      container.innerHTML = '';

      if (state.schema.pages.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem; border: 1px dashed var(--border-color); border-radius: 12px;">This form has no pages. Add a page to start building questions.</div>';
        return;
      }

      state.schema.pages.forEach((page, pageIdx) => {
        const pageCard = document.createElement('div');
        pageCard.className = 'page-card glass-card';
        
        let fieldsHtml = '';
        page.fields.forEach((field, fieldIdx) => {
          const isSelect = field.type === 'select' || field.type === 'multiselect' || field.type === 'radio';
          const isWelcome = field.type === 'welcome';
          const optionsValue = field.options ? field.options.join(', ') : '';          
          fieldsHtml += \`
            <div class="field-row\${isWelcome ? ' field-row-welcome' : ''}">
              \${isWelcome ? \`
                <div class="input-group" style="grid-column: 1 / span 2;">
                   <label for="field-welcome-id-\${pageIdx}-\${fieldIdx}">Field Identifier (Welcome Screen)</label>
                   <input type="text" id="field-welcome-id-\${pageIdx}-\${fieldIdx}" value="\${escapeHtml(field.id)}" oninput="updateFieldData(\${pageIdx}, \${fieldIdx}, 'id', this.value)">
                </div>
              \` : \`
                <div class="input-group">
                  <label for="field-label-\${pageIdx}-\${fieldIdx}">Question Label</label>
                  <input type="text" id="field-label-\${pageIdx}-\${fieldIdx}" value="\${escapeHtml(field.label)}" oninput="updateFieldData(\${pageIdx}, \${fieldIdx}, 'label', this.value)">
                </div>
                <div class="input-group">
                  <label for="field-id-\${pageIdx}-\${fieldIdx}">Field Identifier</label>
                  <input type="text" id="field-id-\${pageIdx}-\${fieldIdx}" value="\${escapeHtml(field.id)}" oninput="updateFieldData(\${pageIdx}, \${fieldIdx}, 'id', this.value)">
                </div>
              \`}
              <div class="input-group">
                <label for="field-type-\${pageIdx}-\${fieldIdx}">Type</label>
                <select id="field-type-\${pageIdx}-\${fieldIdx}" onchange="updateField(\${pageIdx}, \${fieldIdx}, 'type', this.value)">
                  <option value="text" \${field.type === 'text' ? 'selected' : ''}>Text Input</option>
                  <option value="email" \${field.type === 'email' ? 'selected' : ''}>Email Input</option>
                  <option value="tel" \${field.type === 'tel' ? 'selected' : ''}>Phone Number Input</option>
                  <option value="number" \${field.type === 'number' ? 'selected' : ''}>Number Input</option>
                  <option value="textarea" \${field.type === 'textarea' ? 'selected' : ''}>Multi-line Text</option>
                  <option value="select" \${field.type === 'select' ? 'selected' : ''}>Dropdown Select</option>
                  <option value="multiselect" \${field.type === 'multiselect' ? 'selected' : ''}>Multi-Select Checkboxes</option>
                  <option value="radio" \${field.type === 'radio' ? 'selected' : ''}>Radio Buttons</option>
                  <option value="contact" \${field.type === 'contact' ? 'selected' : ''}>Contact Info Group</option>
                  <option value="welcome" \${field.type === 'welcome' ? 'selected' : ''}>Welcome Screen</option>
                </select>
              </div>
              \${isWelcome ? \`
                <div></div> <!-- Spacer for alignment -->
              \` : \`
              <div class="checkbox-group" style="padding-top: 0; align-self: center; height: auto;">
                <input type="checkbox" id="req-\${pageIdx}-\${fieldIdx}" \${field.required ? 'checked' : ''} onchange="updateField(\${pageIdx}, \${fieldIdx}, 'required', this.checked)">
                <label for="req-\${pageIdx}-\${fieldIdx}">Required</label>
              </div>
              \`}
              <div style="display: flex; gap: 0.25rem; align-self: center;">
                <button class="btn-icon btn-icon-move" onclick="moveFieldUp(\${pageIdx}, \${fieldIdx})" \${fieldIdx === 0 ? 'disabled' : ''} title="Move Question Up">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button class="btn-icon btn-icon-move" onclick="moveFieldDown(\${pageIdx}, \${fieldIdx})" \${fieldIdx === page.fields.length - 1 ? 'disabled' : ''} title="Move Question Down">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
              <button class="btn-icon" onclick="deleteField(\${pageIdx}, \${fieldIdx})" title="Delete Question">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              \${!isWelcome ? \`
                <div class="input-group field-description-input" style="grid-column: 1 / span 6; margin-top: 1rem; width: 100%; text-align: left;">
                  <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem;">Description / Helper Text (BlockNote Rich Text Editor - optional)</div>
                  <div class="description-editor-container" data-page-idx="\${pageIdx}" data-field-idx="\${fieldIdx}"></div>
                </div>
              \` : ''}
              \${isSelect ? \`
                <div class="input-group field-options-input">
                  <label for="field-options-\${pageIdx}-\${fieldIdx}">Options (comma separated)</label>
                  <input type="text" id="field-options-\${pageIdx}-\${fieldIdx}" value="\${escapeHtml(optionsValue)}" placeholder="Option A, Option B, Option C" onchange="updateFieldOptions(\${pageIdx}, \${fieldIdx}, this.value)">
                </div>
              \` : ''}
              \${isWelcome ? \`
                <div class="welcome-editor-section" style="grid-column: 1 / span 6; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); width: 100%; text-align: left;">
                  <div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-primary);">Welcome Content (BlockNote Rich Text Editor)</div>
                  <div class="blocknote-editor-container" data-page-idx="\${pageIdx}" data-field-idx="\${fieldIdx}"></div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div class="input-group">
                      <label for="field-btn-label-\${pageIdx}-\${fieldIdx}">Start Button Text</label>
                      <input type="text" id="field-btn-label-\${pageIdx}-\${fieldIdx}" value="\${escapeHtml(field.buttonLabel || '')}" placeholder="Start Form" oninput="updateFieldData(\${pageIdx}, \${fieldIdx}, 'buttonLabel', this.value)">
                    </div>
                    <div class="input-group">
                      <label for="field-btn-sub-\${pageIdx}-\${fieldIdx}">Start Button Subtext</label>
                      <input type="text" id="field-btn-sub-\${pageIdx}-\${fieldIdx}" value="\${escapeHtml(field.buttonSubtext || '')}" placeholder="Kestää X minuuttia" oninput="updateFieldData(\${pageIdx}, \${fieldIdx}, 'buttonSubtext', this.value)">
                    </div>
                  </div>
                </div>
              \` : ''}
            </div>
          \`;
        });

                // Jumps logic
        let jumpsHtml = '';
        const otherPages = state.schema.pages.filter((p, i) => i !== pageIdx);
        if (page.jumps && page.jumps.length > 0) {
          page.jumps.forEach((rule, ruleIdx) => {
            jumpsHtml += \`
              <div class="jump-row">
                <div style="font-size: 0.85rem; color: var(--text-secondary);">If Field</div>
                <select onchange="updateJumpRule(\${pageIdx}, \${ruleIdx}, 'field', this.value)">
                  <option value="">-- select field --</option>
                  \${page.fields.map(f => \`<option value="\${f.id}" \${rule.field === f.id ? 'selected' : ''}>\${f.label} (\${f.id})</option>\`).join('')}
                </select>
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-align: center;">equals</div>
                <input type="text" value="\${escapeHtml(rule.value)}" placeholder="Value" oninput="updateJumpRule(\${pageIdx}, \${ruleIdx}, 'value', this.value)">
                <div style="font-size: 0.85rem; color: var(--text-secondary); text-align: center;">jump to</div>
                <select onchange="updateJumpRule(\${pageIdx}, \${ruleIdx}, 'to', this.value)">
                  <option value="">-- select page --</option>
                  \${otherPages.map(p => \`<option value="\${p.id}" \${rule.to === p.id ? 'selected' : ''}>\${p.title} (\${p.id})</option>\`).join('')}
                </select>
                <button class="btn-icon" onclick="deleteJumpRule(\${pageIdx}, \${ruleIdx})">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            \`;
          });
        }

        pageCard.innerHTML = \`
          <div class="page-header">
            <div style="display: flex; gap: 0.25rem; align-items: center; margin-right: 0.5rem;">
              <button class="btn-icon btn-icon-move" onclick="movePageUp(\${pageIdx})" \${pageIdx === 0 ? 'disabled' : ''} title="Move Page Up">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="btn-icon btn-icon-move" onclick="movePageDown(\${pageIdx})" \${pageIdx === state.schema.pages.length - 1 ? 'disabled' : ''} title="Move Page Down">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <input type="text" class="page-title-input" value="\${escapeHtml(page.title)}" oninput="updatePageTitle(\${pageIdx}, this.value)">
            <button class="btn-action-danger" onclick="deletePage(\${pageIdx})">Delete Page</button>
          </div>
          <div class="fields-list">
            \${fieldsHtml}
          </div>
          <button class="btn-add-item" onclick="addField(\${pageIdx})">+ Add Field</button>
          
          <div class="jumps-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Page Logic Jumps (Routes)</span>
              <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="addJumpRule(\${pageIdx})">+ Add Jump Rule</button>
            </div>
            \${jumpsHtml}
          </div>
        \`;

        // Bind directly for title input without full rerender to avoid focus loss
        pageCard.querySelector('.page-title-input').addEventListener('input', (e) => {
          updatePageTitle(pageIdx, e.target.value);
        });

        container.appendChild(pageCard);
      });

      initAllBlockNoteEditors();
    }

    function initAllBlockNoteEditors() {
      if (typeof window.initializeBlockNoteEditor !== 'function') {
        // If the module script hasn't loaded/initialized yet, retry in 50ms
        setTimeout(initAllBlockNoteEditors, 50);
        return;
      }

      const containers = document.querySelectorAll('.blocknote-editor-container');
      containers.forEach(container => {
        const pageIdx = parseInt(container.getAttribute('data-page-idx'));
        const fieldIdx = parseInt(container.getAttribute('data-field-idx'));
        const field = state.schema.pages[pageIdx].fields[fieldIdx];
        
        let initialMarkdown = field.welcomeMarkdown;
        if (!initialMarkdown) {
          const title = field.label && field.label !== 'New Question' ? field.label : 'Welcome to our Form';
          const desc = field.description || "Welcome! Let's get started with this questionnaire.";
          initialMarkdown = '# ' + title + '\\n\\n' + desc;
          field.welcomeMarkdown = initialMarkdown;
        }

        window.initializeBlockNoteEditor(container, initialMarkdown, (newMarkdown) => {
          field.welcomeMarkdown = newMarkdown;
          renderJsonPreview();
        });
      });

      const descContainers = document.querySelectorAll('.description-editor-container');
      descContainers.forEach(container => {
        const pageIdx = parseInt(container.getAttribute('data-page-idx'));
        const fieldIdx = parseInt(container.getAttribute('data-field-idx'));
        const field = state.schema.pages[pageIdx].fields[fieldIdx];
        
        const initialMarkdown = field.description || '';
        window.initializeBlockNoteEditor(container, initialMarkdown, (newMarkdown) => {
          field.description = newMarkdown;
          renderJsonPreview();
        });
      });

    }

    function renderSubmissions() {
      const tbody = document.getElementById('submissionsTableBody');
      tbody.innerHTML = '';

      if (state.submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No submissions registered for this form yet.</td></tr>';
        return;
      }

      state.submissions.forEach(sub => {
        const tr = document.createElement('tr');
        const badgeClass = sub.status === 'completed' ? 'badge-completed' : 'badge-partial';
        const formattedDate = new Date(sub.updated_at).toLocaleString();
        
        tr.innerHTML = \`
          <td><strong>\${escapeHtml(sub.id)}</strong></td>
          <td><span class="badge \${badgeClass}">\${sub.status}</span></td>
          <td>
            <pre class="json-answers">\${JSON.stringify(sub.answers, null, 2)}</pre>
          </td>
          <td><span style="color: var(--text-secondary); font-size: 0.85rem;">\${formattedDate}</span></td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function exportSubmissionsToCsv() {
      if (!state.submissions || state.submissions.length === 0) {
        showToast('No submissions to export', 'error');
        return;
      }

      // 1. Get field IDs from schema in order
      const schemaFieldIds = [];
      if (state.schema && state.schema.pages) {
        state.schema.pages.forEach(page => {
          if (page.fields) {
            page.fields.forEach(field => {
              if (field.id && field.type !== 'welcome' && field.type !== 'statement') {
                schemaFieldIds.push(field.id);
              }
            });
          }
        });
      }

      // 2. Gather all unique field IDs present in the submissions answers
      const answerFieldIdsSet = new Set();
      state.submissions.forEach(sub => {
        if (sub.answers && typeof sub.answers === 'object') {
          Object.keys(sub.answers).forEach(k => {
            answerFieldIdsSet.add(k);
          });
        }
      });

      // 3. Combine in order: schema fields first, then extra fields
      const dynamicFields = [...schemaFieldIds];
      answerFieldIdsSet.forEach(fId => {
        if (!dynamicFields.includes(fId)) {
          dynamicFields.push(fId);
        }
      });

      // 4. Construct headers
      const headers = ['Session ID', 'Status', 'Last Saved', ...dynamicFields];

      // Helper to escape CSV cell
      function escapeCsvCell(val) {
        if (val === null || val === undefined) {
          return '""';
        }
        let strVal;
        if (typeof val === 'object') {
          strVal = JSON.stringify(val);
        } else {
          strVal = String(val);
        }
        const escaped = strVal.replace(/"/g, '""');
        return \`"\${escaped}"\`;
      }

      // 5. Build rows
      const csvRows = [
        headers.map(h => escapeCsvCell(h)).join(',')
      ];

      state.submissions.forEach(sub => {
        const rowValues = [
          sub.id,
          sub.status,
          new Date(sub.updated_at).toISOString()
        ];

        dynamicFields.forEach(fId => {
          const answerVal = sub.answers ? sub.answers[fId] : undefined;
          rowValues.push(answerVal);
        });

        csvRows.push(rowValues.map(v => escapeCsvCell(v)).join(','));
      });

      // 6. Generate blob and trigger download
      const csvContent = csvRows.join('\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const formTitle = state.schema.title || state.currentFormId || 'submissions';
      const cleanTitle = formTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      
      link.setAttribute('download', \`\${cleanTitle}_submissions_\${dateStr}.csv\`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Submissions exported to CSV successfully', 'success');
    }

    function renderJsonPreview() {
      const pre = document.getElementById('jsonPreviewBlock');
      pre.textContent = JSON.stringify(state.schema, null, 2);
    }

    // Tabs navigation
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      
      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.innerText.toLowerCase() === tab.toLowerCase() || (tab==='json' && btn.innerText.includes('JSON')));
      if (activeBtn) activeBtn.classList.add('active');

      const activePane = document.getElementById('tab-' + tab);
      if (activePane) activePane.classList.add('active');

      if (tab === 'preview') {
        loadPreview();
      }
    }

    async function loadPreview() {
      const iframe = document.getElementById('previewIframe');
      if (!iframe) return;

      iframe.srcdoc = \`
        <html>
        <body style="font-family: sans-serif; background: #0b0f19; color: #94a3b8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <div style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #f8fafc; font-weight: 500;">Generating Preview...</div>
            <div style="font-size: 0.9rem;">Compiling draft schema on the Edge...</div>
          </div>
        </body>
        </html>
      \`;

      try {
        const res = await fetch('/admin/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema: state.schema,
            formId: state.currentFormId
          })
        });

        if (res.ok) {
          const html = await res.text();
          iframe.srcdoc = html;
        } else {
          iframe.srcdoc = \`
            <html>
            <body style="font-family: sans-serif; background: #0b0f19; color: #ef4444; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="text-align: center;">
                <div style="font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: bold;">Preview Generation Failed</div>
                <div style="font-size: 0.9rem; color: #94a3b8;">Server returned an error compiling the preview.</div>
              </div>
            </body>
            </html>
          \`;
        }
      } catch (err) {
        iframe.srcdoc = \`
          <html>
          <body style="font-family: sans-serif; background: #0b0f19; color: #ef4444; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center;">
              <div style="font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: bold;">Network Error</div>
              <div style="font-size: 0.9rem; color: #94a3b8;">Could not connect to preview endpoint.</div>
            </div>
          </body>
          </html>
        \`;
      }
    }

    // Publish to Server
    async function publishForm() {
      if (!state.currentFormId) return;

      try {
        const res = await fetch(\`/admin/forms/\${state.currentFormId}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(state.schema)
        });

        if (res.ok) {
          showToast('Form schema successfully published to Edge KV!', 'success');
        } else {
          const err = await res.json();
          showToast('Publish failed: ' + (err.error || 'Server error'), 'error');
        }
      } catch (err) {
        showToast('Network error publishing schema', 'error');
      }
    }

    async function deleteCurrentForm() {
      if (!state.currentFormId) return;

      const confirmed = confirm("Are you sure you want to delete the form \\"" + (state.schema.title || state.currentFormId) + "\\" and all of its D1 submissions? This cannot be undone.");
      if (!confirmed) return;

      try {
        const res = await fetch(\`/admin/forms/\${state.currentFormId}\`, {
          method: 'DELETE'
        });

        if (res.ok) {
          showToast('Form successfully deleted from Edge KV and D1!', 'success');
          state.currentFormId = null;
          state.schema = { id: '', title: '', turnstileEnabled: false, pages: [] };
          state.submissions = [];
          
          document.getElementById('workspaceWrapper').style.display = 'none';
          document.getElementById('emptyWorkspaceState').style.display = 'flex';
          
          await fetchFormsList();
        } else {
          const err = await res.json();
          showToast('Delete failed: ' + (err.error || 'Server error'), 'error');
        }
      } catch (err) {
        showToast('Network error deleting form', 'error');
      }
    }

    // Toast notifications
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      toast.innerText = message;
      toast.className = 'show ' + type;

      setTimeout(() => {
        toast.className = '';
      }, 3000);
    }

    // Sign out
    function logout() {
      window.location.href = '/admin/logout';
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Start App
    init();
  </script>
  <!-- ES module script to initialize BlockNote editors using React CDN -->
  <script type="module">
    import React, { useEffect, useRef } from 'react';
    import { createRoot } from 'react-dom/client';
    import { useCreateBlockNote } from '@blocknote/react';
    import { BlockNoteView } from '@blocknote/mantine';

    function BlockNoteWrapper({ initialMarkdown, onUpdate }) {
      const lastMarkdownRef = useRef(initialMarkdown);
      const editor = useCreateBlockNote();

      // Load initial content once
      useEffect(() => {
        let active = true;
        async function loadContent() {
          if (initialMarkdown) {
            try {
              const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
              if (active) {
                editor.replaceBlocks(editor.document, blocks);
              }
            } catch (err) {
              console.error("BlockNote failed to parse initial markdown:", err);
            }
          }
        }
        loadContent();
        return () => {
          active = false;
        };
      }, [editor]);

      // Track updates
      useEffect(() => {
        const unsubscribe = editor.onChange(async () => {
          try {
            const markdown = await editor.blocksToMarkdownLossy(editor.document);
            if (markdown !== lastMarkdownRef.current) {
              lastMarkdownRef.current = markdown;
              onUpdate(markdown);
            }
          } catch (err) {
            console.error("BlockNote failed to convert blocks to markdown:", err);
          }
        });
        return unsubscribe;
      }, [editor, onUpdate]);

      return React.createElement(BlockNoteView, {
        editor: editor,
        theme: 'dark'
      });
    }

    window.initializeBlockNoteEditor = function(container, initialMarkdown, onUpdate) {
      if (container.dataset.mounted) return;
      container.dataset.mounted = 'true';

      const root = createRoot(container);
      root.render(React.createElement(BlockNoteWrapper, {
        initialMarkdown: initialMarkdown,
        onUpdate: onUpdate
      }));
    };
  </script>
</body>
</html>
`;
