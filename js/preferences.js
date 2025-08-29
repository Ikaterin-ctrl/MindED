// js/preferences.js

// Base da API configurada em config.js
const API_BASE = window.API_BASE_URL;

// Total de módulos, incluindo o de revisão
const TOTAL_MODULES = 6;

// Função para exibir erros de forma amigável
function showErrorMessage(msg, type = 'error') {
  showNotification(msg, type);
}

// Função para exibir notificações (sucesso/erro)
function showNotification(message, type) {
  const notificationContainer = document.getElementById('notificationContainer');
  if (!notificationContainer) {
    console.error('Notification container not found!');
    alert(message); // Fallback to alert if container not found
    return;
  }

  // Clear existing notifications
  notificationContainer.innerHTML = '';
  notificationContainer.classList.remove('hidden');

  const notification = document.createElement('div');
  notification.classList.add('notification', type);
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  // Hide after 5 seconds
  setTimeout(() => {
    notification.remove();
    if (notificationContainer.children.length === 0) {
      notificationContainer.classList.add('hidden');
    }
  }, 5000);
}

// Busca preferências salvas do usuário
async function getPreferences(userId) {
  try {
    const res = await fetch(`${API_BASE}/user/preferences?userId=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Erro ao buscar preferências:', err);
    return null;
  }
}

// Salva preferências completas do usuário
async function savePreferences(userId, preferences) {
  try {
    const res = await fetch(`${API_BASE}/user/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, preferences })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Erro ao salvar preferências:', err);
    showErrorMessage('Não foi possível salvar suas preferências. Tente novamente.');
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const modules = Array.from(document.querySelectorAll('.module'));
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressBar = document.querySelector('.progress');
  const progressText = document.querySelector('.progress-text');
  const reviewSummary = document.getElementById('review-summary');

  let current = 0;
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'guest_' + Math.random().toString(36).substr(2, 9); // Generate a simple guest ID
    localStorage.setItem('userId', userId);
    showNotification('Você está usando um ID de convidado. Suas preferências serão salvas localmente.', 'info'); // Add an info notification
  }
  const stored = await getPreferences(userId) || {};
  const selectionMap = stored.preferences || {};

  // Se houver progresso anterior, posiciona no módulo
  if (stored.completedModule) {
    current = Math.min(TOTAL_MODULES - 1, stored.completedModule - 1);
  }

  function updateModules() {
    modules.forEach((m, i) => m.hidden = (i !== current));
    prevBtn.disabled = (current === 0);
    nextBtn.textContent = (current === TOTAL_MODULES - 1) ? 'Concluir' : 'Próximo »';
    const pct = ((current + 1) / TOTAL_MODULES) * 100;
    progressBar.style.width = pct + '%';
    progressText.textContent = `Módulo ${current + 1} de ${TOTAL_MODULES}`;

    if (current === TOTAL_MODULES - 1) {
      populateReviewStep();
    }
  }

  // Apply saved selections on load
  modules.forEach(mod => {
    const step = mod.dataset.step;
    if (mod.classList.contains('checkbox-group')) {
      const saved = selectionMap[step] || [];
      mod.querySelectorAll('input[type=checkbox]').forEach(cb => {
        if (saved.includes(cb.value)) {
          cb.checked = true;
          cb.parentElement.classList.add('selected');
        }
      });
    } else {
      mod.querySelectorAll('.options').forEach((optGroup, idx) => {
        const key = `${step}_${idx}`;
        const saved = selectionMap[key];
        if (saved) {
          optGroup.querySelectorAll('.option-btn').forEach(btn => {
            if (Array.isArray(saved)) { // Multi-select
              if (saved.includes(btn.dataset.value)) {
                btn.classList.add('selected');
              }
            } else { // Single-select
              if (btn.dataset.value === saved) {
                btn.classList.add('selected');
              }
            }
          });
        }
      });
    }
  });

  // Bind selection events
  modules.forEach(mod => {
    const step = mod.dataset.step;
    if (mod.classList.contains('checkbox-group')) {
      mod.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', () => {
          cb.parentElement.classList.toggle('selected', cb.checked);
          const checked = Array.from(mod.querySelectorAll('input[type=checkbox]'))
            .filter(ch => ch.checked)
            .map(ch => ch.value);
          selectionMap[step] = checked;
        });
      });
    } else {
      mod.querySelectorAll('.options').forEach((optGroup, idx) => {
        const key = `${step}_${idx}`;
        const isMultiSelect = optGroup.children.length > 2; // Heuristic: more than 2 options implies multi-select

        optGroup.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (isMultiSelect) {
              btn.classList.toggle('selected');
              const selectedValues = Array.from(optGroup.querySelectorAll('.option-btn.selected'))
                .map(b => b.dataset.value);
              selectionMap[key] = selectedValues;
            } else {
              optGroup.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
              btn.classList.add('selected');
              selectionMap[key] = btn.dataset.value;
            }
          });
        });
      });
    }
  });

  // Validation function
  function validateCurrentModule() {
    const currentModule = modules[current];
    const step = currentModule.dataset.step;

    if (currentModule.classList.contains('checkbox-group')) {
      const selectedCheckboxes = Array.from(currentModule.querySelectorAll('input[type=checkbox]:checked'));
      if (selectedCheckboxes.length === 0) {
        showErrorMessage('Por favor, selecione pelo menos uma opção neste módulo.');
        return false;
      }
    } else {
      const optionGroups = currentModule.querySelectorAll('.options');
      for (const optGroup of optionGroups) {
        const isMultiSelect = optGroup.children.length > 2;
        if (isMultiSelect) {
          const selectedOptions = Array.from(optGroup.querySelectorAll('.option-btn.selected'));
          if (selectedOptions.length === 0) {
            showErrorMessage('Por favor, selecione pelo menos uma opção em cada categoria.');
            return false;
          }
        } else {
          const selectedOption = optGroup.querySelector('.option-btn.selected');
          if (!selectedOption) {
            showErrorMessage('Por favor, selecione uma opção em cada categoria.');
            return false;
          }
        }
      }
    }
    return true;
  }

  // Populate review step
  function populateReviewStep() {
    reviewSummary.innerHTML = ''; // Clear previous content
    let htmlContent = '<h3>Suas Preferências Escolhidas:</h3>';

    // Helper to get readable label for a value
    const getLabel = (value, groupElement) => {
      if (groupElement.classList.contains('checkbox-group')) {
        const labelElement = groupElement.querySelector(`input[value="${value}"]`).parentElement;
        return labelElement ? labelElement.textContent.trim() : value;
      } else {
        const buttonElement = groupElement.querySelector(`button[data-value="${value}"]`);
        return buttonElement ? buttonElement.textContent.trim() : value;
      }
    };

    modules.forEach(mod => {
      const step = mod.dataset.step;
      const moduleTitle = mod.querySelector('h2') ? mod.querySelector('h2').textContent : `Módulo ${step}`;
      htmlContent += `<div class="review-module-section"><h4>${moduleTitle}</h4><ul>`;

      if (mod.classList.contains('checkbox-group')) {
        const saved = selectionMap[step] || [];
        if (saved.length > 0) {
          saved.forEach(val => {
            htmlContent += `<li>${getLabel(val, mod)}</li>`;
          });
        } else {
          htmlContent += `<li>Nenhuma opção selecionada.</li>`;
        }
      } else {
        mod.querySelectorAll('.options').forEach((optGroup, idx) => {
          const key = `${step}_${idx}`;
          const saved = selectionMap[key];
          const questionTitleElement = optGroup.previousElementSibling; // Assuming h3 is before .options
          const questionTitle = questionTitleElement && questionTitleElement.tagName === 'H3' ? questionTitleElement.textContent : `Questão ${idx + 1}`;

          htmlContent += `<li><strong>${questionTitle}:</strong> `;
          if (saved) {
            if (Array.isArray(saved)) {
              if (saved.length > 0) {
                htmlContent += saved.map(val => getLabel(val, optGroup)).join(', ');
              } else {
                htmlContent += 'Nenhuma opção selecionada.';
              }
            } else {
              htmlContent += getLabel(saved, optGroup);
            }
          } else {
            htmlContent += 'Nenhuma opção selecionada.';
          }
          htmlContent += `</li>`;
        });
      }
      htmlContent += `</ul></div>`;
    });
    reviewSummary.innerHTML = htmlContent;
  }

  prevBtn.addEventListener('click', () => {
    if (current > 0) {
      current--;
      updateModules();
    }
  });

  nextBtn.addEventListener('click', async () => {
    if (current < TOTAL_MODULES - 1) {
      if (!validateCurrentModule()) {
        return; // Stop if validation fails
      }
      current++;
      updateModules();
    } else {
      // This is the "Concluir" (Finish) button on the review step
      const payload = { completedModule: current + 1, preferences: selectionMap };
      await savePreferences(userId, payload);
      showNotification('Preferências salvas com sucesso!', 'success');
      // Redirect to index.html after saving
      window.location.href = 'index.html';
    }
  });

  updateModules();
});
