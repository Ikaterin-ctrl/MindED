/* Registers the app and offers installation where the browser allows it. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

(function initInstallButton() {
  const button = document.getElementById('install-btn');
  if (!button) return;

  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (installed) return;

  let promptEvent = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    promptEvent = e;
    button.hidden = false;
  });

  // iPhone and iPad have no install prompt, only the Share menu.
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos) button.hidden = false;

  button.addEventListener('click', async () => {
    if (promptEvent) {
      promptEvent.prompt();
      await promptEvent.userChoice;
      promptEvent = null;
      button.hidden = true;
    } else if (isIos) {
      button.textContent = 'No Safari: Compartilhar → Adicionar à Tela de Início';
    }
  });

  window.addEventListener('appinstalled', () => { button.hidden = true; });
})();
