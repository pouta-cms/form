import adminCss from './static/admin.css.txt';
import adminJs from './static/admin.js.txt';
import adminModuleJs from './static/admin-module.js.txt';

export { adminCss, adminJs, adminModuleJs };

export const adminHtml = `<!DOCTYPE html>
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
  <link rel="stylesheet" href="/admin.css">
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
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
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
        <div class="stats-grid" id="statsGridContainer"></div>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div style="font-size: 0.9rem; color: var(--text-secondary);">
            Paste or edit the JSON schema below and click <strong>Apply Schema</strong> to parse it into the builder.
          </div>
          <button class="btn-publish" style="margin: 0;" onclick="applyJsonSchema()">Apply Schema</button>
        </div>
        <textarea id="jsonPreviewBlock" style="width: 100%; height: calc(100vh - 250px); background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; color: #6ee7b7; font-family: monospace; font-size: 0.85rem; resize: vertical; outline: none; box-sizing: border-box; line-height: 1.5;"></textarea>
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
  <script src="/admin.js"></script>
  <script type="module" src="/admin-module.js"></script>
</body>
</html>
`;
