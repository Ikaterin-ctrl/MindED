// js/preferences.js

document.addEventListener('DOMContentLoaded', () => {
  // Captura módulos e controles
  const modules = Array.from(document.querySelectorAll('.module'));
  let current = 0;
  const progressBar = document.querySelector('.progress');
  const progressText = document.querySelector('.progress-text');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Função para mostrar/esconder módulos e atualizar progresso
  function updateModules() {
    modules.forEach((m, i) => m.hidden = (i !== current));
    prevBtn.disabled = (current === 0);
    nextBtn.textContent = (current === modules.length - 1)
      ? 'Concluir'
      : 'Próximo »';

    const pct = ((current + 1) / modules.length) * 100;
    progressBar.style.width = pct + '%';
    progressText.textContent = `Módulo ${current + 1} de ${modules.length}`;
  }

  // Eventos dos botões “Anterior” / “Próximo”
  prevBtn.addEventListener('click', () => {
    if (current > 0) current--;
    updateModules();
  });

  nextBtn.addEventListener('click', () => {
    if (current < modules.length - 1) {
      current++;
      updateModules();
    } else {
      // Aqui você enviaria as preferências via API, etc.
      alert('Preferências salvas! Redirecionando…');
      window.location.href = 'upload.html';
    }
  });

  // Inicializa
  updateModules();
});
