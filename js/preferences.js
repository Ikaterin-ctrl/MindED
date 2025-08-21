// js/preferences.js

// Base da API configurada em config.js
const API_BASE = window.API_BASE_URL;

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
    current = Math.min(modules.length - 1, stored.completedModule - 1);
  }

  function updateModules() {
    modules.forEach((m, i) => m.hidden = (i !== current));
    prevBtn.disabled = (current === 0);
    nextBtn.textContent = (current === modules.length - 1) ? 'Concluir' : 'Próximo »';
    const pct = ((current + 1) / modules.length) * 100;
    progressBar.style.width = pct + '%';
    progressText.textContent = `Módulo ${current + 1} de ${modules.length}`;
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
      // Multiple question groups in the same module
      mod.querySelectorAll('.options').forEach((optGroup, idx) => {
        const key = `${step}_${idx}`;
        const saved = selectionMap[key];
        if (saved) {
          optGroup.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.dataset.value === saved) btn.classList.add('selected');
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
        optGroup.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            optGroup.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectionMap[key] = btn.dataset.value;
          });
        });
      });
    }
  });

  prevBtn.addEventListener('click', () => {
    if (current > 0) {
      current--;
      updateModules();
    }
  });

  nextBtn.addEventListener('click', async () => {
    if (current < modules.length - 1) {
      current++;
      updateModules();
    } else {
      const payload = { completedModule: current + 1, preferences: selectionMap };
      await savePreferences(userId, payload);
      window.location.href = 'upload.html';
    }
  });

  updateModules();
});
