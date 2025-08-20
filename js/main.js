// theme toggle
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mindED-theme', next);
});

// restore saved theme
const savedTheme = localStorage.getItem('mindED-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
