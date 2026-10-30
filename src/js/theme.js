/* Runs right after <body> opens, so the chosen theme applies before the first paint. */
try {
  if (JSON.parse(localStorage.getItem('minded_a11y') || '{}').lightMode) {
    document.body.classList.add('theme-light');
  }
} catch (_) {}
