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
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileUpload');
  const uploadBtn = document.getElementById('uploadBtn');
  const buttonText = uploadBtn.querySelector('.button-text');
  const spinner = uploadBtn.querySelector('.spinner');

  // Elementos da nova UI de preview
  const initialState = document.querySelector('.dropzone-initial-state');
  const previewState = document.querySelector('.dropzone-preview-state');
  const fileIcon = document.querySelector('.file-icon');
  const fileName = document.querySelector('.file-name');
  const fileSize = document.querySelector('.file-size');
  const removeFileBtn = document.querySelector('.remove-file-btn');
  const progressContainer = document.querySelector('.progress-container');
  const progressBar = document.querySelector('.progress-bar');

  // Novos elementos para feedback de sucesso
  const uploadSuccessState = document.getElementById('uploadSuccessState');
  const viewContentBtn = document.getElementById('viewContentBtn');

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

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function getFileIconClass(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'txt':
        return 'fas fa-file-alt';
      default:
        return 'fas fa-file';
    }
  }

  function updatePreview(file) {
    if (!file) return;

    initialState.classList.add('hidden');
    previewState.classList.remove('hidden');
    dropzone.classList.add('file-selected');

    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    fileIcon.className = `file-icon ${getFileIconClass(file.name)}`;
    uploadBtn.disabled = false; // Habilita o botão
  }

  function resetDropzone() {
    fileInput.value = ''; // Limpa o input
    initialState.classList.remove('hidden');
    previewState.classList.add('hidden');
    dropzone.classList.remove('file-selected');
    uploadBtn.disabled = true; // Desabilita o botão
    progressBar.style.width = '0%';
    progressContainer.classList.add('hidden');
    uploadSuccessState.classList.add('hidden'); // Esconde o estado de sucesso
    progressBar.classList.remove('complete'); // Remove a classe de completo
  }

  // Configura Dropzone
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('.remove-file-btn')) return;
    fileInput.click();
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    if (!fileInput.files.length) {
        dropzone.classList.add('hover');
    }
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('hover'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('hover');
    fileInput.files = e.dataTransfer.files;
    updatePreview(fileInput.files[0]);
  });

  fileInput.addEventListener('change', () => {
    updatePreview(fileInput.files[0]);
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Impede que o clique no botão de remover acione o clique no dropzone
    resetDropzone();
  });

  // Botão de enviar e adaptar
  uploadBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return window.location.href = 'login.html';
    }

    const file = fileInput.files[0];
    if (!file) {
      showErrorMessage('Selecione um arquivo antes de enviar.', 'error');
      return;
    }

    showLoading(true, 'Verificando preferências…');

    try {
      const resp = await fetch(`${API_BASE}/user/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      await resp.json();
    } catch (err) {
      console.error('Erro ao buscar preferências:', err);
      showLoading(false, 'Enviar');
      return window.location.href = 'preferencias.html';
    }

    showLoading(true, 'Enviando e Adaptando…');
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressBar.classList.remove('complete'); // Garante que a barra não esteja verde no início

    const form = new FormData();
    form.append('content', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/upload-and-adapt`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = `${percentComplete.toFixed(2)}%`;
        if(percentComplete < 100) {
            showLoading(true, `Enviando... ${percentComplete.toFixed(0)}%`);
        } else {
            showLoading(true, 'Adaptando conteúdo...');
            progressBar.classList.add('complete'); // Adiciona a classe de completo quando 100%
        }
      }
    });

    xhr.addEventListener('load', () => {
      showLoading(false, 'Enviar'); // Resetar o botão
      progressContainer.classList.add('hidden'); // Esconder a barra de progresso
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const adapted = JSON.parse(xhr.responseText);
        sessionStorage.setItem('adaptedContent', adapted.html);
        
        // Mostrar mensagem de sucesso e botão
        uploadSuccessState.classList.remove('hidden');
        uploadBtn.classList.add('hidden'); // Esconder o botão de upload
        dropzone.classList.add('hidden'); // Esconder o dropzone
        
        viewContentBtn.onclick = () => {
          window.location.href = 'conteudo-adaptado.html';
        };

      } else {
        console.error('Erro ao processar conteúdo:', xhr.statusText);
        showErrorMessage('Erro ao processar seu conteúdo.', 'error');
        resetDropzone();
      }
    });

    xhr.addEventListener('error', () => {
      progressContainer.classList.add('hidden');
      console.error('Erro de rede ao tentar enviar o arquivo.');
      showErrorMessage('Erro de rede. Verifique sua conexão.', 'error');
      showLoading(false, 'Enviar');
      resetDropzone();
    });

    xhr.send(form);
  });

  // Estado inicial do botão
  resetDropzone();
});
