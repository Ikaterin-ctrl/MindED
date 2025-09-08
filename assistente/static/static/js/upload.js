document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');
  const buttonText = uploadBtn.querySelector('.button-text');
  const spinner = uploadBtn.querySelector('.spinner');
  const notificationContainer = document.getElementById('notificationContainer');
  const progressContainer = document.querySelector('.progress-container'); // Added
  const progressBar = document.querySelector('.progress-bar'); // Added

  function showNotification(message, type) {
    if (!notificationContainer) {
      console.error('Notification container not found!');
      alert(message); // Fallback to alert if container not found
      return;
    }

    notificationContainer.innerHTML = '';
    notificationContainer.classList.remove('hidden');

    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    // Do not auto-hide the processing message
    if (type !== 'info') {
        setTimeout(() => {
            notification.remove();
            if (notificationContainer.children.length === 0) {
                notificationContainer.classList.add('hidden');
            }
        }, 3000);
    }
  }

  uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        showNotification('Por favor, selecione um arquivo primeiro.', 'error');
        return;
    }

    showNotification('Processando conteúdo com IA...', 'info');
    uploadBtn.disabled = true;
    buttonText.textContent = 'Processando...';
    spinner.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressBar.style.transition = 'width 3s linear';
    setTimeout(() => {
        progressBar.style.width = '100%';
    }, 100);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload-and-adapt', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao adaptar o conteúdo.');
        }

        const adaptedContent = await response.text();
        sessionStorage.setItem('adaptedContent', adaptedContent);
        window.location.href = 'conteudo-adaptado.html';

    } catch (error) {
        console.error('Erro no upload e adaptação:', error);
        showNotification(`Erro: ${error.message}`, 'error');
        uploadBtn.disabled = false;
        buttonText.textContent = 'Enviar';
        spinner.classList.add('hidden');
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
    }
  });

  // Keep the dropzone functionality for visual feedback
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileUpload');
  const initialState = document.querySelector('.dropzone-initial-state');
  const previewState = document.querySelector('.dropzone-preview-state');
  const fileName = document.querySelector('.file-name');
  const fileSize = document.querySelector('.file-size');
  const removeFileBtn = document.querySelector('.remove-file-btn');

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function updatePreview(file) {
    if (!file) return;
    initialState.classList.add('hidden');
    previewState.classList.remove('hidden');
    dropzone.classList.add('file-selected');
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    uploadBtn.disabled = false;
  }

  function resetDropzone() {
    fileInput.value = '';
    initialState.classList.remove('hidden');
    previewState.classList.add('hidden');
    dropzone.classList.remove('file-selected');
    uploadBtn.disabled = true;
    progressContainer.classList.add('hidden'); // Added
    progressBar.style.width = '0%'; // Added
    progressBar.style.transition = 'none'; // Added
  }

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
    e.stopPropagation();
    resetDropzone();
  });

  resetDropzone();
});