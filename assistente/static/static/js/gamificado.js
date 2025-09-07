document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const adaptedContent = document.getElementById('adaptedContent');
    const originalContent = document.getElementById('originalContent');

    const scoreElement = document.getElementById('pontuacao');
    const progressBar = document.getElementById('progressBar');
    const completeTaskBtn = document.getElementById('completeTaskBtn'); // Corrected ID
    const quizMessage = document.getElementById('quizMessage');

    let score = 0;
    let progress = 0;
    let level = 1;
    const pointsPerLevel = 100; // Example: 100 points to level up

    // Function to update the UI elements
    function updateUI() {
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        if (progressBar) {
            progressBar.style.width = progress + '%';
            progressBar.textContent = progress + '%';
        }
        updateLevel();
    }

    // Function to update the level
    function updateLevel() {
        const newLevel = Math.floor(score / pointsPerLevel) + 1;
        if (newLevel !== level) {
            level = newLevel;
            const levelElement = document.getElementById('level');
            if (levelElement) {
                levelElement.textContent = level;
                // Add a fun animation or message for level up
                console.log(`Level Up! You are now level ${level}!`);
            }
        }
    }

    // Toggle button functionality
    toggleBtn.addEventListener('click', () => {
        if (originalContent.classList.contains('active')) {
            // Hide original, show adapted
            originalContent.classList.remove('active');
            adaptedContent.classList.add('active');
            toggleBtn.textContent = 'Ver Versão Original';
        } else {
            // Hide adapted, show original
            adaptedContent.classList.remove('active');
            originalContent.classList.add('active');
            toggleBtn.textContent = 'Ver Versão Adaptada';
        }
    });

    // Task completion functionality
    if (completeTaskBtn) {
        completeTaskBtn.addEventListener('click', () => {
            if (!completeTaskBtn.disabled) {
                score += 25;
                progress += 25;
                if (progress > 100) progress = 100; // Cap progress at 100%
                updateUI();
                completeTaskBtn.disabled = true;
                completeTaskBtn.classList.add('completed'); // Add a class for styling
                completeTaskBtn.textContent = 'Tarefa Concluída!';
            }
        });
    }

    // Quiz functionality
    window.checkAnswer = function(isCorrect) {
        if (isCorrect) {
            score += 5;
            document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const adaptedContent = document.getElementById('adaptedContent');
    const originalContent = document.getElementById('originalContent');

    const scoreElement = document.getElementById('pontuacao');
    const progressBar = document.getElementById('progressBar');
    const completeTaskBtn = document.getElementById('completeTaskBtn');
    const quizMessage = document.getElementById('quizMessage');
    const dailyTipElement = document.getElementById('dailyTip');

    let score = 0;
    let progress = 0;
    let level = 1;
    const pointsPerLevel = 100; // Example: 100 points to level up

    const dailyTips = [
        "Aprender algo novo todos os dias é como subir uma escada: cada degrau te leva mais perto do topo! 🚀",
        "O segredo para o sucesso é começar. O segredo para começar é dividir tarefas complexas em pequenas tarefas gerenciáveis. 💡",
        "Não tenha medo de errar. Errar é a prova de que você está tentando! 😉",
        "A persistência é o caminho do êxito. Continue firme! 💪",
        "Sua mente é um jardim. Cultive pensamentos positivos e colha resultados incríveis! 🌻"
    ];

    // Function to update the UI elements
    function updateUI() {
        if (scoreElement) {
            scoreElement.textContent = score;
        }
        if (progressBar) {
            progressBar.style.width = progress + '%';
            progressBar.textContent = progress + '%';
        }
        updateLevel();
        checkBadges(); // Check for badge unlocks
    }

    // Function to update the level
    function updateLevel() {
        const newLevel = Math.floor(score / pointsPerLevel) + 1;
        if (newLevel !== level) {
            level = newLevel;
            const levelElement = document.getElementById('level');
            if (levelElement) {
                levelElement.textContent = level;
                // Add a fun animation or message for level up
                console.log(`Level Up! You are now level ${level}!`);
                // Potentially trigger a visual celebration here
            }
        }
    }

    // Function to display a random daily tip
    function displayDailyTip() {
        if (dailyTipElement) {
            const randomIndex = Math.floor(Math.random() * dailyTips.length);
            dailyTipElement.textContent = dailyTips[randomIndex];
        }
    }

    // Placeholder function for checking and unlocking badges
    function checkBadges() {
        // Example: Unlock "Primeiro Passo" badge if score > 0
        if (score > 0) {
            unlockBadge('badge1');
        }
        // Example: Unlock "Mestre do Quiz" badge if score reaches 10 (after a few correct answers)
        if (score >= 10) {
            unlockBadge('badge2');
        }
        // Example: Unlock "Leitor Ávido" badge if level >= 2
        if (level >= 2) {
            unlockBadge('badge3');
        }
    }

    function unlockBadge(badgeId) {
        const badgeElement = document.getElementById(badgeId);
        if (badgeElement && !badgeElement.classList.contains('unlocked')) {
            badgeElement.classList.add('unlocked');
            // Add a visual cue for unlocking, e.g., a subtle animation or glow
            console.log(`Badge Unlocked: ${badgeId}!`);
        }
    }

    // Toggle button functionality
    toggleBtn.addEventListener('click', () => {
        if (originalContent.classList.contains('active')) {
            // Hide original, show adapted
            originalContent.classList.remove('active');
            adaptedContent.classList.add('active');
            toggleBtn.textContent = 'Ver Versão Original';
        } else {
            // Hide adapted, show original
            adaptedContent.classList.remove('active');
            originalContent.classList.add('active');
            toggleBtn.textContent = 'Ver Versão Adaptada';
        }
    });

    // Task completion functionality
    if (completeTaskBtn) {
        completeTaskBtn.addEventListener('click', () => {
            if (!completeTaskBtn.disabled) {
                score += 25;
                progress += 25;
                if (progress > 100) progress = 100; // Cap progress at 100%
                updateUI();
                completeTaskBtn.disabled = true;
                completeTaskBtn.classList.add('completed'); // Add a class for styling
                completeTaskBtn.textContent = 'Tarefa Concluída! 🎉';
            }
        });
    }

    // Quiz functionality
    window.checkAnswer = function(isCorrect) {
        if (isCorrect) {
            score += 5;
            quizMessage.textContent = "Resposta Correta! +5 pontos! 🎉";
            quizMessage.style.color = 'green';
        } else {
            quizMessage.textContent = "Resposta Incorreta. Tente novamente! 🤔";
            quizMessage.style.color = 'red';
        }
        updateUI();
    };

    // Initial setup
    updateUI();
    displayDailyTip(); // Display a tip on load
});

