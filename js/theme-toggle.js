// Mantém o toggle de tema (light/dark) globalmente
const toggleBtn = document.getElementById('theme-toggle');
if (toggleBtn) {
  // Restaura preferência anterior
  const saved = localStorage.getItem('mindED-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mindED-theme', next);
  });
}
