// theme toggle
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mindED-theme', next);
});

// restore saved theme
const saved = localStorage.getItem('mindED-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);