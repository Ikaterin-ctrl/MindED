const phrases = [
    "Transforme seu aprendizado.",
    "Conteúdo adaptado para você.",
    "MindED torna estudar mais leve.",
    "Seu estudo. Seu ritmo. Sua forma."
];

let currentPhrase = 0;
let typedText = document.getElementById("typed-text");

function showPhrase() {
    typedText.classList.remove("fade-in");
    void typedText.offsetWidth; 
    typedText.textContent = phrases[currentPhrase];
    typedText.classList.add("fade-in");

    currentPhrase = (currentPhrase + 1) % phrases.length;
}

setInterval(showPhrase, 3000);


typedText.classList.add("fade-in");

const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  // opcional: salvar no localStorage
  localStorage.setItem('mindED-theme', next);
});

// Ao carregar a página, restaurar preferência
const saved = localStorage.getItem('mindED-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
