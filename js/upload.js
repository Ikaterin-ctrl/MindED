// js/upload.js

// Base da API definido em config.js
const API_BASE = window.API_BASE_URL;

// Função para exibir erros de forma amigável
function showErrorMessage(msg, type = 'error') {
  showNotification(msg, type);
}

// Função para exibir notificações (sucesso/erro)
function showNotification(message, type) {
  const notificationContainer = document.getElementById('notificationContainer');
  if (!notificationContainer) {
    console.error('Notification container not found!');
    alert(message); // Fallback to alert if container not found
    return;
  }

  // Clear existing notifications
  notificationContainer.innerHTML = '';
  notificationContainer.classList.remove('hidden');

  const notification = document.createElement('div');
  notification.classList.add('notification', type);
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  // Hide after 5 seconds
  setTimeout(() => {
    notification.remove();
    if (notificationContainer.children.length === 0) {
      notificationContainer.classList.add('hidden');
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  const dropzone     = document.getElementById('dropzone');
  const fileInput    = document.getElementById('fileUpload');
  const uploadBtn    = document.getElementById('uploadBtn');
  const adaptedPanel = document.getElementById('adapted-content');
  const buttonText   = uploadBtn.querySelector('.button-text');
  const spinner      = uploadBtn.querySelector('.spinner');

  function showLoading(isLoading, text) {
    uploadBtn.disabled = isLoading;
    buttonText.textContent = text;
    if (isLoading) {
      buttonText.classList.add('hidden');
      spinner.classList.remove('hidden');
    } else {
      buttonText.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  // 1) Configura Dropzone (clique, drag&drop, mostrar nome)
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', e => {
    e.preventDefault(); dropzone.classList.add('hover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('hover');
    fileInput.files = e.dataTransfer.files;
    if (fileInput.files.length) {
      dropzone.querySelector('p').textContent = fileInput.files[0].name;
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      dropzone.querySelector('p').textContent = fileInput.files[0].name;
    }
  });

  // 2) Botão de enviar e adaptar
  uploadBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // não está logado → redireciona para login
      return window.location.href = 'login.html';
    }

    showLoading(true, 'Verificando preferências…');

    // Busca preferências do usuário
    let prefs;
    try {
      const resp = await fetch(`${API_BASE}/user/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      prefs = await resp.json();
    } catch (err) {
      console.error('Erro ao buscar preferências:', err);
      // primeira vez, sem prefs definidas
      return window.location.href = 'preferencias.html';
    }

    // Usuário está logado e tem prefs → prossegue para upload
    const file = fileInput.files[0];
    if (!file) {
      showErrorMessage('Selecione um arquivo antes de enviar.', 'error');
      showLoading(false, 'Enviar e Adaptar com IA');
      return;
    }

    showLoading(true, 'Enviando e Adaptando…');
    try {
      const form = new FormData();
      form.append('content', file);

      const res = await fetch(`${API_BASE}/upload-and-adapt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const adapted = await res.json();
      adaptedPanel.innerHTML = adapted.html;
      adaptedPanel.hidden    = false;
      showLoading(false, 'Readaptar');
    } catch (err) {
      console.error('Erro ao processar conteúdo:', err);
      showErrorMessage('Erro ao processar seu conteúdo.', 'error');
      showLoading(false, 'Enviar e Adaptar com IA');
    } finally {
      // The showLoading(false) is already called in success/error paths,
      // but it's good practice to ensure it's always reset.
      // However, in this specific case, the button text is set based on the outcome,
      // so we'll rely on the specific calls.
    }
  });
});
