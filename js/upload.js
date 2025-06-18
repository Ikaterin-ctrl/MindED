// js/upload.js

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
    // Verifica se usuário está logado
    const token = localStorage.getItem('authToken');
    if (!token) {
      // se não logado, manda para login
      return window.location.href = 'login.html';
    }

    // Se logado, verifica se já definiu preferências
    uploadBtn.disabled   = true;
    uploadBtn.textContent = 'Verificando preferências…';
    let prefs;
    try {
      const resp = await fetch('/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Sem preferências');
      prefs = await resp.json();
    } catch {
      // primeira vez, sem prefs definidas
      return window.location.href = 'preferencias.html';
    }

    // Se chegou aqui, é porque está logado e tem prefs
    // Agora sim faz o upload e a adaptação
    const file = fileInput.files[0];
    if (!file) {
      alert('Selecione um arquivo antes de enviar.');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Enviar e Adaptar com IA';
      return;
    }

    uploadBtn.textContent = 'Enviando e Adaptando…';
    try {
      const form = new FormData();
      form.append('content', file);

      const res = await fetch('/api/upload-and-adapt', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      if (!res.ok) throw new Error('Falha ao processar');

      const adapted = await res.json();
      // injeta o HTML que a IA retornou
      adaptedPanel.innerHTML = adapted.html;
      adaptedPanel.hidden    = false;
      uploadBtn.textContent = 'Readaptar';
    } catch (err) {
      console.error(err);
      alert('Erro ao processar seu conteúdo.');
      uploadBtn.textContent = 'Enviar e Adaptar com IA';
    } finally {
      uploadBtn.disabled = false;
    }
  });
});

