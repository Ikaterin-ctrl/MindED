// js/upload.js

// Base da API definido em config.js
const API_BASE = window.API_BASE_URL;

// Função para exibir erros de forma amigável
function showErrorMessage(msg) {
  alert(msg); // você pode trocar por um banner no DOM
}

document.addEventListener('DOMContentLoaded', () => {
  const dropzone     = document.getElementById('dropzone');
  const fileInput    = document.getElementById('fileUpload');
  const uploadBtn    = document.getElementById('uploadBtn');
  const adaptedPanel = document.getElementById('adapted-content');

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
    dropzone.querySelector('p').textContent = fileInput.files[0].name;
  });
  fileInput.addEventListener('change', () => {
    dropzone.querySelector('p').textContent = fileInput.files[0].name;
  });

  // 2) Botão de enviar e adaptar
  uploadBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // não está logado → redireciona para login
      return window.location.href = 'login.html';
    }

    uploadBtn.disabled    = true;
    uploadBtn.textContent = 'Verificando preferências…';

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
      showErrorMessage('Selecione um arquivo antes de enviar.');
      uploadBtn.disabled    = false;
      uploadBtn.textContent = 'Enviar e Adaptar com IA';
      return;
    }

    uploadBtn.textContent = 'Enviando e Adaptando…';
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
      uploadBtn.textContent = 'Readaptar';
    } catch (err) {
      console.error('Erro ao processar conteúdo:', err);
      showErrorMessage('Erro ao processar seu conteúdo.');
      uploadBtn.textContent = 'Enviar e Adaptar com IA';
    } finally {
      uploadBtn.disabled = false;
    }
  });
});
