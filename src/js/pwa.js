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

  // Says what is happening, since the browser's own dialog can open out of view
  const help = document.getElementById('install-help');
  function say(text) {
    if (!help) return;
    help.textContent = text;
    help.hidden = !text;
  }

  button.addEventListener('click', async () => {
    if (promptEvent) {
      say('Confirme a instalação na janela que o navegador abriu.');
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      promptEvent = null;
      button.hidden = true;
      say(outcome === 'accepted' ? 'Pronto: o MindED foi instalado.' : 'Instalação cancelada. Você pode instalar depois pelo menu do navegador.');
    } else if (isIos) {
      say('No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.');
    }
  });

  window.addEventListener('appinstalled', () => { button.hidden = true; });
})();
