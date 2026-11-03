/* Runs right after <body> opens, so the chosen theme applies before the first paint. */
try {
  if (JSON.parse(localStorage.getItem('minded_a11y') || '{}').lightMode) {
    document.body.classList.add('theme-light');
  }
} catch (_) {}

/* The site used to install a service worker; this removes any that remain. */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => registrations.forEach(r => r.unregister()))
    .catch(() => {});
}
