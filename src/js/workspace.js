/* Workspace page. Runs after the auth guard in workspace.html, which defines IS_DEMO and _auth. */
/* =====================================================================
   MindED Workspace — v2
   Fixes: mdToHtml XSS, aria-atomic, HCM persistence, prefs bridge,
          Cmd+Enter, retry on error, TTS word-highlight, history,
          focus mode, OpenDyslexic, font size, line spacing.
===================================================================== */
// Fill in PROD_API_BASE with the public API URL after deploying api/.
const PROD_API_BASE = '';
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const API_BASE = IS_LOCAL ? 'http://127.0.0.1:8000' : PROD_API_BASE;

// ── Focus trap for dialogs ──────────────────────────────────────────
// Returns a function that removes the trap and restores the previous focus.
function trapFocus(container, onEscape) {
  const opener = document.activeElement;
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), textarea, [tabindex="0"]';
  const onKey = e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(selector)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', onKey);
  return () => {
    container.removeEventListener('keydown', onKey);
    if (opener && opener.isConnected) opener.focus();
  };
}

// ── Authenticated API call ────────────────────────────────────────────
async function apiPost(path, body, timeoutMs = 90000) {
  if (!API_BASE) throw new Error('A IA ainda não está no ar neste site. Enquanto isso, teste com os exemplos prontos (Ciências, História ou Matemática).');

  const headers = { 'Content-Type': 'application/json' };
  const user = firebase.auth().currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (_) {
    throw new Error(IS_LOCAL
      ? 'Não foi possível conectar à API local. Verifique se o servidor está rodando na porta 8000.'
      : 'Não foi possível conectar. Verifique sua internet e tente novamente.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : `Erro inesperado (${response.status}).`);
  }
  return response.json();
}

// ── DOM refs ──────────────────────────────────────────────────────────
const textarea       = document.getElementById('text-input');
const charCount      = document.getElementById('char-count');
const adaptBtn       = document.getElementById('adapt-btn');
const adaptHint      = document.getElementById('adapt-hint');
const profileStatus  = document.getElementById('profile-status');
const profileEmpty   = document.getElementById('profile-empty');
const profileTags    = document.getElementById('profile-status-tags');
const outputEmpty    = document.getElementById('output-empty');
const outputContent  = document.getElementById('output-content');
const outputSkeleton = document.getElementById('output-skeleton');
const skeletonStatus = document.getElementById('skeleton-status');
const hamburger      = document.getElementById('hamburger');
const nav            = document.getElementById('main-nav');
const hcmBtn         = document.getElementById('hcm-btn');
const focusBtn       = document.getElementById('focus-btn');
const dyslexicBtn    = document.getElementById('dyslexic-btn');
const spacingBtn     = document.getElementById('spacing-btn');
const fontDecBtn     = document.getElementById('font-dec');
const fontIncBtn     = document.getElementById('font-inc');
const fontLabel      = document.getElementById('font-label');
const historyBtn     = document.getElementById('history-btn');
const historyPanel   = document.getElementById('history-panel');
const historyClose   = document.getElementById('history-close');
const historyOverlay = document.getElementById('history-overlay');
const historyList    = document.getElementById('history-list');
const a11yTriggerBtn = document.getElementById('a11y-trigger-btn');
const a11yPanel      = document.getElementById('a11y-panel');

// ── Hamburger ─────────────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

// ── Firebase user UI ──────────────────────────────────────────────────
const avatarEl  = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');

function initUserUI() {
  const user = window._mindedUser;
  if (!user) return;
  if (user.photoURL) {
    avatarEl.src = user.photoURL;
    avatarEl.alt = user.displayName || 'Usuário';
    avatarEl.style.display = 'block';
  }
  logoutBtn.style.display = 'inline-flex';
  logoutBtn.addEventListener('click', async () => {
    // Emptied first, because leaving the page saves the field again
    textarea.value = '';
    saveDraft();
    mindedLeaveAccount();
    await firebase.auth().signOut();
    window.location.replace('login.html');
  });
}
if (window._mindedUser) {
  initUserUI();
} else {
  firebase.auth().onAuthStateChanged(user => {
    if (user) { window._mindedUser = user; initUserUI(); }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ACCESSIBILITY STATE — persisted in localStorage key 'minded_a11y'
// ═══════════════════════════════════════════════════════════════════════
const A11Y_KEY = 'minded_a11y';
const SPACING_CYCLE = [
  { cls: '',                    label: 'Espaçamento: normal',       btnLabel: 'Espaçamento' },
  { cls: 'spacing-comfortable', label: 'Espaçamento: confortável',  btnLabel: 'Espaç. ×1' },
  { cls: 'spacing-relaxed',     label: 'Espaçamento: relaxado',     btnLabel: 'Espaç. ×2' },
];
const FONT_SIZES = [
  { cls: '',            label: 'A',  size: '15px' },
  { cls: 'fontsize-md', label: 'A+', size: '17px' },
  { cls: 'fontsize-lg', label: 'A++',size: '19px' },
];

let a11yState = {
  hcm:        false,
  focusMode:  false,
  dyslexic:   false,
  lightMode:  false,
  spacingIdx: 0,
  fontIdx:    0,
  theme:      '',   // 'noite' | 'clean' | 'foco' from prefs
};

function saveA11y() {
  try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11yState)); } catch (_) {}
}

function applyA11y() {
  const b = document.body;

  // HCM
  b.classList.toggle('hcm', a11yState.hcm);
  hcmBtn.classList.toggle('active', a11yState.hcm);
  hcmBtn.setAttribute('aria-pressed', String(a11yState.hcm));

  // Focus mode
  b.classList.toggle('focus-mode', a11yState.focusMode);
  focusBtn.classList.toggle('active', a11yState.focusMode);
  focusBtn.setAttribute('aria-pressed', String(a11yState.focusMode));

  // OpenDyslexic
  b.classList.toggle('font-dyslexic', a11yState.dyslexic);
  if (a11yState.dyslexic && !document.getElementById('dyslexic-font')) {
    document.head.insertAdjacentHTML('beforeend', '<link id="dyslexic-font" rel="stylesheet" href="https://fonts.cdnfonts.com/css/opendyslexic?display=swap" />');
  }
  dyslexicBtn.classList.toggle('active', a11yState.dyslexic);
  dyslexicBtn.setAttribute('aria-pressed', String(a11yState.dyslexic));

  // Line spacing
  SPACING_CYCLE.forEach(s => s.cls && b.classList.remove(s.cls));
  const sp = SPACING_CYCLE[a11yState.spacingIdx];
  if (sp.cls) b.classList.add(sp.cls);
  spacingBtn.setAttribute('aria-label', sp.label);
  spacingBtn.classList.toggle('active', a11yState.spacingIdx > 0);
  spacingBtn.querySelector('svg + span') && (spacingBtn.querySelector('svg + span').textContent = sp.btnLabel);

  // Font size
  FONT_SIZES.forEach(f => f.cls && b.classList.remove(f.cls));
  const fs = FONT_SIZES[a11yState.fontIdx];
  if (fs.cls) b.classList.add(fs.cls);
  // Root size too, so cards and buttons sized in rem grow with the text
  document.documentElement.style.fontSize = a11yState.fontIdx ? fs.size : '';
  fontLabel.textContent = fs.label;

  // Light mode toggle (manual)
  b.classList.toggle('theme-light', a11yState.lightMode);
  const lightBtn = document.getElementById('light-btn');
  if (lightBtn) {
    lightBtn.classList.toggle('active', a11yState.lightMode);
    lightBtn.setAttribute('aria-pressed', String(a11yState.lightMode));
  }

  // Theme from prefs (overrides light only if not manually set)
  b.classList.remove('theme-clean');
  if (!a11yState.lightMode && a11yState.theme === 'clean') b.classList.add('theme-clean');

  // Trigger dot — shows when any accessibility option is active
  if (a11yTriggerBtn) {
    const anyActive = a11yState.hcm || a11yState.focusMode || a11yState.dyslexic
                    || a11yState.lightMode
                    || a11yState.spacingIdx > 0 || a11yState.fontIdx > 0;
    a11yTriggerBtn.classList.toggle('has-active', anyActive);
  }
}

// ── A11y panel toggle ─────────────────────────────────────────────────
if (a11yTriggerBtn && a11yPanel) {
  a11yPanel.inert = true;
  a11yTriggerBtn.addEventListener('click', () => {
    const open = a11yPanel.classList.toggle('open');
    a11yTriggerBtn.classList.toggle('open', open);
    a11yTriggerBtn.setAttribute('aria-expanded', String(open));
    a11yPanel.inert = !open;
  });
  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!a11yTriggerBtn.contains(e.target) && !a11yPanel.contains(e.target)) {
      a11yPanel.classList.remove('open');
      a11yTriggerBtn.classList.remove('open');
      a11yTriggerBtn.setAttribute('aria-expanded', 'false');
      a11yPanel.inert = true;
    }
  });
  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && a11yPanel.classList.contains('open')) {
      a11yPanel.classList.remove('open');
      a11yTriggerBtn.classList.remove('open');
      a11yTriggerBtn.setAttribute('aria-expanded', 'false');
      a11yPanel.inert = true;
      a11yTriggerBtn.focus();
    }
  });
}

function loadA11y() {
  try {
    const saved = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}');
    Object.assign(a11yState, saved);
  } catch (_) {}
}

// ── HCM toggle ────────────────────────────────────────────────────────
hcmBtn.addEventListener('click', () => {
  a11yState.hcm = !a11yState.hcm;
  applyA11y(); saveA11y();
});

// ── Focus mode toggle ──────────────────────────────────────────────────
focusBtn.addEventListener('click', () => {
  a11yState.focusMode = !a11yState.focusMode;
  applyA11y(); saveA11y();
});

// ── Light mode toggle ─────────────────────────────────────────────────
document.getElementById('light-btn').addEventListener('click', () => {
  a11yState.lightMode = !a11yState.lightMode;
  applyA11y(); saveA11y();
});

// ── OpenDyslexic toggle ───────────────────────────────────────────────
dyslexicBtn.addEventListener('click', () => {
  a11yState.dyslexic = !a11yState.dyslexic;
  applyA11y(); saveA11y();
});

// ── Spacing cycle ─────────────────────────────────────────────────────
spacingBtn.addEventListener('click', () => {
  a11yState.spacingIdx = (a11yState.spacingIdx + 1) % SPACING_CYCLE.length;
  applyA11y(); saveA11y();
});

// ── Font size stepper ─────────────────────────────────────────────────
fontDecBtn.addEventListener('click', () => {
  if (a11yState.fontIdx > 0) { a11yState.fontIdx--; applyA11y(); saveA11y(); }
});
fontIncBtn.addEventListener('click', () => {
  if (a11yState.fontIdx < FONT_SIZES.length - 1) { a11yState.fontIdx++; applyA11y(); saveA11y(); }
});

// ═══════════════════════════════════════════════════════════════════════
// BRIDGE: localStorage preferences → UI + a11y state
// ═══════════════════════════════════════════════════════════════════════
// What each choice changes, shown instead of the category name, which may be
// a diagnosis the person would rather not have on screen.
const PROFILE_LABELS = {
  tdah: 'Direto, com exemplos', autismo: 'Linguagem literal', dislexia: 'Frases curtas',
  analitico: 'Com detalhes', criativo: 'Com conexões',
  visual: 'Listas organizadas', auditivo: 'Leitura em voz alta',
};

function renderProfilePill(perfil) {
  const pill = document.getElementById('profile-pill');
  if (!pill || !perfil) return;
  const names = perfil.split(', ').map(t => PROFILE_LABELS[t] || t).join(', ');
  pill.textContent = 'Seu perfil';
  pill.setAttribute('data-empty', 'false');
  pill.setAttribute('aria-label', `Seu perfil: ${names}. Editar preferências`);
}

function applyPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem('minded_prefs') || '{}');

    if (prefs.perfil_cognitivo) {
      const tags = prefs.perfil_cognitivo.split(', ');

      // Render profile tags in the panel
      if (profileTags) {
        profileTags.innerHTML = tags.map(t =>
          `<span class="profile-tag">${esc(PROFILE_LABELS[t] || t)}</span>`
        ).join('');
      }
      if (profileStatus) profileStatus.style.display = '';
      if (profileEmpty)  profileEmpty.style.display  = 'none';

      // Auto-enable HCM for dislexia or visual profiles
      if (tags.includes('dislexia') || tags.includes('visual')) {
        if (!a11yState.hcm) { a11yState.hcm = true; }
      }
      // Auto-enable OpenDyslexic for dislexia
      if (tags.includes('dislexia')) {
        if (!a11yState.dyslexic) { a11yState.dyslexic = true; }
      }
      // Auto-enable TTS for auditivo — set flag so TTS fires on output
      window._autoTts = tags.includes('auditivo');
      // Comfortable spacing for dislexia + autismo
      if ((tags.includes('dislexia') || tags.includes('autismo')) && a11yState.spacingIdx === 0) {
        a11yState.spacingIdx = 1;
      }
    }

    // Apply tema from prefs (step 2)
    if (prefs.tema === 'clean') a11yState.theme = 'clean';
    if (prefs.tema === 'foco')  { a11yState.theme = ''; a11yState.focusMode = true; }
    if (prefs.tema === 'noite') { a11yState.theme = ''; a11yState.lightMode = false; }

    // Aplicar font size a partir de prefs (se ainda não guardado via a11y manual)
    if (prefs.fontIdx !== undefined && a11yState.fontIdx === 0) {
      a11yState.fontIdx = Math.min(parseInt(prefs.fontIdx, 10) || 0, FONT_SIZES.length - 1);
    }

    // Aplicar espaçamento a partir de prefs (se não ajustado manualmente)
    if (prefs.spacingIdx !== undefined && a11yState.spacingIdx === 0) {
      a11yState.spacingIdx = Math.min(parseInt(prefs.spacingIdx, 10) || 0, SPACING_CYCLE.length - 1);
    }

    // Pre-select mode from prefs if stored
    if (prefs.modo) {
      const radio = document.querySelector(`input[name="mode"][value="${prefs.modo}"]`);
      if (radio) radio.checked = true;
    }

  } catch (_) {}
}

// Boot: load persisted a11y, apply prefs on top, then apply to DOM
loadA11y();
applyPreferences();
applyA11y();
saveA11y();

// ── Profile pill — shows active cognitive profile in header ───────────
try { renderProfilePill(JSON.parse(localStorage.getItem('minded_prefs') || '{}').perfil_cognitivo); } catch (_) {}

// ═══════════════════════════════════════════════════════════════════════
// PROFILE QUESTIONS MODAL
// Offered after the first result when no prefs exist, never on arrival.
// Saves 3 quick answers to minded_prefs and applies a11y state immediately.
// ═══════════════════════════════════════════════════════════════════════
const ONBOARD_KEY = 'minded_onboarded';
let openOnboarding = null;
(function initOnboarding() {
  if (IS_DEMO) return;
  // Skip if already onboarded OR if prefs already exist from /preferencias
  const alreadyDone = localStorage.getItem(ONBOARD_KEY);
  const hasPrefs    = (() => {
    try { return !!JSON.parse(localStorage.getItem('minded_prefs') || 'null'); }
    catch(_) { return false; }
  })();
  if (alreadyDone || hasPrefs) return;

  const backdrop = document.getElementById('onboard-backdrop');
  const modal    = document.getElementById('onboard-modal');
  const saveBtn  = document.getElementById('onboard-save');
  const skipBtn  = document.getElementById('onboard-skip');
  if (!backdrop || !modal) return;

  // Collected answers
  const obData = {};

  // Wire option buttons
  modal.querySelectorAll('.onboard-options').forEach(group => {
    const isMulti = group.dataset.multi === 'true';
    const key     = group.dataset.obGroup;
    group.querySelectorAll('.onboard-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isMulti) {
          group.querySelectorAll('.onboard-opt').forEach(b => b.classList.remove('selected'));
        }
        btn.classList.toggle('selected');
        // Collect selected values
        const selected = [...group.querySelectorAll('.onboard-opt.selected')].map(b => b.dataset.value);
        obData[key] = isMulti ? selected : selected[0];
      });
    });
  });

  let releaseFocus = null;
  openOnboarding = () => {
    modal.inert = false;
    backdrop.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    // Use rAF so CSS transition fires (display:none → display:flex needs a tick)
    requestAnimationFrame(() => {
      // Skipped if the modal was closed before the frame came
      requestAnimationFrame(() => { if (!modal.inert) modal.classList.add('open'); });
    });
    releaseFocus = trapFocus(modal, closeModal);
    const first = modal.querySelector('button, [tabindex="0"]');
    if (first) setTimeout(() => first.focus(), 200);
  };

  function closeModal() {
    modal.classList.remove('open');
    backdrop.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-hidden', 'true');
    localStorage.setItem(ONBOARD_KEY, '1');
    modal.inert = true;
    removeProfileNudge();
    if (releaseFocus) releaseFocus();
    if (!modal.contains(document.activeElement) && document.activeElement === document.body) {
      document.getElementById('copy-btn')?.focus();
    }
  }

  saveBtn.addEventListener('click', () => {
    // Build and persist prefs from quick answers
    const newPrefs = {};

    // perfil_cognitivo from Q1
    if (obData.perfil_cognitivo && obData.perfil_cognitivo.length) {
      newPrefs.perfil_cognitivo = obData.perfil_cognitivo.join(', ');
    }

    // modo preferido from Q2 — pre-selects workspace radio
    if (obData.modo_preferido) {
      newPrefs.modo = obData.modo_preferido;
      const radio = document.querySelector(`input[name="mode"][value="${obData.modo_preferido}"]`);
      if (radio) radio.checked = true;
    }

    // Visual adjustments from Q3 — apply a11y immediately
    if (obData.ajuste_visual && obData.ajuste_visual.length) {
      if (obData.ajuste_visual.includes('hcm'))      { a11yState.hcm = true; }
      if (obData.ajuste_visual.includes('dyslexic')) { a11yState.dyslexic = true; }
      if (obData.ajuste_visual.includes('spacing'))  { a11yState.spacingIdx = 1; }
    }

    // Merge with any existing prefs
    try {
      const existing = JSON.parse(localStorage.getItem('minded_prefs') || '{}');
      Object.assign(existing, newPrefs);
      localStorage.setItem('minded_prefs', JSON.stringify(existing));
    } catch(_) {}

    // Apply all changes immediately
    if (newPrefs.perfil_cognitivo) applyPreferences();
    applyA11y(); saveA11y();
    renderProfilePill(newPrefs.perfil_cognitivo);

    closeModal();
  });

  skipBtn.addEventListener('click', closeModal);
})();

// ═══════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════
const HISTORY_KEY = 'minded_history';
const HISTORY_MAX = 20;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch (_) { return []; }
}
function saveHistory(arr) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, HISTORY_MAX))); } catch (_) {}
}
let currentEntryId = null;

// extra: { fonte } for pages read from a link, { simplificado } for "Simplificar mais"
function addToHistory(data, mode, profile, texto, extra = {}) {
  const hist = loadHistory();
  const id = Date.now();
  hist.unshift({
    id,
    ts:      new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }),
    titulo:  data.titulo,
    mode,
    profile,
    texto,
    data,
    ...extra,
  });
  MindedProgress.bump('adaptacoes');
  saveHistory(hist);
  renderHistory();
  rememberResult(id);
  return id;
}

function rememberResult(id) {
  currentEntryId = id;
  try { sessionStorage.setItem('minded_last_result', String(id)); } catch (_) {}
}

function saveChecklistProgress() {
  const hist = loadHistory();
  const entry = hist.find(h => h.id === currentEntryId);
  if (!entry) return;
  entry.done = checklistState.flatMap((checked, i) => (checked ? [i] : []));
  entry.notes = checklistNotes.some(Boolean) ? checklistNotes : undefined;
  saveHistory(hist);
}

function restoreEntry(entry, quiet = false) {
  // Set first: the action bar reads it while the result is rendered
  lastRequest = entry.texto ? { text: entry.texto, mode: entry.mode, fonte: entry.fonte } : null;
  rememberResult(entry.id);
  // The next Adaptar should produce the same kind of result that is on screen
  const radio = document.querySelector(`input[name="mode"][value="${entry.mode}"]`);
  if (radio) radio.checked = true;
  const html = renderResult({ ...entry.data, modo: entry.mode });
  showOutput(html, entry.data, quiet);
  (entry.notes || []).forEach((text, i) => {
    if (!text) return;
    setStepNote(i, text);
    const btn = outputContent.querySelector(`.checklist-item[data-idx="${i}"] .checklist-item__do`);
    if (btn) btn.textContent = stepButtonLabel(i);
  });
  restoring = true;
  (entry.done || []).forEach(i => setStepDone(i, true));
  restoring = false;
}

function renderHistory() {
  const hist = loadHistory();
  const modeLabels = { metaphor: 'Metáfora', checklist: 'Passo a passo', summary: 'Resumo', questions: 'Perguntas', mindmap: 'Mapa de ideias' };
  if (!hist.length) {
    historyList.innerHTML = IS_DEMO
      ? '<p class="history-empty">A demonstração não guarda histórico.<br/><a href="login.html?next=workspace.html">Entre</a> para guardar suas adaptações.</p>'
      : '<p class="history-empty">Nenhuma adaptação ainda.<br/>Adapte um texto para criar o histórico.</p>';
    return;
  }
  historyList.innerHTML = hist.map(h => `
    <div class="history-item" data-id="${esc(h.id)}">
      <button type="button" class="history-item__open" aria-label="Abrir: ${esc(h.titulo)}, ${esc(historySource(h))}">
        <span class="history-item__title">${esc(h.titulo)}</span>
        <span class="history-item__source">${esc(historySource(h))}</span>
        <span class="history-item__meta">
          <span class="history-item__badge">${esc(modeLabels[h.mode] || h.mode)}</span>
          ${h.simplificado ? '<span class="history-item__badge">Mais simples</span>' : ''}
          <span>${esc(h.ts)}</span>
        </span>
      </button>
      <button type="button" class="history-item__delete" aria-label="Apagar do histórico: ${esc(h.titulo)}">
        <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 3h2v1h-2zM11 3h2v1h-2zM4 4h2v1h-2zM10 4h2v1h-2zM5 5h2v1h-2zM9 5h2v1h-2zM6 6h4v1h-4zM7 7h2v2h-2zM6 9h4v1h-4zM5 10h2v1h-2zM9 10h2v1h-2zM4 11h2v1h-2zM10 11h2v1h-2zM3 12h2v1h-2zM11 12h2v1h-2z"/></svg>
      </button>
    </div>`).join('');

  historyList.querySelectorAll('.history-item').forEach(el => {
    const id = parseInt(el.dataset.id, 10);
    el.querySelector('.history-item__open').addEventListener('click', () => {
      const entry = loadHistory().find(h => h.id === id);
      if (!entry) return;
      restoreEntry(entry);
      closeHistory();
    });
    el.querySelector('.history-item__delete').addEventListener('click', () => {
      // Focus moves to the neighbour, so keyboard users keep their place
      const items = [...historyList.querySelectorAll('.history-item')];
      const pos = items.indexOf(el);
      saveHistory(loadHistory().filter(h => h.id !== id));
      if (currentEntryId === id) rememberResult(null);
      renderHistory();
      const rest = historyList.querySelectorAll('.history-item__delete');
      (rest[Math.min(pos, rest.length - 1)] || historyClose).focus();
    });
  });
}

// A line that tells apart results with the same title
function historySource(h) {
  const src = h.fonte || h.texto || '';
  if (/^(https?:\/\/|www\.)/i.test(src)) {
    try { return new URL(asUrl(src)).hostname.replace(/^www\./, ''); } catch (_) {}
  }
  const flat = src.replace(/\s+/g, ' ').trim();
  return flat.length > 60 ? flat.slice(0, 60) + '…' : flat;
}

let releaseHistoryFocus = null;
function openHistory()  {
  historyPanel.inert = false;
  historyPanel.classList.add('open');
  historyOverlay.classList.add('open');
  historyOverlay.setAttribute('aria-hidden', 'false');
  historyBtn.setAttribute('aria-expanded', 'true');
  historyBtn.classList.add('active');
  renderHistory();
  releaseHistoryFocus = trapFocus(historyPanel, closeHistory);
  historyClose.focus();
}
function closeHistory() {
  historyPanel.classList.remove('open');
  historyOverlay.classList.remove('open');
  historyOverlay.setAttribute('aria-hidden', 'true');
  historyBtn.setAttribute('aria-expanded', 'false');
  historyBtn.classList.remove('active');
  historyPanel.inert = true;
  if (releaseHistoryFocus) releaseHistoryFocus();
  releaseHistoryFocus = null;
}

historyBtn.addEventListener('click',   () => historyPanel.classList.contains('open') ? closeHistory() : openHistory());
historyClose.addEventListener('click', closeHistory);
historyOverlay.addEventListener('click', closeHistory);

// ── Source detection ──────────────────────────────────────────────────
const MAX_TEXT_CHARS = 60000;
const GUEST_MAX_CHARS = 4000;   // same limit as the API applies to visitors

// Visitors testing with their own content use the real AI, with a smaller limit
let demoOwn = false;
const canUseAI = () => !IS_DEMO || demoOwn;
const maxChars = () => (IS_DEMO && demoOwn ? GUEST_MAX_CHARS : MAX_TEXT_CHARS);
const WEB_URL = /^(https?:\/\/|www\.)\S+$/i;
const YOUTUBE_URL = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com\/(watch\?|shorts\/|live\/|embed\/)|youtu\.be\/)\S+$/i;
const sourceStatus = document.getElementById('source-status');

function asUrl(value) {
  return /^https?:/i.test(value) ? value : `https://${value}`;
}
function describeSource(value) {
  if (YOUTUBE_URL.test(value)) return 'Vídeos do YouTube ainda não funcionam: o MindED lê texto. Cole aqui a transcrição ou as legendas do vídeo.';
  if (WEB_URL.test(value)) return 'Link de página. Vamos ler o texto dela quando você clicar em Adaptar.';
  return '';
}

// ── Char counter & button enabler ─────────────────────────────────────
function updateCharCount() {
  const len = textarea.value.length;
  charCount.textContent = len > 0 ? `${len.toLocaleString('pt')} car.` : '';
  const tooLong = len > maxChars();
  adaptBtn.disabled = len < 10 || tooLong;
  adaptHint.hidden = len >= 10 && !tooLong;
  adaptHint.textContent = tooLong
    ? `Este texto tem ${len.toLocaleString('pt-BR')} caracteres. O limite é ${maxChars().toLocaleString('pt-BR')}: use um trecho menor.`
    : 'Escreva pelo menos 10 caracteres para adaptar.';
  // In the demo examples, the line says which kind of source the example stands for
  sourceStatus.textContent = IS_DEMO && !demoOwn ? DEMO_TYPES[demoType].status : describeSource(textarea.value.trim());
  scheduleDraftSave();
}
let undoText = '';
document.getElementById('undo-example-btn').addEventListener('click', () => {
  textarea.value = undoText;
  undoText = '';
  exampleShown = null;
  document.getElementById('undo-example').hidden = true;
  updateCharCount();
  textarea.focus();
});

textarea.addEventListener('input', () => {
  // Editing the field makes it the person's own text: no example, no stale error
  exampleShown = null;
  document.getElementById('undo-example').hidden = true;
  clearError();
  // Edits to the page text keep its origin; clearing it or pasting a new source drops it
  const value = textarea.value.trim();
  if (!value || WEB_URL.test(value)) hideSourceOrigin();
  updateCharCount();
});

// ── Origin of text read from a link, with a way back to the link ───────
const sourceOrigin = document.getElementById('source-origin');
let originUrl = '';
function showSourceOrigin(url) {
  originUrl = url;
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (_) {}
  document.getElementById('source-origin-text').textContent = `Texto lido de ${host}.`;
  sourceOrigin.hidden = false;
}
function hideSourceOrigin() {
  originUrl = '';
  sourceOrigin.hidden = true;
}
document.getElementById('source-origin-back').addEventListener('click', () => {
  textarea.value = originUrl;
  hideSourceOrigin();
  updateCharCount();
  textarea.focus();
});

// ── Draft — survives reloads, cleared on logout ───────────────────────
const DRAFT_KEY = 'minded_draft';
let _draftTimer = null;
function saveDraft() {
  if (IS_DEMO) return;
  clearTimeout(_draftTimer);
  try { localStorage.setItem(DRAFT_KEY, textarea.value); } catch (_) {}
}
function scheduleDraftSave() {
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(saveDraft, 400);
}
window.addEventListener('pagehide', saveDraft);

// ── PDF: load pdf.js ──────────────────────────────────────────────────
// Served from this site (src/vendor/pdfjs), a version without CVE-2024-4367
let pdfjsLib = null;
async function loadPdfJs() {
  if (pdfjsLib) return;
  // This is a classic script, so paths resolve from the page, not from this file
  pdfjsLib = await import(new URL('src/vendor/pdfjs/pdf.min.mjs', document.baseURI).href);
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('src/vendor/pdfjs/pdf.worker.min.mjs', document.baseURI).href;
}

const PDF_MAX_BYTES = 50 * 1024 * 1024;

// Rebuilds readable text from pdf.js pieces: words split into several pieces are
// joined back, line ends become breaks, and words hyphenated across lines are rejoined.
// LaTeX-made PDFs often store "ã" as "˜a": a spacing accent before the letter.
// These become combining marks after the letter, then NFC joins them into one character.
const SPACING_ACCENTS = {
  '´': '́', 'ˊ': '́', 'ˋ': '̀', '`': '̀',
  '˜': '̃', 'ˆ': '̂', '¨': '̈', '¸': '̧',
  'ˇ': '̌', '˚': '̊',
};
// Each accent only joins a letter that can carry it, so "it´s" or "d´água" stay as they are
const ACCENT_LETTERS = {
  '́': 'aeiouAEIOUı', '̀': 'aeiouAEIOU', '̂': 'aeiouAEIOUı',
  '̈': 'aeiouAEIOUı', '̃': 'aonAON', '̧': 'cC', '̌': 'csznrCSZNR', '̊': 'auAU',
};
function fixAccents(text) {
  return text
    .replace(/([´ˊˋ`˜ˆ¨¸ˇ˚])([A-Za-zı])/g, (m, accent, letter) => {
      const mark = SPACING_ACCENTS[accent];
      if (!ACCENT_LETTERS[mark].includes(letter)) return m;
      return (letter === 'ı' ? 'i' : letter) + mark;
    })
    .normalize('NFC');
}

function pdfPageText(items) {
  let text = '';
  items.forEach(item => {
    if (typeof item.str !== 'string') return;
    text += item.str;
    if (item.hasEOL) text += '\n';
  });
  return fixAccents(text)
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2')
    .replace(/ *\n */g, '\n')
    // A line that continues a sentence joins the next one into a paragraph
    .replace(/([^\n.!?:;])\n(?=\p{Ll})/gu, '$1 ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdf(file, onPage) {
  if (file.size > PDF_MAX_BYTES) throw new Error('Este PDF passa de 50 MB. Envie um arquivo menor ou só as páginas que você vai estudar.');
  await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const vendor = new URL('src/vendor/pdfjs/', document.baseURI).href;
  let pdf;
  try {
    // No eval and no scripts from the file: a PDF here is only read for its text.
    // The character maps and standard fonts decode PDFs whose fonts are not embedded.
    pdf = await pdfjsLib.getDocument({
      data,
      isEvalSupported: false,
      enableScripting: false,
      cMapUrl: vendor + 'cmaps/',
      cMapPacked: true,
      standardFontDataUrl: vendor + 'standard_fonts/',
    }).promise;
  } catch (err) {
    if (err?.name === 'PasswordException') throw new Error('Este PDF tem senha. Abra no seu leitor, salve uma cópia sem senha e tente de novo.');
    if (err?.name === 'InvalidPDFException') throw new Error('Este arquivo não parece ser um PDF válido, ou está corrompido.');
    throw new Error('Não foi possível abrir este PDF. Tente salvar uma nova cópia dele e enviar de novo.');
  }
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onPage?.(i, pdf.numPages);
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(pdfPageText(content.items));
    page.cleanup();
  }
  pdf.destroy();
  const all = pages.join('');
  if (all.replace(/\s/g, '').length < 10) {
    throw new Error('Este PDF não tem texto para ler: parece ser uma imagem ou uma digitalização. Cole o texto no campo, se tiver.');
  }
  // Fonts without a character map come out as symbols; better to say so than to adapt nonsense
  const letters = (all.match(/[\p{L}\p{N}]/gu) || []).length;
  if (letters / all.replace(/\s/g, '').length < 0.5) {
    throw new Error('O texto deste PDF saiu ilegível, porque ele usa fontes que não dá para decodificar. Tente copiar e colar o texto no campo.');
  }
  return pages;
}

function usePdfText(text) {
  textarea.value = text;
  hideSourceOrigin();
  updateCharCount();
  textarea.focus();
}

// PDF: file input
const pdfUpload  = document.getElementById('pdf-upload');

async function handlePdfFile(file) {
  const isPdf = file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
  if (!isPdf) {
    sourceStatus.textContent = 'Arquivo inválido. Use um PDF.';
    return;
  }
  sourceStatus.textContent = 'Abrindo o PDF…';
  try {
    const pages = await extractPdf(file, (i, total) => {
      sourceStatus.textContent = `Lendo a página ${i} de ${total}…`;
    });
    const text = pages.join('\n\n').trim();
    if (text.length <= maxChars()) {
      usePdfText(text);
      sourceStatus.textContent = `PDF lido: ${pages.length} ${pages.length === 1 ? 'página' : 'páginas'}. Confira o texto antes de adaptar.`;
    } else {
      offerPageRange(pages);
    }
  } catch (err) {
    sourceStatus.textContent = err.message || 'Não foi possível ler este PDF.';
  } finally {
    pdfUpload.value = '';
  }
}

// Long PDFs: the reader picks a stretch instead of hitting the limit
const pdfRange = document.getElementById('pdf-range');
const pdfFrom  = document.getElementById('pdf-from');
const pdfTo    = document.getElementById('pdf-to');
let pdfPages = [];

function offerPageRange(pages) {
  pdfPages = pages;
  pdfFrom.max = pdfTo.max = pages.length;
  pdfFrom.value = 1;
  pdfTo.value = Math.min(10, pages.length);
  document.getElementById('pdf-range-text').textContent =
    `Este PDF tem ${pages.length} páginas e passa do limite. Escolha um trecho:`;
  sourceStatus.textContent = '';
  pdfRange.hidden = false;
  pdfFrom.focus();
}

pdfRange.addEventListener('submit', e => {
  e.preventDefault();
  const from = Math.min(Number(pdfFrom.value), Number(pdfTo.value));
  const to   = Math.max(Number(pdfFrom.value), Number(pdfTo.value));
  pdfRange.hidden = true;
  usePdfText(pdfPages.slice(from - 1, to).join('\n\n').trim());
  pdfPages = [];
});

pdfUpload.addEventListener('change', e => handlePdfFile(e.target.files[0]));
document.getElementById('pdf-pick-btn').addEventListener('click', () => pdfUpload.click());

// PDF: drag and drop on the field
const textPane = document.getElementById('pane-text');
textPane.addEventListener('dragover', e => {
  if ([...e.dataTransfer.types].includes('Files')) {
    e.preventDefault();
    textPane.classList.add('drag-over');
  }
});
textPane.addEventListener('dragleave', () => textPane.classList.remove('drag-over'));
textPane.addEventListener('drop', e => {
  if (!e.dataTransfer.files.length) return;
  e.preventDefault();
  textPane.classList.remove('drag-over');
  handlePdfFile(e.dataTransfer.files[0]);
});

// ── Keyboard shortcut: Cmd/Ctrl + Enter ───────────────────────────────
textarea.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!adaptBtn.disabled) adaptBtn.click();
  }
});
// The hint shows only the key this system uses
if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
  document.getElementById('shortcut-hint').innerHTML = '<kbd>⌘</kbd><kbd>↵</kbd> para adaptar';
}

// ── Mode helper ───────────────────────────────────────────────────────
function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}
document.querySelectorAll('input[name="mode"]').forEach(radio => radio.addEventListener('change', () => {
  if (!IS_DEMO) { try { localStorage.setItem('minded_mode', radio.value); } catch (_) {} }
}));

// ── Escape HTML helper ────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Markdown → HTML (bold + bullets, for summary) ─────────────────────
// FIX: escape HTML first, then apply bold markup so <strong> survives.
function mdToHtml(text) {
  // 1. Escape all HTML entities in the raw text
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  // 2. Now safe to inject controlled HTML: bullet lines become one list, other lines paragraphs
  const html = [];
  let items = [];
  const flush = () => {
    if (items.length) html.push(`<ul class="summary-list">${items.join('')}</ul>`);
    items = [];
  };
  escaped.split('\n').forEach(raw => {
    const line = raw.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (!line) return;
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) { items.push(`<li>${bullet[1]}</li>`); return; }
    flush();
    html.push(`<p>${line}</p>`);
  });
  flush();
  return html.join('');
}

// ── Skeleton phases ───────────────────────────────────────────────────
const SKELETON_PHASES = [
  'Analisando o texto…',
  'Identificando conceitos-chave…',
  'Construindo analogias…',
  'Verificando consistência…',
  'Finalizando…',
];
let _skeletonTimer = null;
function startSkeleton() {
  outputEmpty.classList.add('hidden');
  outputEmpty.setAttribute('aria-hidden', 'true');
  outputContent.classList.add('hidden');
  outputContent.setAttribute('aria-hidden', 'true');
  outputSkeleton.classList.remove('hidden');
  outputSkeleton.setAttribute('aria-hidden', 'false');
  document.getElementById('sr-status').textContent = 'Adaptando o texto…';
  let i = 0;
  skeletonStatus.textContent = SKELETON_PHASES[0];
  _skeletonTimer = setInterval(() => {
    i = Math.min(i + 1, SKELETON_PHASES.length - 1);
    skeletonStatus.textContent = SKELETON_PHASES[i];
  }, 1800);
}
function stopSkeleton() {
  clearInterval(_skeletonTimer);
  outputSkeleton.classList.add('hidden');
  outputSkeleton.setAttribute('aria-hidden', 'true');
}

// ── Concept-category icon map ─────────────────────────────────────────
const CONCEPT_ICONS = {
  banco: '🗄️', dados: '🗄️', database: '🗄️', armazenamento: '📦',
  regra: '⚖️', logica: '⚙️', validacao: '✅',
  api: '🔌', rede: '🌐', comunicacao: '📡', protocolo: '📡',
  servico: '⚙️', servicos: '⚙️', processamento: '⚙️', microsservico: '⚙️',
  autenticacao: '🔒', seguranca: '🔐', token: '🔑',
  escalabilidade: '📈', performance: '⚡',
};
function iconForTerm(term) {
  const lower = term.toLowerCase().replace(/[^a-záéíóúâêîôûãõç]/g, '');
  for (const [key, icon] of Object.entries(CONCEPT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '•';
}

// ── Bidirectional highlight ───────────────────────────────────────────
function highlightProseTerms(proseEl, mappings) {
  if (!mappings || !mappings.length) return;
  // Works on text nodes only, so a term like "class" can never hit markup.
  mappings.forEach((m, idx) => {
    if (!m.termo_tecnico) return;
    const safe = m.termo_tecnico.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'gi');
    const walker = document.createTreeWalker(proseEl, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('.prose-highlight')) nodes.push(walker.currentNode);
    }
    nodes.forEach(node => {
      const text = node.textContent;
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const match of text.matchAll(re)) {
        frag.append(text.slice(last, match.index));
        const span = document.createElement('span');
        span.className = 'prose-highlight';
        span.dataset.term = idx;
        span.textContent = match[0];
        frag.append(span);
        last = match.index + match[0].length;
      }
      if (last === 0) return;
      frag.append(text.slice(last));
      node.replaceWith(frag);
    });
  });
}

// ── Build rich perfil string from all saved prefs ─────────────────────
// Passes the full context from onboarding to the API prompt
function buildPerfilString() {
  try {
    const prefs = JSON.parse(localStorage.getItem('minded_prefs') || '{}');
    const parts = [];
    if (prefs.perfil_cognitivo) parts.push(prefs.perfil_cognitivo);
    if (prefs.ritmo)    parts.push(`ritmo:${prefs.ritmo}`);
    if (prefs.sessao)   parts.push(`sessao:${prefs.sessao}`);
    return parts.length ? parts.join('; ') : 'geral';
  } catch (_) {
    return 'geral';
  }
}

// ── Render: Metaphor mode ─────────────────────────────────────────────
function renderMetaphor(data) {
  const maps = (data.mapeamentos || []).map((m, idx) => `
    <tr data-term="${idx}">
      <td><span class="term-icon" aria-hidden="true">${iconForTerm(m.termo_tecnico)}</span> ${esc(m.termo_tecnico)}</td>
      <td>${esc(m.equivalente_metafora)}</td>
      <td>${esc(m.explicacao_conexao)}</td>
    </tr>`).join('');

  const mappingSection = maps ? `
    <details class="result-more mapping-grid-section">
      <summary>Ver termo por termo</summary>
      <table class="mapping-table" role="table">
        <thead>
          <tr>
            <th scope="col">Termo Técnico</th>
            <th scope="col">Na Metáfora</th>
            <th scope="col">Por quê faz sentido</th>
          </tr>
        </thead>
        <tbody>${maps}</tbody>
      </table>
    </details>` : '';

  const alertSection = data.pontos_de_atencao ? `
    <hr class="output-divider"/>
    <div class="output-alert" role="note" aria-label="Limitação da metáfora">
      <span class="output-alert__icon" aria-hidden="true">⚠️</span>
      <p class="output-alert__text"><strong style="color:var(--clr-amber)">O que a metáfora NÃO cobre:</strong><br/>${esc(data.pontos_de_atencao)}</p>
    </div>` : '';

  const flashcardSection = buildFlashcards(data.mapeamentos);

  return `
    <div class="output-header">
      <h3 class="output-title">${esc(data.titulo)}</h3>
      ${data.universo_analogia ? `<span class="output-universe">${esc(data.universo_analogia)}</span>` : ''}
    </div>
    <p class="output-prose" id="output-prose-text">${esc(data.conteudo_principal)}</p>
    ${mappingSection}
    ${alertSection}
    ${flashcardSection}
    <hr class="output-divider"/>
    ${actionBar(data)}
  `;
}

// ── Checklist state, shared by the list, the focus session and history ──
function setStepDone(idx, done) {
  if (checklistState[idx] === done) return;
  checklistState[idx] = done;
  if (done && !IS_DEMO && !restoring) MindedProgress.bump('passos');
  const item = outputContent.querySelector(`.checklist-item[data-idx="${idx}"]`);
  if (item) {
    item.classList.toggle('done', done);
    item.querySelector('.checklist-item__check')?.setAttribute('aria-checked', String(done));
  }
  const total = checklistState.length;
  const count = checklistState.filter(Boolean).length;
  const fill  = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  const wrap  = document.getElementById('progress-bar-wrap');
  if (fill)  fill.style.width = (total ? Math.round(count / total * 100) : 0) + '%';
  if (label) label.textContent = `${count} / ${total}`;
  if (wrap)  wrap.setAttribute('aria-valuenow', String(count));
  saveChecklistProgress();
  updateFocusStartLabel();
}

let _notesTimer = null;
function setStepNote(idx, text) {
  checklistNotes[idx] = text;
  const inline = outputContent.querySelector(`.checklist-item__note[data-idx="${idx}"]`);
  if (inline && inline.value !== text) inline.value = text;
  clearTimeout(_notesTimer);
  _notesTimer = setTimeout(saveChecklistProgress, 400);
}

function stepButtonLabel(idx) {
  return checklistNotes[idx] ? 'Ver sua resposta' : 'Fazer agora';
}

// ── Study goal ────────────────────────────────────────────────────────
function addStudyMinutes(n) {
  if (!IS_DEMO) MindedProgress.addMinutes(n);
}

// "Oi, Ana! Hoje: 12 de 20 minutos." above the composer, when there is a goal for today
function renderTodayGoal() {
  const box = document.getElementById('today-goal');
  if (IS_DEMO || !box) return;
  const profile = MindedProfile.load();
  const name = profile.apelido || window._mindedUser?.displayName?.split(' ')[0] || '';
  const isGoalDay = profile.dias.includes(new Date().getDay());
  const minutes = MindedProgress.minutesOn(new Date());
  const streak = MindedProgress.streak();
  const parts = [];
  if (name) parts.push(`Oi, ${name}!`);
  if (isGoalDay && profile.metaMinutos) {
    parts.push(minutes >= profile.metaMinutos
      ? `Meta de hoje cumprida: ${minutes} minutos.`
      : `Hoje: ${minutes} de ${profile.metaMinutos} minutos.`);
  }
  if (streak > 1) parts.push(`${streak} dias seguidos estudando.`);
  box.textContent = parts.join(' ');
  box.hidden = !parts.length;
}
window.addEventListener('minded-progress', renderTodayGoal);

// ── Doing a step: each task type, the AI check and the step timer ─────
function setFeedback(work, text, kind) {
  const box = work.querySelector('.step-feedback');
  box.textContent = text;
  box.dataset.kind = kind || '';
}

function wireTask(item, idx, task, data) {
  const work = item.querySelector('.checklist-item__work');

  if (task.tipo === 'multipla_escolha') {
    work.querySelectorAll('.step-choice').forEach(btn => btn.addEventListener('click', () => {
      const k = Number(btn.dataset.k);
      const right = k === task.correta;
      work.querySelectorAll('.step-choice').forEach(b => b.removeAttribute('data-result'));
      btn.dataset.result = right ? 'certo' : 'errado';
      setFeedback(work, right ? 'Isso mesmo!' : 'Ainda não. Releia o trecho e tente outra opção.', right ? 'certo' : 'revisar');
      setStepNote(idx, `Escolhi: ${task.opcoes[k]}${right ? ' (certo)' : ''}`);
      if (right) setStepDone(idx, true);
    }));
  }

  if (task.tipo === 'ordenar') {
    const list = work.querySelector('.step-order');
    list.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const li = btn.closest('li');
      if (btn.classList.contains('step-order__up') && li.previousElementSibling) li.previousElementSibling.before(li);
      if (btn.classList.contains('step-order__down') && li.nextElementSibling) li.nextElementSibling.after(li);
      btn.focus();
      setFeedback(work, '');
    });
    work.querySelector('.step-order__check').addEventListener('click', () => {
      const items = [...list.children];
      items.forEach((li, pos) => { li.dataset.result = Number(li.dataset.k) === pos ? 'certo' : 'errado'; });
      const right = items.filter(li => li.dataset.result === 'certo').length;
      const all = right === items.length;
      setFeedback(work, all ? 'Ordem certa!' : `${right} de ${items.length} no lugar certo. Os marcados em vermelho precisam mudar.`, all ? 'certo' : 'quase');
      setStepNote(idx, 'Minha ordem: ' + items.map(li => li.querySelector('.step-order__text').textContent).join(' → '));
      if (all) setStepDone(idx, true);
    });
  }

  if (task.tipo === 'marcar_no_texto') {
    work.querySelectorAll('.step-mark__sentence').forEach(btn => btn.addEventListener('click', () => {
      const right = btn.textContent.trim() === task.frase_certa.trim();
      work.querySelectorAll('.step-mark__sentence').forEach(b => b.removeAttribute('data-result'));
      btn.dataset.result = right ? 'certo' : 'errado';
      setFeedback(work, right ? 'Achou a frase certa!' : 'Não é essa. Procure a frase que responde ao passo.', right ? 'certo' : 'revisar');
      setStepNote(idx, `Marquei: ${btn.textContent.trim()}${right ? ' (certo)' : ''}`);
      if (right) setStepDone(idx, true);
    }));
  }

  const checkBtn = work.querySelector('.step-check');
  checkBtn?.addEventListener('click', async () => {
    const resposta = (checklistNotes[idx] || '').trim();
    if (!resposta) { setFeedback(work, 'Escreva sua resposta primeiro.', 'revisar'); return; }
    if (!canUseAI()) {
      setFeedback(work, 'Nos exemplos prontos a IA não confere respostas. Escolha "Meu próprio conteúdo" ou crie uma conta.', '');
      return;
    }
    checkBtn.disabled = true;
    setFeedback(work, 'Conferindo…');
    try {
      if (IS_DEMO) await startGuestSession();
      const source = outputContent.querySelector('.source-text__body')?.textContent || '';
      const r = await apiPost('/check', {
        tarefa: task.texto,
        resposta: resposta.slice(0, 3000),
        trecho: (task.trecho || '').slice(0, 2000),
        contexto: source.slice(0, 6000),
        perfil: buildPerfilString(),
      });
      const label = { certo: 'Certo.', quase: 'Quase lá.', revisar: 'Vale revisar.' }[r.avaliacao] || '';
      setFeedback(work, [label, r.comentario, r.dica && `Dica: ${r.dica}`].filter(Boolean).join(' '), r.avaliacao);
    } catch (err) {
      setFeedback(work, err.message, 'revisar');
    } finally {
      checkBtn.disabled = false;
    }
  });

  // Optional stopwatch for this step; the time also counts toward the study goal
  const timer = work.querySelector('.step-timer');
  const timeEl = timer.querySelector('.step-timer__time');
  const toggle = timer.querySelector('.step-timer__toggle');
  const reset = timer.querySelector('.step-timer__reset');
  let seconds = 0, interval = null;
  const show = () => { timeEl.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
  toggle.addEventListener('click', () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
      toggle.textContent = 'Continuar';
    } else {
      interval = setInterval(() => {
        if (!item.isConnected) { clearInterval(interval); return; }
        seconds += 1;
        show();
        if (seconds % 60 === 0) addStudyMinutes(1);
      }, 1000);
      toggle.textContent = 'Pausar';
      reset.hidden = false;
    }
  });
  reset.addEventListener('click', () => {
    clearInterval(interval);
    interval = null;
    seconds = 0;
    show();
    toggle.textContent = 'Cronometrar';
    reset.hidden = true;
  });
}

// ── Render: Checklist mode ────────────────────────────────────────────
let checklistState = [];
let restoring = false;     // reopening a saved result does not count as new progress
let checklistNotes = [];   // what the person wrote while doing each step

function stepsOf(data) {
  return data.tarefas?.length ? data.tarefas.map(t => t.texto) : (data.passos_acao || []);
}

// Old results only have plain steps: those become writing tasks
function tasksOf(data) {
  return data.tarefas?.length ? data.tarefas : (data.passos_acao || []).map(texto => ({ texto, tipo: 'escrever' }));
}

// Same order on every render, and never the right order
function shuffledOrder(n, seed) {
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = (seed * 31 + i * 17) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((v, i) => v === i) && n > 1) order.push(order.shift());
  return order;
}

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]+["”»)]*\s*|[^.!?]+$/g) || [text]).map(s => s.trim()).filter(Boolean);
}

function taskWorkHtml(task, i) {
  const trecho = task.trecho && task.tipo !== 'marcar_no_texto'
    ? `<blockquote class="step-trecho"><span class="step-trecho__label">Do texto:</span> ${esc(task.trecho)}</blockquote>` : '';
  const timer = `
    <div class="step-timer" data-idx="${i}">
      <span class="step-timer__time" aria-live="off">0:00</span>
      <button type="button" class="btn btn-ghost btn-sm step-timer__toggle">Cronometrar</button>
      <button type="button" class="btn btn-ghost btn-sm step-timer__reset" hidden>Zerar</button>
    </div>`;
  let body = '';
  if (task.tipo === 'multipla_escolha') {
    body = `
      <div class="step-choices" role="group" aria-label="Escolha uma opção">
        ${task.opcoes.map((op, k) => `<button type="button" class="step-choice" data-k="${k}">${esc(op)}</button>`).join('')}
      </div>`;
  } else if (task.tipo === 'ordenar') {
    const order = shuffledOrder(task.itens.length, i + 1);
    body = `
      <ol class="step-order" aria-label="Itens para ordenar">
        ${order.map(k => `
          <li class="step-order__item" data-k="${k}">
            <span class="step-order__text">${esc(task.itens[k])}</span>
            <span class="step-order__moves">
              <button type="button" class="step-order__up" aria-label="Subir: ${esc(task.itens[k])}">↑</button>
              <button type="button" class="step-order__down" aria-label="Descer: ${esc(task.itens[k])}">↓</button>
            </span>
          </li>`).join('')}
      </ol>
      <button type="button" class="btn btn-ghost btn-sm step-order__check">Conferir a ordem</button>`;
  } else if (task.tipo === 'marcar_no_texto') {
    body = `
      <p class="step-mark__hint">Clique na frase certa:</p>
      <div class="step-mark" role="group" aria-label="Frases do texto">
        ${splitSentences(task.trecho).map(f => `<button type="button" class="step-mark__sentence">${esc(f)}</button>`).join('')}
      </div>`;
  } else {
    body = `
      <label class="checklist-item__label" for="step-note-${i}">Sua resposta</label>
      <textarea class="checklist-item__note" id="step-note-${i}" data-idx="${i}" rows="3"
                placeholder="${IS_DEMO ? 'Escreva aqui. Na demonstração, nada é guardado.' : 'Escreva aqui. Fica guardado junto com este resultado.'}"></textarea>
      <button type="button" class="btn btn-ghost btn-sm step-check">Conferir com a IA</button>`;
  }
  return `${trecho}${body}
    <p class="step-feedback" role="status"></p>
    ${timer}
    <button type="button" class="btn btn-primary btn-sm checklist-item__finish">Concluir passo</button>`;
}

function renderChecklist(data) {
  const steps = stepsOf(data);
  const tasks = tasksOf(data);
  checklistState = steps.map(() => false);
  checklistNotes = steps.map(() => '');

  const CHUNK = 5;
  const visible = steps.slice(0, CHUNK);
  const hidden  = steps.slice(CHUNK);

  const makeItem = (step, i) => `
    <div class="checklist-item" data-idx="${i}">
      <button type="button" class="checklist-item__check" role="checkbox" aria-checked="false"
              aria-labelledby="step-text-${i}">
        <span class="checklist-item__checkbox" aria-hidden="true">
          <svg class="checklist-item__check-svg" viewBox="0 0 12 10">
            <polyline points="1.5 5.5 4.5 8.5 10.5 1.5"/>
          </svg>
        </span>
      </button>
      <div class="checklist-item__body">
        <span class="checklist-item__text" id="step-text-${i}">${esc(step)}</span>
        <button type="button" class="checklist-item__do" aria-expanded="false" aria-controls="step-work-${i}">Fazer agora</button>
        <div class="checklist-item__work" id="step-work-${i}" data-tipo="${esc(tasks[i].tipo)}" hidden>
          ${taskWorkHtml(tasks[i], i)}
        </div>
      </div>
    </div>`;

  const visibleHtml = visible.map((s, i) => makeItem(s, i)).join('');
  const hiddenHtml  = hidden.map((s, i) => makeItem(s, i + CHUNK)).join('');

  const showMoreBtn = hidden.length ? `
    <button class="chunk-more-btn" id="chunk-more-btn" aria-expanded="false" aria-controls="chunk-hidden">
      ＋ Ver mais ${hidden.length} ${hidden.length === 1 ? 'tarefa' : 'tarefas'}
    </button>
    <div id="chunk-hidden" class="checklist-list hidden" role="group" aria-label="Tarefas adicionais">${hiddenHtml}</div>
  ` : '';

  return `
    <div class="output-header">
      <h3 class="output-title">${esc(data.titulo)}</h3>
    </div>
    ${data.conteudo_principal ? `<p class="output-prose">${esc(data.conteudo_principal)}</p>` : ''}
    <div class="checklist-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="0" id="progress-bar-wrap">
      <div class="checklist-progress__bar">
        <div class="checklist-progress__fill" id="progress-fill" style="width:0%"></div>
      </div>
      <span class="checklist-progress__label" id="progress-label">0 / ${steps.length}</span>
    </div>
    <div class="checklist-list" id="checklist-list" role="group" aria-label="Lista de tarefas">${visibleHtml}</div>
    ${showMoreBtn}
    <button class="btn btn-primary focus-start" id="focus-start" type="button">Começar sessão de foco</button>
    <hr class="output-divider"/>
    ${actionBar(data)}
  `;
}

// ── Render: Summary mode ──────────────────────────────────────────────
function renderSummary(data) {
  return `
    <div class="output-header">
      <h3 class="output-title">${esc(data.titulo)}</h3>
    </div>
    <div class="summary-body">${mdToHtml(data.conteudo_principal)}</div>
    <hr class="output-divider"/>
    ${actionBar(data)}
  `;
}

// ── Render: Mind map mode ─────────────────────────────────────────────
// Nested lists, so screen readers get the same structure the eye sees
function renderMindMap(data) {
  const branches = (data.ramos || []).map(r => `
    <li class="mindmap__branch">
      <span class="mindmap__idea">${esc(r.ideia)}</span>
      <ul class="mindmap__details">${(r.detalhes || []).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
    </li>`).join('');
  return `
    <div class="output-header">
      <h3 class="output-title">${esc(data.titulo)}</h3>
    </div>
    <div class="mindmap">
      <p class="mindmap__center output-prose">${esc(data.conteudo_principal)}</p>
      <ul class="mindmap__branches" aria-label="Ideias ligadas ao tema">${branches}</ul>
    </div>
    <hr class="output-divider"/>
    ${actionBar(data)}
  `;
}

function renderResult(data) {
  if (data.modo === 'metaphor')  return renderMetaphor(data);
  if (data.modo === 'checklist') return renderChecklist(data);
  if (data.modo === 'questions') return renderQuestions(data);
  if (data.modo === 'mindmap')   return renderMindMap(data);
  return renderSummary(data);
}

// ── Render: Questions mode ────────────────────────────────────────────
function renderQuestions(data) {
  const qs = (data.perguntas || []);
  const cards = qs.map((q, i) => `
    <div class="question-card" data-qi="${i}">
      <div class="question-card__q" id="q-text-${i}">${esc(q.pergunta)}</div>
      <!-- Trying an answer first helps it stick; it stays on this screen only -->
      <label class="question-guess">
        <span class="question-guess__label">Seu palpite (opcional)</span>
        <textarea rows="2" aria-describedby="q-text-${i}"
                  placeholder="Escreva com suas palavras antes de ver a resposta"></textarea>
      </label>
      <div class="question-card__actions">
        <button class="question-hint-btn" data-qi="${i}" aria-expanded="false">
          <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 2h6v1h-6zM4 3h1v1h-1zM11 3h1v1h-1zM3 4h1v1h-1zM12 4h1v1h-1zM3 5h1v1h-1zM12 5h1v1h-1zM3 6h1v1h-1zM12 6h1v1h-1zM3 7h1v1h-1zM6 7h1v1h-1zM9 7h1v1h-1zM12 7h1v1h-1zM4 8h1v1h-1zM7 8h2v1h-2zM11 8h1v1h-1zM5 9h1v1h-1zM10 9h1v1h-1zM5 10h1v1h-1zM10 10h1v1h-1zM5 11h6v1h-6zM5 12h6v1h-6zM6 13h4v1h-4z"/></svg>
          Dica
        </button>
        <button class="question-reveal-btn" data-qi="${i}" aria-expanded="false">
          <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 4h8v1h-8zM2 5h2v1h-2zM12 5h2v1h-2zM1 6h1v1h-1zM7 6h2v1h-2zM14 6h1v1h-1zM0 7h1v1h-1zM6 7h4v1h-4zM15 7h1v1h-1zM0 8h1v1h-1zM6 8h4v1h-4zM15 8h1v1h-1zM1 9h1v1h-1zM7 9h2v1h-2zM14 9h1v1h-1zM2 10h2v1h-2zM12 10h2v1h-2zM4 11h8v1h-8z"/></svg>
          Ver resposta
        </button>
      </div>
      <div class="question-hint" data-qi="${i}">${esc(q.dica)}</div>
      <div class="question-answer" data-qi="${i}"><strong>Resposta:</strong> ${esc(q.resposta)}</div>
      <div class="question-rate" data-qi="${i}" role="group" aria-label="Como foi esta pergunta?" hidden>
        <span>Como foi?</span>
        <button class="btn btn-ghost btn-sm" type="button" data-grade="0">Errei</button>
        <button class="btn btn-ghost btn-sm" type="button" data-grade="1">Quase</button>
        <button class="btn btn-ghost btn-sm" type="button" data-grade="2">Acertei</button>
      </div>
    </div>`).join('');

  return `
    <div class="output-header">
      <h3 class="output-title">${esc(data.titulo)}</h3>
    </div>
    ${data.conteudo_principal ? `<p class="output-prose">${esc(data.conteudo_principal)}</p>` : ''}
    <div class="questions-list">${cards}</div>
    <hr class="output-divider"/>
    ${actionBar(data)}
  `;
}

// ── Render: Flashcards (dos mapeamentos, modo Metáfora) ───────────────
function buildFlashcards(mappings) {
  if (!mappings || !mappings.length) return '';
  const total = mappings.length;
  return `
    <details class="result-more flashcard-section" id="flashcard-section">
      <summary>Praticar com ${total} ${total === 1 ? 'flashcard' : 'flashcards'}</summary>
      <div class="flashcard-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="1">
        <div class="flashcard-progress__fill" id="fc-progress" style="width:${Math.round(1/total*100)}%"></div>
      </div>
      <div class="flashcard" id="flashcard" tabindex="0" aria-label="Clique para revelar a metáfora" role="button">
        <div class="flashcard__inner">
          <div class="flashcard__front">
            <div class="flashcard__term" id="fc-term">${esc(mappings[0].termo_tecnico)}</div>
            <div class="flashcard__hint" id="fc-hint">Qual é a metáfora?</div>
            <span class="flashcard__tap">Clique para revelar</span>
          </div>
          <div class="flashcard__back">
            <div class="flashcard__term" id="fc-answer" style="font-size:0.95rem">${esc(mappings[0].equivalente_metafora)}</div>
            <div class="flashcard__answer" id="fc-explain">${esc(mappings[0].explicacao_conexao)}</div>
            <span class="flashcard__tap">Clique para virar</span>
          </div>
        </div>
      </div>
      <div class="flashcard-nav">
        <button class="btn btn-ghost btn-sm" id="fc-prev" aria-label="Anterior" disabled>←</button>
        <span class="flashcard-counter" id="fc-counter" aria-live="polite">1 / ${total}</span>
        <button class="btn btn-ghost btn-sm" id="fc-next" aria-label="Próximo" ${total < 2 ? 'disabled' : ''}>→</button>
      </div>
    </details>`;
}

// ── Clean text for copy and export ────────────────────────────────────
function toMarkdown(data) {
  const cell = value => String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ');
  const blocks = [`# ${data.titulo}`];
  if (data.universo_analogia) blocks.push(`*Universo da metáfora: ${data.universo_analogia}*`);
  if (data.conteudo_principal) blocks.push(data.conteudo_principal);
  if (data.mapeamentos?.length) {
    blocks.push('## Termo e metáfora');
    blocks.push([
      '| Termo | Na metáfora | Por que faz sentido |',
      '|---|---|---|',
      ...data.mapeamentos.map(m => `| ${cell(m.termo_tecnico)} | ${cell(m.equivalente_metafora)} | ${cell(m.explicacao_conexao)} |`),
    ].join('\n'));
  }
  if (data.pontos_de_atencao) blocks.push(`## O que a metáfora não cobre\n\n${data.pontos_de_atencao}`);
  if (stepsOf(data).length) {
    const own = data === currentResult;
    blocks.push(stepsOf(data).map((step, i) => {
      const line = `- [${own && checklistState[i] ? 'x' : ' '}] ${step}`;
      const note = own && checklistNotes[i] ? `\n  - Minha resposta: ${checklistNotes[i].replace(/\s+/g, ' ')}` : '';
      return line + note;
    }).join('\n'));
  }
  (data.perguntas || []).forEach(q => {
    blocks.push(`## ${q.pergunta}\n\n**Dica:** ${q.dica}\n\n**Resposta:** ${q.resposta}`);
  });
  (data.ramos || []).forEach(r => {
    blocks.push(`## ${r.ideia}\n\n${(r.detalhes || []).map(d => `- ${d}`).join('\n')}`);
  });
  return blocks.join('\n\n') + '\n';
}

function markdownFilename(data) {
  const slug = String(data.titulo).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return `minded-${slug || 'resultado'}.md`;
}

// ── Action bar ────────────────────────────────────────────────────────
function actionBar(data) {
  const ttsSupported = 'speechSynthesis' in window;
  const ttsBtn = ttsSupported ? `
    <span class="tts-group" role="group" aria-label="Leitura em voz alta">
    <button class="btn btn-ghost btn-sm" id="tts-btn" aria-label="Ouvir conteúdo via síntese de voz">
      <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 3h2v1h-2zM5 4h3v1h-3zM11 4h1v1h-1zM4 5h4v1h-4zM12 5h1v1h-1zM1 6h7v1h-7zM10 6h1v1h-1zM13 6h1v1h-1zM1 7h7v1h-7zM10 7h1v1h-1zM13 7h1v1h-1zM1 8h7v1h-7zM10 8h1v1h-1zM13 8h1v1h-1zM1 9h7v1h-7zM10 9h1v1h-1zM13 9h1v1h-1zM4 10h4v1h-4zM12 10h1v1h-1zM5 11h3v1h-3zM11 11h1v1h-1zM6 12h2v1h-2z"/></svg>
      <span class="tts-label">Ouvir</span>
    </button>
    <button class="btn btn-ghost btn-sm" id="tts-rate-btn" type="button" aria-label="Ritmo da leitura: ${TTS_RATES[ttsRateIdx].label}. Trocar">${ttsRateLabel()}</button>
    </span>` : '';
  return `
    <div class="output-actions">
      <button class="btn btn-ghost btn-sm" id="copy-btn" aria-label="Copiar texto adaptado">
        <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 3h8v1h-8zM4 4h1v1h-1zM11 4h1v1h-1zM2 5h8v1h-8zM11 5h1v1h-1zM2 6h1v1h-1zM9 6h1v1h-1zM11 6h1v1h-1zM2 7h1v1h-1zM9 7h1v1h-1zM11 7h1v1h-1zM2 8h1v1h-1zM9 8h1v1h-1zM11 8h1v1h-1zM2 9h1v1h-1zM9 9h1v1h-1zM11 9h1v1h-1zM2 10h1v1h-1zM9 10h3v1h-3zM2 11h1v1h-1zM9 11h1v1h-1zM2 12h8v1h-8z"/></svg>
        Copiar
      </button>
      <button class="btn btn-ghost btn-sm" id="md-btn" aria-label="Exportar em Markdown">
        <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 2h2v1h-2zM7 3h2v1h-2zM7 4h2v1h-2zM4 5h8v1h-8zM5 6h6v1h-6zM6 7h4v1h-4zM7 8h2v1h-2zM1 10h1v1h-1zM14 10h1v1h-1zM1 11h1v1h-1zM14 11h1v1h-1zM1 12h14v1h-14z"/></svg>
        Exportar MD
      </button>
      <button class="pdf-btn" id="pdf-btn" aria-label="Exportar como PDF">
        <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3 2h8v1h-8zM3 3h1v1h-1zM10 3h2v1h-2zM3 4h1v1h-1zM11 4h2v1h-2zM3 5h1v1h-1zM12 5h1v1h-1zM3 6h1v1h-1zM6 6h4v1h-4zM12 6h1v1h-1zM3 7h1v1h-1zM12 7h1v1h-1zM3 8h1v1h-1zM6 8h4v1h-4zM12 8h1v1h-1zM3 9h1v1h-1zM12 9h1v1h-1zM3 10h1v1h-1zM6 10h4v1h-4zM12 10h1v1h-1zM3 11h1v1h-1zM12 11h1v1h-1zM3 12h10v1h-10z"/></svg>
        PDF
      </button>
      <button class="simplify-btn" id="simplify-btn" aria-label="Simplificar ainda mais"${lastRequest ? '' : ' hidden'}>
        <svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M7 4h2v1h-2zM7 5h2v1h-2zM6 6h4v1h-4zM2 7h12v1h-12zM4 8h8v1h-8zM5 9h6v1h-6zM4 10h3v1h-3zM9 10h3v1h-3zM4 11h1v1h-1zM11 11h1v1h-1z"/></svg>
        Simplificar mais
      </button>
      ${ttsBtn}
    </div>
  `;
}

// ── TTS with word-by-word highlight ───────────────────────────────────
// Wraps words in place, so bold text and term highlights survive, and
// records where each one starts in the spoken text for the boundary event.
const TTS_BLOCKS = '.output-title, .output-prose, .summary-body, .output-alert__text, .checklist-item__text, .question-card__q, .mindmap__idea, .mindmap__details li';

function wrapWordsForTts(block) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!/[\p{L}\p{N}]/u.test(part)) { frag.append(part); return; }
      const span = document.createElement('span');
      span.className = 'tts-word';
      span.textContent = part;
      frag.append(span);
    });
    node.replaceWith(frag);
  });
}

function prepareSpeech(container) {
  const spans = [], starts = [];
  let text = '';
  container.querySelectorAll(TTS_BLOCKS).forEach(block => {
    wrapWordsForTts(block);
    block.querySelectorAll('.tts-word').forEach(span => {
      spans.push(span);
      starts.push(text.length);
      text += span.textContent + ' ';
    });
    text = text.trimEnd();
    if (text && !/[.!?:]$/.test(text)) text += '.';
    text += ' ';
  });
  return { text: text.trim(), spans, starts };
}

// Reading speed belongs to the device, like the other accessibility settings
const TTS_RATES = [
  { rate: 0.75, label: 'Devagar' },
  { rate: 0.92, label: 'Normal' },
  { rate: 1.15, label: 'Rápido' },
];
let ttsRateIdx = 1;
try {
  const saved = localStorage.getItem('minded_tts_rate');
  if (saved !== null && TTS_RATES[Number(saved)]) ttsRateIdx = Number(saved);
} catch (_) {}
function ttsRateLabel() {
  return `Ritmo: ${TTS_RATES[ttsRateIdx].label}`;
}

function wireTts(container) {
  const ttsBtn = container.querySelector('#tts-btn');
  if (!ttsBtn || !window.speechSynthesis) return;
  const rateBtn = container.querySelector('#tts-rate-btn');
  const ttsLabel = ttsBtn.querySelector('.tts-label');
  let speaking = false;
  let speech = null;
  let activeWord = null;
  let wordIdx = 0;
  let run = 0; // events from an utterance that was replaced are ignored

  function setActiveWord(span) {
    if (activeWord) activeWord.classList.remove('tts-active');
    activeWord = span;
    if (activeWord) activeWord.classList.add('tts-active');
  }

  function setTtsStopped() {
    speaking = false;
    if (ttsLabel) ttsLabel.textContent = 'Ouvir';
    ttsBtn.setAttribute('aria-label', 'Ouvir conteúdo via síntese de voz');
    setActiveWord(null);
  }

  // Speaks from a given word, so a speed change continues where it was
  function speakFrom(index) {
    const id = ++run;
    const offset = speech.starts[index] || 0;
    const utterance = new SpeechSynthesisUtterance(speech.text.slice(offset));
    utterance.lang = 'pt-BR';
    utterance.rate = TTS_RATES[ttsRateIdx].rate;
    utterance.onboundary = e => {
      if (id !== run || e.name !== 'word') return;
      const i = speech.starts.findLastIndex(start => start <= e.charIndex + offset);
      if (i >= 0) { wordIdx = i; setActiveWord(speech.spans[i]); }
    };
    utterance.onend = utterance.onerror = () => { if (id === run) setTtsStopped(); };
    window.speechSynthesis.speak(utterance);
    speaking = true;
    if (ttsLabel) ttsLabel.textContent = '⏹ Parar';
    ttsBtn.setAttribute('aria-label', 'Parar síntese de voz');
  }

  ttsBtn.addEventListener('click', () => {
    if (speaking) {
      run++;
      window.speechSynthesis.cancel();
      setTtsStopped();
      return;
    }
    if (!speech) speech = prepareSpeech(container);
    wordIdx = 0;
    speakFrom(0);
  });

  rateBtn?.addEventListener('click', () => {
    ttsRateIdx = (ttsRateIdx + 1) % TTS_RATES.length;
    rateBtn.textContent = ttsRateLabel();
    rateBtn.setAttribute('aria-label', `Ritmo da leitura: ${TTS_RATES[ttsRateIdx].label}. Trocar`);
    try { localStorage.setItem('minded_tts_rate', String(ttsRateIdx)); } catch (_) {}
    // Keeps reading from the current word at the new speed
    if (speaking) {
      run++;
      window.speechSynthesis.cancel();
      setTimeout(() => speakFrom(wordIdx), 80);
    }
  });

  // Auto-fire TTS if user's pref is auditivo
  if (window._autoTts) {
    setTimeout(() => ttsBtn.click(), 600);
    window._autoTts = false; // only once per output
  }
}

// ── Show output ───────────────────────────────────────────────────────
function showOutput(html, responseData, quiet = false) {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  stopSkeleton();
  currentResult = responseData;
  hideExplainButton();
  outputContent.innerHTML = html;
  outputContent.classList.remove('hidden');
  outputContent.setAttribute('aria-hidden', 'false');
  outputContent.classList.add('fade-up');

  // Mark body so focus mode knows there's output
  document.body.classList.add('has-output');

  // Announce once, then put keyboard and screen reader users at the result.
  // On mobile (single-column layout), also scroll the result into view.
  if (!quiet) {
    document.getElementById('sr-status').textContent = 'Resultado pronto.';
    const resultTitle = outputContent.querySelector('.output-title');
    if (resultTitle) {
      resultTitle.tabIndex = -1;
      resultTitle.focus({ preventScroll: true });
    }
    // Brings the result into view on mobile, and on desktop when the page was
    // scrolled so far that the fixed header would cover it
    const panel = document.querySelector('.output-panel');
    if (panel && (window.innerWidth <= 900 || panel.getBoundingClientRect().top < 72)) {
      requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  // Bidirectional highlight for metaphor
  const proseEl = outputContent.querySelector('#output-prose-text');
  if (proseEl && responseData && responseData.mapeamentos) {
    highlightProseTerms(proseEl, responseData.mapeamentos);
    outputContent.querySelectorAll('.mapping-table tbody tr').forEach(row => {
      const termIdx = row.dataset.term;
      row.addEventListener('mouseenter', () => {
        row.classList.add('row-active');
        outputContent.querySelectorAll(`.prose-highlight[data-term="${termIdx}"]`)
          .forEach(s => s.classList.add('lit'));
      });
      row.addEventListener('mouseleave', () => {
        row.classList.remove('row-active');
        outputContent.querySelectorAll(`.prose-highlight[data-term="${termIdx}"]`)
          .forEach(s => s.classList.remove('lit'));
      });
    });
  }

  // Checklist interactions
  function wireChecklist(container) {
    container.querySelectorAll('.checklist-item').forEach(item => {
      const idx   = parseInt(item.dataset.idx, 10);
      const doBtn = item.querySelector('.checklist-item__do');
      const work  = item.querySelector('.checklist-item__work');
      const note  = item.querySelector('.checklist-item__note');
      const task  = tasksOf(responseData)[idx];
      item.querySelector('.checklist-item__check').addEventListener('click', () => setStepDone(idx, !checklistState[idx]));
      doBtn.addEventListener('click', () => {
        const open = work.hidden;
        work.hidden = !open;
        doBtn.setAttribute('aria-expanded', String(open));
        doBtn.textContent = open ? 'Fechar' : stepButtonLabel(idx);
        if (open) (note || work.querySelector('button'))?.focus();
      });
      note?.addEventListener('input', () => setStepNote(idx, note.value));
      wireTask(item, idx, task, responseData);
      item.querySelector('.checklist-item__finish').addEventListener('click', () => {
        setStepDone(idx, true);
        work.hidden = true;
        doBtn.setAttribute('aria-expanded', 'false');
        doBtn.textContent = stepButtonLabel(idx);
        // Moves on to the next step still to do
        const next = checklistState.findIndex((done, i) => !done && i > idx);
        const nextBtn = next >= 0 && outputContent.querySelector(`.checklist-item[data-idx="${next}"] .checklist-item__do`);
        if (nextBtn && nextBtn.offsetParent) nextBtn.click();
        else doBtn.focus();
      });
    });
  }
  wireChecklist(outputContent);

  // The source stays one click away while doing the steps
  if (outputContent.querySelector('#checklist-list')) {
    const source = lastRequest?.text || (IS_DEMO ? textarea.value : '');
    if (source && !WEB_URL.test(source.trim())) {
      const details = document.createElement('details');
      details.className = 'result-more source-text';
      details.innerHTML = '<summary>Ver o texto original</summary><div class="source-text__body"></div>';
      details.querySelector('.source-text__body').textContent = source;
      outputContent.querySelector('#progress-bar-wrap')?.before(details);
    }
  }

  // Show more
  const chunkBtn = document.getElementById('chunk-more-btn');
  if (chunkBtn) {
    chunkBtn.addEventListener('click', () => {
      const hiddenGroup = document.getElementById('chunk-hidden');
      const isNowHidden = hiddenGroup.classList.toggle('hidden');
      chunkBtn.setAttribute('aria-expanded', String(!isNowHidden));
      const remaining = checklistState.length - 5;
      chunkBtn.textContent = isNowHidden
        ? `＋ Ver mais ${remaining} ${remaining === 1 ? 'tarefa' : 'tarefas'}`
        : '− Mostrar menos';
      // "Mostrar menos" belongs after the extra tasks, "Ver mais" before them
      if (isNowHidden) hiddenGroup.before(chunkBtn);
      else hiddenGroup.after(chunkBtn);
      chunkBtn.focus();
    });
  }

  // Copy
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(toMarkdown(responseData)).then(() => {
        copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          copyBtn.innerHTML = '<svg class="pixel" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 3h8v1h-8zM4 4h1v1h-1zM11 4h1v1h-1zM2 5h8v1h-8zM11 5h1v1h-1zM2 6h1v1h-1zM9 6h1v1h-1zM11 6h1v1h-1zM2 7h1v1h-1zM9 7h1v1h-1zM11 7h1v1h-1zM2 8h1v1h-1zM9 8h1v1h-1zM11 8h1v1h-1zM2 9h1v1h-1zM9 9h1v1h-1zM11 9h1v1h-1zM2 10h1v1h-1zM9 10h3v1h-3zM2 11h1v1h-1zM9 11h1v1h-1zM2 12h8v1h-8z"/></svg> Copiar';
        }, 2000);
      });
    });
  }

  // Markdown export
  const mdBtn = document.getElementById('md-btn');
  if (mdBtn) {
    mdBtn.addEventListener('click', () => {
      const blob = new Blob([toMarkdown(responseData)], { type: 'text/markdown;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = markdownFilename(responseData); a.click();
      URL.revokeObjectURL(url);
    });
  }

  // PDF export
  const pdfBtn = document.getElementById('pdf-btn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => window.print());
  }

  // Simplificar mais — re-adapts the original text, leaving the textarea alone
  const simplifyBtn = document.getElementById('simplify-btn');
  if (simplifyBtn) {
    simplifyBtn.addEventListener('click', () => doAdapt({ simplificar: true }));
  }

  // Flashcard interactivity
  const fcEl = document.getElementById('flashcard');
  if (fcEl) {
    const mappings = responseData && responseData.mapeamentos ? responseData.mapeamentos : [];
    let fcIdx = 0;

    function updateFlashcard() {
      const m = mappings[fcIdx];
      if (!m) return;
      const term    = document.getElementById('fc-term');
      const answer  = document.getElementById('fc-answer');
      const explain = document.getElementById('fc-explain');
      const counter = document.getElementById('fc-counter');
      const progress= document.getElementById('fc-progress');
      if (term)    term.textContent    = m.termo_tecnico;
      if (answer)  answer.textContent  = m.equivalente_metafora;
      if (explain) explain.textContent = m.explicacao_conexao;
      if (counter) counter.textContent = `${fcIdx + 1} / ${mappings.length}`;
      if (progress) progress.style.width = `${Math.round((fcIdx + 1) / mappings.length * 100)}%`;
      fcEl.classList.remove('flipped');
      fcEl.setAttribute('aria-label', 'Clique para revelar a metáfora');
      const wrap = fcEl.closest('[role="progressbar"]');
      if (wrap) wrap.setAttribute('aria-valuenow', String(fcIdx + 1));
      // Arrows that lead nowhere are switched off
      const prev = document.getElementById('fc-prev');
      const next = document.getElementById('fc-next');
      if (prev) prev.disabled = fcIdx === 0;
      if (next) next.disabled = fcIdx === mappings.length - 1;
    }

    fcEl.addEventListener('click', () => {
      fcEl.classList.toggle('flipped');
      fcEl.setAttribute('aria-label', fcEl.classList.contains('flipped') ? 'Clique para virar' : 'Clique para revelar a metáfora');
    });
    fcEl.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fcEl.click(); }
    });

    const prevBtn = document.getElementById('fc-prev');
    const nextBtn = document.getElementById('fc-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (fcIdx > 0) { fcIdx--; updateFlashcard(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (fcIdx < mappings.length - 1) { fcIdx++; updateFlashcard(); } });
  }

  // Questions interactivity
  outputContent.querySelectorAll('.question-hint-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = btn.dataset.qi;
      const hint = outputContent.querySelector(`.question-hint[data-qi="${qi}"]`);
      if (!hint) return;
      const isOpen = hint.classList.toggle('visible');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
  outputContent.querySelectorAll('.question-reveal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = btn.dataset.qi;
      const ans = outputContent.querySelector(`.question-answer[data-qi="${qi}"]`);
      if (!ans) return;
      const isOpen = ans.classList.toggle('visible');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen ? 'Esconder' : 'Ver resposta';
      const rate = outputContent.querySelector(`.question-rate[data-qi="${qi}"]`);
      if (rate && isOpen) rate.hidden = false;
    });
  });
  // Rating an answer schedules the question for spaced review
  outputContent.querySelectorAll('.question-rate').forEach(row => {
    row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const q = (responseData.perguntas || [])[row.dataset.qi];
      if (!q) return;
      row.removeAttribute('role');
      row.removeAttribute('aria-label');
      // The demo shows how it works but keeps nothing
      row.textContent = IS_DEMO
        ? 'Com uma conta, esta pergunta voltaria para revisão no dia certo.'
        : reviewMessage(rateCard(q, responseData.titulo, Number(b.dataset.grade)));
      row.tabIndex = -1;
      row.focus();
      updateReviewDue();
    }));
  });

  // Button for touch and keyboard, where selecting text is hard
  const mainBlock = outputContent.querySelector('.output-prose, .summary-body');
  if (canUseAI() && mainBlock && ['metaphor', 'summary'].includes(responseData?.modo)) {
    const explainBlockBtn = document.createElement('button');
    explainBlockBtn.type = 'button';
    explainBlockBtn.className = 'btn btn-ghost btn-sm explain-block-btn';
    explainBlockBtn.textContent = 'Não entendi esta parte';
    explainBlockBtn.addEventListener('click', () => {
      explainPassage(mainBlock.innerText.trim().slice(0, 1000), mainBlock, true);
    });
    mainBlock.after(explainBlockBtn);
  }

  document.getElementById('focus-start')?.addEventListener('click', () => {
    startFocusSession(stepsOf(responseData));
  });

  // TTS with word highlight
  wireTts(outputContent);
}

// Scrolls the result panel into view when it is above or below the visible area
function revealOutput() {
  const panel = document.querySelector('.output-panel');
  if (!panel) return;
  const top = panel.getBoundingClientRect().top;
  if (top < 72 || top > window.innerHeight - 160) {
    panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
}

// An error belongs to the last attempt: changing the text puts the empty state back
function clearError() {
  if (!outputContent.querySelector('.output-error')) return;
  outputContent.innerHTML = '';
  outputContent.classList.add('hidden');
  outputContent.setAttribute('aria-hidden', 'true');
  outputEmpty.classList.remove('hidden');
  outputEmpty.setAttribute('aria-hidden', 'false');
}

// ── Error state with retry ────────────────────────────────────────────
function showError(msg) {
  stopSkeleton();
  outputContent.innerHTML = `
    <div class="output-error" role="alert">
      <div class="output-error__body">
        <span aria-hidden="true">❌</span>
        <span><strong>Algo deu errado:</strong> ${esc(msg)}</span>
      </div>
      <button class="retry-btn" id="retry-btn">↺ Tentar novamente</button>
    </div>`;
  outputContent.classList.remove('hidden');
  outputContent.setAttribute('aria-hidden', 'false');
  revealOutput();

  document.getElementById('retry-btn').addEventListener('click', () => {
    outputContent.classList.add('hidden');
    doAdapt(lastOptions);
  });
}

// ── Adapt button click ────────────────────────────────────────────────
let lastRequest = null;   // what produced the current result, for Simplificar mais
let currentResult = null; // the result on screen, used by explanations
let lastOptions = {};

function removeProfileNudge() {
  document.getElementById('profile-nudge')?.remove();
}

// Invites the profile questions below the result, without covering it.
function showProfileNudge() {
  if (!openOnboarding || localStorage.getItem(ONBOARD_KEY)) return;
  const nudge = document.createElement('div');
  nudge.className = 'profile-nudge';
  nudge.id = 'profile-nudge';
  nudge.innerHTML = `
    <p>Quer que os próximos resultados fiquem mais do seu jeito? São só 3 perguntas.</p>
    <div class="profile-nudge__actions">
      <button class="btn btn-primary btn-sm" id="nudge-open" type="button">Responder</button>
      <button class="btn btn-ghost btn-sm" id="nudge-dismiss" type="button">Agora não</button>
    </div>`;
  outputContent.append(nudge);
  nudge.querySelector('#nudge-open').addEventListener('click', openOnboarding);
  nudge.querySelector('#nudge-dismiss').addEventListener('click', () => {
    try { localStorage.setItem(ONBOARD_KEY, '1'); } catch (_) {}
    removeProfileNudge();
    document.getElementById('copy-btn')?.focus();
  });
}

async function doAdapt(options = {}) {
  const simplificar = !!options.simplificar && !!lastRequest;
  lastOptions = options;
  let text      = simplificar ? lastRequest.text : textarea.value.trim();
  const mode    = simplificar ? lastRequest.mode : getMode();
  let fonte     = simplificar ? lastRequest.fonte : originUrl;
  const profile = buildPerfilString();   // rich profile from all prefs

  if (text.length < 10) return;

  const isVideo = canUseAI() && YOUTUBE_URL.test(text);
  const isPage  = canUseAI() && !isVideo && WEB_URL.test(text);
  if (isVideo) {
    showError('Vídeos do YouTube ainda não funcionam. Cole no campo a transcrição ou as legendas do vídeo.');
    return;
  }
  let notice = '';

  document.body.classList.remove('has-output');
  startSkeleton();
  revealOutput();
  adaptBtn.classList.add('loading');
  adaptBtn.disabled = true;

  if (window.speechSynthesis) window.speechSynthesis.cancel();
  const modeLabels = { metaphor: 'Construindo analogias…', checklist: 'Dividindo em passos…', summary: 'Sintetizando…', questions: 'Criando perguntas…', mindmap: 'Ligando as ideias…' };
  setTimeout(() => { if (skeletonStatus) skeletonStatus.textContent = modeLabels[mode] || SKELETON_PHASES[2]; }, 900);

  try {
    if (isPage) {
      skeletonStatus.textContent = 'Lendo a página…';
      fonte = asUrl(text);
      const page = await apiPost('/extract-url', { url: fonte });
      text = page.texto;
      textarea.value = text;
      showSourceOrigin(fonte);
      if (page.truncado) notice = `Esta página é longa: usamos os primeiros ${MAX_TEXT_CHARS.toLocaleString('pt-BR')} caracteres.`;
    }

    const body = { texto: text, modo: mode, perfil: profile, simplificar };
    if (isVideo) body.video_url = asUrl(text);

    // Ready-made results: the demo examples, and an untouched example for signed-in people
    const readyTopic = IS_DEMO && !demoOwn ? demoTopic
      : (!simplificar && exampleShown && textarea.value === EXAMPLES[exampleShown] ? exampleShown : null);
    if (IS_DEMO && demoOwn) await startGuestSession();
    const data = readyTopic
      ? await new Promise(r => setTimeout(() => r({ ...DEMO_RESULTS[readyTopic][mode], modo: mode }), 500))
      : await apiPost('/adapt', body);
    lastRequest = readyTopic ? null : { text, mode, fonte };
    const html = renderResult(data);

    currentEntryId = null;
    showOutput(html, data);
    if (!IS_DEMO) {
      const extra = {};
      if (fonte) extra.fonte = fonte;
      if (simplificar) extra.simplificado = true;
      addToHistory(data, mode, profile, text, extra);
      showProfileNudge();
    }

  } catch (err) {
    showError(err.message);
  } finally {
    adaptBtn.classList.remove('loading');
    updateCharCount();
    if (notice) sourceStatus.textContent = notice;
  }
}

adaptBtn.addEventListener('click', () => doAdapt());

// ═══════════════════════════════════════════════════════════════════════
// TEXTOS DE EXEMPLO
// ═══════════════════════════════════════════════════════════════════════
let demoTopic = 'ciencias';   // subject shown in the demo
let exampleShown = null;      // signed in: example currently in the field, untouched
let demoType = 'texto';       // kind of source that example stands for

// Each source type has a ready-made example; the video one stands in for a real video
const DEMO_TYPES = {
  texto: { topic: 'ciencias',     status: 'Exemplo de texto colado: biologia, sobre a mitose.' },
  link:  { topic: 'historia',     status: 'Exemplo de link: este é o texto que o MindED leu de uma página sobre a Revolução Industrial.' },
  pdf:   { topic: 'matematica',   status: 'Exemplo de PDF: o texto de uma apostila de 1 página sobre função quadrática.' },
  video: { topic: 'fotossintese', status: 'Exemplo de vídeo: a transcrição de uma aula de 6 minutos. Para usar um vídeo seu, cole a transcrição dele.' },
};

// Anonymous sign-in, so the API can count a visitor's tests without an account
async function startGuestSession() {
  if (firebase.auth().currentUser) return;
  try {
    await firebase.auth().signInAnonymously();
  } catch (err) {
    throw new Error(err?.code === 'auth/operation-not-allowed'
      ? 'O teste com o seu conteúdo ainda não foi ativado. Use os exemplos prontos por enquanto.'
      : 'Não foi possível começar o teste agora. Tente de novo.');
  }
}

function showDemoExample(type) {
  const { topic } = DEMO_TYPES[type];
  demoTopic = topic;
  demoType = type;
  textarea.value = EXAMPLES[topic];
  textarea.scrollTop = 0;
  document.querySelectorAll('.demo-type-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.demoType === type)));
  hideSourceOrigin();
  updateCharCount();
}

function setDemoOwn(own) {
  demoOwn = own;
  document.getElementById('demo-tab-examples').setAttribute('aria-selected', String(!own));
  document.getElementById('demo-tab-own').setAttribute('aria-selected', String(own));
  document.getElementById('demo-examples').hidden = own;
  document.getElementById('demo-own-note').hidden = !own;
  document.getElementById('readonly-note').hidden = own;
  document.getElementById('source-bar').hidden = !own;
  charCount.hidden = !own;
  textarea.readOnly = !own;
  textarea.setAttribute('aria-describedby', own ? 'demo-own-note source-status' : 'readonly-note source-status');
  if (own) {
    textarea.value = '';
    updateCharCount();
    textarea.focus();
  } else {
    const current = document.querySelector('.demo-type-btn[aria-pressed="true"]')?.dataset.demoType || 'texto';
    showDemoExample(current);
  }
}

const EXAMPLES = {
  fotossintese: `A fotossíntese é o processo em que as plantas usam a luz do sol para produzir o próprio alimento. Ela acontece nos cloroplastos, que ficam principalmente nas folhas. A clorofila, um pigmento verde, capta a energia da luz. A planta usa essa energia para juntar a água, que vem pela raiz, e o gás carbônico, que entra pelos estômatos das folhas. No fim, a planta produz glicose e libera oxigênio no ar. Esse oxigênio é o que os animais, e nós, respiramos.`,

  ciencias: `A mitose é um processo de divisão celular em que uma célula-mãe se divide em duas células-filhas geneticamente idênticas. Ocorre em quatro fases principais: prófase, metáfase, anáfase e telófase. Durante a prófase, a cromatina se condensa em cromossomos visíveis e o fuso mitótico começa a se formar. Na metáfase, os cromossomos se alinham no plano equatorial da célula. Na anáfase, as cromátides-irmãs se separam e migram para polos opostos da célula. Por fim, na telófase, uma nova membrana nuclear se forma em torno de cada conjunto de cromossomos, e ocorre a citocinese, dividindo o citoplasma em duas células distintas.`,

  historia: `A Revolução Industrial, iniciada na Grã-Bretanha por volta de 1760, foi uma transformação profunda nos processos de produção, com a substituição do trabalho manual por máquinas movidas a vapor. As fábricas substituíram os ateliês artesanais, e enormes contingentes populacionais migraram do campo para as cidades em busca de emprego. Este processo trouxe tanto avanços tecnológicos como sérias consequências sociais: jornadas de trabalho exaustivas, trabalho infantil, condições insalubres nas fábricas e o crescimento de bairros operários sem saneamento básico. A concentração de riqueza nas mãos dos industriais e a pauperização dos trabalhadores criaram as condições para o surgimento dos movimentos operários e das primeiras reivindicações por direitos laborais.`,

  matematica: `Uma função quadrática é uma função polinomial de segundo grau definida pela equação f(x) = ax² + bx + c, onde a ≠ 0. O gráfico de uma função quadrática é uma parábola: quando a > 0, a parábola abre para cima e tem um mínimo; quando a < 0, abre para baixo e tem um máximo. O vértice da parábola, ponto de máximo ou mínimo, pode ser calculado pela fórmula xv = -b/(2a) e yv = -Δ/(4a), onde Δ = b² - 4ac é o discriminante. As raízes da equação quadrática — os valores de x para os quais f(x) = 0 — são obtidas pela fórmula de Bhaskara: x = (-b ± √Δ) / (2a). O discriminante determina o número de raízes reais: Δ > 0 indica duas raízes distintas, Δ = 0 uma raiz dupla, e Δ < 0 nenhuma raiz real.`,
};

document.querySelectorAll('.example-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.example;
    if (!EXAMPLES[key]) return;
    // The person's own text can come back with one click
    const previous = textarea.value;
    const wasOwn = previous.trim() && !Object.values(EXAMPLES).includes(previous);
    textarea.value = EXAMPLES[key];
    exampleShown = key;
    clearError();
    if (wasOwn && !IS_DEMO) {
      undoText = previous;
      document.getElementById('undo-example').hidden = false;
    }
    if (IS_DEMO) {
      demoTopic = key;
      document.querySelectorAll('.example-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      document.getElementById('sr-status').textContent = `Assunto: ${btn.textContent}. Escolha um modo e clique em Adaptar.`;
    }
    hideSourceOrigin();
    updateCharCount();
    textarea.focus();
    // Scroll textarea ao topo se estiver longo
    textarea.scrollTop = 0;
  });
});

// ═══════════════════════════════════════════════════════════════════════
// NÃO ENTENDI ESTA PARTE — explains a selected passage of the result
// ═══════════════════════════════════════════════════════════════════════
const explainBtn = document.getElementById('explain-btn');
let explainRange = null;

function hideExplainButton() {
  explainBtn.hidden = true;
  explainRange = null;
}

document.addEventListener('selectionchange', () => {
  const selection = document.getSelection();
  const text = selection ? selection.toString().trim() : '';
  if (!canUseAI() || !currentResult || text.length < 3 || !selection.rangeCount
      || !outputContent.contains(selection.anchorNode)) {
    if (document.activeElement !== explainBtn) hideExplainButton();
    return;
  }
  explainRange = selection.getRangeAt(0).cloneRange();
  explainBtn.hidden = false;
});

// Keeps the text selected when the button is pressed
explainBtn.addEventListener('mousedown', e => e.preventDefault());

explainBtn.addEventListener('click', async () => {
  const range = explainRange;
  if (!range) return;
  const trecho = range.toString().trim().slice(0, 1000);
  const start = range.startContainer;
  const block = (start.nodeType === 1 ? start : start.parentElement)
    .closest('.output-prose, .summary-body, .checklist-item, .question-card, .mapping-grid-section, .output-alert')
    || outputContent.lastElementChild;

  hideExplainButton();
  document.getSelection().removeAllRanges();
  explainPassage(trecho, block);
});

// wholeBlock: the person asked about the block they just read, so no need to quote it back
async function explainPassage(trecho, block, wholeBlock = false) {
  // Asking again shows the explanation already there instead of paying for another
  const existing = [...outputContent.querySelectorAll('.explain-card')].find(c => c.dataset.trecho === trecho);
  if (existing && !existing.classList.contains('is-error')) {
    existing.focus({ preventScroll: true });
    existing.scrollIntoView({ block: 'nearest' });
    return;
  }
  existing?.remove();

  const card = document.createElement('div');
  card.className = 'explain-card';
  card.dataset.trecho = trecho;
  card.tabIndex = -1;
  card.setAttribute('aria-live', 'polite');
  const quote = document.createElement('p');
  quote.className = 'explain-card__quote';
  quote.textContent = wholeBlock ? 'Explicando de outro jeito:' : `“${trecho}”`;
  const answer = document.createElement('p');
  answer.textContent = 'Explicando…';
  card.append(quote, answer);
  block.after(card);
  card.focus({ preventScroll: true });
  card.scrollIntoView({ block: 'nearest' });

  try {
    const data = await apiPost('/explain', {
      trecho,
      contexto: toMarkdown(currentResult).slice(0, 6000),
      perfil: buildPerfilString(),
    });
    answer.textContent = data.explicacao;
    if (data.exemplo) {
      const example = document.createElement('p');
      example.textContent = `Exemplo: ${data.exemplo}`;
      card.append(example);
    }
  } catch (err) {
    answer.textContent = err.message;
    card.classList.add('is-error');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SESSÃO DE FOCO — one step at a time, with a silent timer
// ═══════════════════════════════════════════════════════════════════════
const fsPanel = document.getElementById('focus-session');
const fsCount = document.getElementById('fs-count');
const fsStep  = document.getElementById('fs-step');
const fsFill  = document.getElementById('fs-fill');
const fsTimer = document.getElementById('fs-timer');
const fsDone  = document.getElementById('fs-done');
const fsPause = document.getElementById('fs-pause');
const fsSkip  = document.getElementById('fs-skip');
const fsExit  = document.getElementById('fs-exit');
const FOCUS_MINUTES = { curta: 5, media: 10, longa: 15 };
const fs = { steps: [], index: 0, done: 0, total: 300, left: 300, paused: false, interval: null, release: null };

function fsRenderTimer() {
  const m = Math.floor(fs.left / 60);
  const s = String(fs.left % 60).padStart(2, '0');
  fsTimer.textContent = fs.left > 0 ? `${m}:${s}` : 'Tempo encerrado. Sem pressa: conclua quando puder.';
  fsFill.style.width = `${(1 - fs.left / fs.total) * 100}%`;
}

// One block per step: done, current and still to do
function fsRenderSteps() {
  document.getElementById('fs-steps').innerHTML = fs.steps.map((_, i) =>
    `<span class="${checklistState[i] ? 'done' : i === fs.index ? 'current' : ''}"></span>`).join('');
}

function fsSetPaused(paused) {
  fs.paused = paused;
  fsPause.textContent = paused ? 'Continuar' : 'Pausar';
  fsPanel.classList.toggle('is-paused', paused);
  document.getElementById('fs-paused').hidden = !paused;
}

const fsNote = document.getElementById('fs-note');
fsNote.addEventListener('input', () => {
  setStepNote(fs.index, fsNote.value);
  const btn = outputContent.querySelector(`.checklist-item[data-idx="${fs.index}"] .checklist-item__do`);
  if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.textContent = stepButtonLabel(fs.index);
});

function fsShowStep() {
  fsCount.textContent = `Passo ${fs.index + 1} de ${fs.steps.length}`;
  fsStep.textContent = fs.steps[fs.index];
  document.getElementById('fs-note-wrap').hidden = false;
  fsNote.value = checklistNotes[fs.index] || '';
  fs.left = fs.total;
  fsSetPaused(false);
  fsRenderSteps();
  fsRenderTimer();
  fsStep.tabIndex = -1;
  fsStep.focus({ preventScroll: true });
}

function fsFinish() {
  clearInterval(fs.interval);
  document.getElementById('fs-mascot').hidden = false;
  fsCount.textContent = 'Sessão concluída';
  const ticked = checklistState.filter(Boolean).length;
  fsStep.textContent = `Você concluiu ${ticked} de ${fs.steps.length} passos.`;
  fsTimer.textContent = '';
  fsFill.style.width = '100%';
  document.getElementById('fs-note-wrap').hidden = true;
  fsSetPaused(false);
  fsRenderSteps();
  [fsDone, fsPause, fsSkip].forEach(btn => { btn.hidden = true; });
  fsExit.textContent = 'Fechar';
  fsExit.focus();
}

// Steps already ticked in the checklist are not shown again
function nextPendingStep(from) {
  let i = from;
  while (i < fs.steps.length && checklistState[i]) i += 1;
  return i;
}

function fsAdvance() {
  fs.index = nextPendingStep(fs.index + 1);
  if (fs.index >= fs.steps.length) fsFinish();
  else fsShowStep();
}

// Leaving halfway offers to pick up where it stopped
function updateFocusStartLabel() {
  const btn = document.getElementById('focus-start');
  if (!btn) return;
  const done = checklistState.filter(Boolean).length;
  const total = checklistState.length;
  btn.textContent = done > 0 && done < total
    ? `Continuar sessão de foco (${done}/${total})`
    : 'Começar sessão de foco';
}

function closeFocusSession() {
  clearInterval(fs.interval);
  fsSetPaused(false);
  updateFocusStartLabel();
  fsPanel.hidden = true;
  document.body.style.overflow = '';
  if (fs.release) fs.release();
  fs.release = null;
}

function startFocusSession(steps) {
  if (!steps.length) return;
  let sessao = '';
  try { sessao = JSON.parse(localStorage.getItem('minded_prefs') || '{}').sessao; } catch (_) {}
  fs.steps = steps;
  // Starts at the first unticked step, or from the top when all are done
  fs.index = nextPendingStep(0);
  if (fs.index >= steps.length) fs.index = 0;
  fs.done = 0;
  fs.total = (FOCUS_MINUTES[sessao] || 5) * 60;
  // The text being studied, for steps that ask to read a part of it
  const source = outputContent.querySelector('.source-text .source-text__body')?.textContent || '';
  document.getElementById('fs-source').hidden = !source;
  document.getElementById('fs-source-body').textContent = source;
  document.getElementById('fs-mascot').hidden = true;
  [fsDone, fsPause, fsSkip].forEach(btn => { btn.hidden = false; });
  fsExit.textContent = 'Sair';
  fsPanel.hidden = false;
  document.body.style.overflow = 'hidden';
  fs.release = trapFocus(fsPanel, closeFocusSession);
  fsShowStep();
  clearInterval(fs.interval);
  fs.interval = setInterval(() => {
    if (fs.paused || fs.left <= 0) return;
    fs.left -= 1;
    fsRenderTimer();
    // Every minute in the session counts toward the daily goal
    if ((fs.total - fs.left) % 60 === 0) addStudyMinutes(1);
  }, 1000);
}

fsDone.addEventListener('click', () => {
  setStepDone(fs.index, true);
  fs.done += 1;
  fsAdvance();
});
fsSkip.addEventListener('click', fsAdvance);
fsExit.addEventListener('click', closeFocusSession);
fsPause.addEventListener('click', () => fsSetPaused(!fs.paused));

// ═══════════════════════════════════════════════════════════════════════
// REVISÃO ESPAÇADA — rated questions come back after growing intervals
// ═══════════════════════════════════════════════════════════════════════
const REVIEW_KEY = 'minded_review';
const REVIEW_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 86400000;

function loadReview() {
  try { return JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]'); }
  catch (_) { return []; }
}
function saveReview(cards) {
  try { localStorage.setItem(REVIEW_KEY, JSON.stringify(cards.slice(-200))); } catch (_) {}
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// grade: 0 errei (back tomorrow), 1 quase (same interval), 2 acertei (next interval)
function rateCard(q, titulo, grade) {
  const cards = loadReview();
  let card = cards.find(c => c.pergunta === q.pergunta);
  if (!card) {
    card = { pergunta: q.pergunta, dica: q.dica, resposta: q.resposta, titulo, box: 0 };
    cards.push(card);
  }
  if (grade === 0) card.box = 0;
  if (grade === 2) card.box = Math.min(card.box + 1, REVIEW_DAYS.length - 1);
  MindedProgress.bump('revisoes');
  const days = grade === 0 ? 1 : REVIEW_DAYS[card.box];
  card.due = startOfToday() + days * DAY_MS;
  saveReview(cards);
  return days;
}

function reviewMessage(days) {
  return days === 1 ? 'Ela volta amanhã para revisão.' : `Ela volta para revisão em ${days} dias.`;
}

function dueCards() {
  return loadReview().filter(c => c.due <= Date.now());
}

function updateReviewDue() {
  const n = IS_DEMO ? 0 : dueCards().length;
  document.getElementById('review-due').hidden = n === 0;
  document.getElementById('review-due-text').textContent =
    `${n} ${n === 1 ? 'pergunta' : 'perguntas'} para revisar hoje.`;
}

const rvPanel  = document.getElementById('review-session');
const rvGuess  = document.getElementById('rv-guess');
const rvAnswer = document.getElementById('rv-answer');
const rvReveal = document.getElementById('rv-reveal');
const rvExit   = document.getElementById('rv-exit');
const rvRevealRow = document.getElementById('rv-reveal-row');
const rvRateRow   = document.getElementById('rv-rate-row');
const rv = { cards: [], index: 0, release: null };

function rvShowCard() {
  const card = rv.cards[rv.index];
  document.getElementById('rv-count').textContent = `Revisão ${rv.index + 1} de ${rv.cards.length}`;
  document.getElementById('rv-from').textContent = card.titulo ? `De: ${card.titulo}` : '';
  const question = document.getElementById('rv-question');
  question.textContent = card.pergunta;
  rvGuess.value = '';
  rvGuess.closest('label').hidden = false;
  rvAnswer.hidden = true;
  rvRevealRow.hidden = false;
  rvReveal.hidden = false;
  rvRateRow.hidden = true;
  question.tabIndex = -1;
  question.focus({ preventScroll: true });
}

function rvFinish() {
  const n = rv.cards.length;
  document.getElementById('rv-count').textContent = 'Revisão concluída';
  document.getElementById('rv-from').textContent = '';
  document.getElementById('rv-question').textContent =
    `Você revisou ${n} ${n === 1 ? 'pergunta' : 'perguntas'}.`;
  rvGuess.closest('label').hidden = true;
  rvAnswer.hidden = true;
  rvRateRow.hidden = true;
  rvRevealRow.hidden = false;
  rvReveal.hidden = true;
  rvExit.textContent = 'Fechar';
  rvExit.focus();
}

function startReview() {
  rv.cards = dueCards();
  if (!rv.cards.length) return;
  rv.index = 0;
  rvExit.textContent = 'Sair';
  rvPanel.hidden = false;
  document.body.style.overflow = 'hidden';
  rv.release = trapFocus(rvPanel, closeReview);
  rvShowCard();
}

function closeReview() {
  rvPanel.hidden = true;
  document.body.style.overflow = '';
  if (rv.release) rv.release();
  rv.release = null;
  updateReviewDue();
  const start = document.getElementById('review-start');
  (start.offsetParent ? start : textarea).focus();
}

rvReveal.addEventListener('click', () => {
  const card = rv.cards[rv.index];
  rvAnswer.textContent = `Resposta: ${card.resposta}`;
  rvAnswer.hidden = false;
  rvRevealRow.hidden = true;
  rvRateRow.hidden = false;
  rvRateRow.querySelector('button').focus();
});
rvRateRow.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
  rateCard(rv.cards[rv.index], rv.cards[rv.index].titulo, Number(b.dataset.grade));
  rv.index += 1;
  if (rv.index >= rv.cards.length) rvFinish();
  else rvShowCard();
}));
rvExit.addEventListener('click', closeReview);
document.getElementById('review-start').addEventListener('click', startReview);
updateReviewDue();
renderTodayGoal();
// The account name arrives after sign-in resolves
setTimeout(renderTodayGoal, 1500);

// ── Boot: demo mode or saved draft ────────────────────────────────────
if (IS_DEMO) {
  document.getElementById('demo-banner').hidden = false;
  nav.querySelectorAll('a[href="workspace.html"], a[href="preferencias.html"]').forEach(link => { link.hidden = true; });
  nav.insertAdjacentHTML('beforeend', '<a href="login.html" class="btn btn-primary btn-sm">Entrar</a>');
  document.getElementById('examples-group').hidden = true;
  document.getElementById('profile-group').hidden = true;
  document.getElementById('demo-chooser').hidden = false;
  document.getElementById('demo-tab-examples').addEventListener('click', () => setDemoOwn(false));
  document.getElementById('demo-tab-own').addEventListener('click', () => setDemoOwn(true));
  document.querySelectorAll('.demo-type-btn').forEach(btn => {
    btn.addEventListener('click', () => showDemoExample(btn.dataset.demoType));
  });
  setDemoOwn(false);
  // Typing in the fixed demo text explains why nothing happens
  const readonlyNote = document.getElementById('readonly-note');
  textarea.addEventListener('keydown', e => {
    if (textarea.readOnly && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      readonlyNote.classList.add('nudge');
      document.getElementById('sr-status').textContent = 'Na demonstração o texto é fixo.';
    }
  });
  document.getElementById('output-empty-text').innerHTML =
    'Escolha um modo e clique em <strong style="color:var(--clr-text)">Adaptar</strong><br/>para ver o exemplo adaptado aqui.';
} else {
  try {
    textarea.value = localStorage.getItem(DRAFT_KEY) || '';
    const savedMode = localStorage.getItem('minded_mode');
    const savedRadio = savedMode && document.querySelector(`input[name="mode"][value="${savedMode}"]`);
    if (savedRadio) savedRadio.checked = true;
    // A reload in the same tab keeps the result on screen
    const lastId = Number(sessionStorage.getItem('minded_last_result'));
    const lastEntry = loadHistory().find(h => h.id === lastId);
    if (lastEntry) restoreEntry(lastEntry, true);
  } catch (_) {}
}
updateCharCount();

