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

  uploadBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
        showNotification('Por favor, selecione um arquivo primeiro.', 'error');
        return;
    }

    // Show "Processing" message
    showNotification('Processando conteúdo com IA...', 'info');

    // Disable button and show spinner
    uploadBtn.disabled = true;
    buttonText.textContent = 'Processando...';
    spinner.classList.remove('hidden');

    // Show and animate progress bar
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%'; // Reset width
    progressBar.style.transition = 'width 3s linear'; // Set transition
    setTimeout(() => {
        progressBar.style.width = '100%'; // Animate to 100%
    }, 100); // Small delay to ensure transition applies

    // Wait for 3 seconds and then redirect
    setTimeout(() => {
      window.location.href = 'principal.html';
    }, 3000);
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