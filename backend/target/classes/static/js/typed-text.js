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

