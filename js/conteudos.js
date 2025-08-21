// conteudos.js

// URL base da API definida em config.js
const API_BASE = window.API_BASE_URL;

// Exemplo de dados de fallback (se a API não responder)
const fallbackContents = [
  {
    tipo: 'texto',
    titulo: 'Introdução à Neurodiversidade',
    data: '12/06/2025',
    ícone: '/assets/icon-texto.svg'
  },
  // ... outros itens estáticos
];

// Elementos do DOM
const grid = document.getElementById('cards-grid');
const inputSearch = document.getElementById('search');
const selectType = document.getElementById('filter-type');

// Função para exibir mensagem de erro ao usuário
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

// Renderiza os cards na tela
function renderCards(list) {
  grid.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${item.ícone}" alt="${item.tipo}" />
      </div>
      <h3 class="card-title">${item.titulo}</h3>
      <p class="card-meta">
        Tipo: ${item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)} • Carregado em ${item.data}
      </p>
      <button class="card-btn">Ver / Adaptar</button>
    `;
    grid.append(card);
  });
}

// Busca conteúdos na API, ou usa fallback em caso de erro
async function fetchContents() {
  try {
    const res = await fetch(`${API_BASE}/contents`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.contents; // ajuste conforme o formato da sua API
  } catch (err) {
    console.error('Erro ao buscar conteúdos:', err);
    showErrorMessage('Não foi possível carregar os conteúdos. Usando dados offline.');
    return fallbackContents;
  }
}

// Filtra o array de conteúdos de acordo com busca e tipo
function applyFilters(contents) {
  const term = inputSearch.value.toLowerCase();
  const type = selectType.value;
  const filtered = contents.filter(c =>
    c.titulo.toLowerCase().includes(term) &&
    (type === '' || c.tipo === type)
  );
  renderCards(filtered);
}

// Eventos de filtro
inputSearch.addEventListener('input', () => applyFilters(currentContents));
selectType.addEventListener('change', () => applyFilters(currentContents));

// Variável que guarda os conteúdos carregados
let currentContents = fallbackContents;

// Inicialização após carregar o DOM
document.addEventListener('DOMContentLoaded', async () => {
  currentContents = await fetchContents();
  renderCards(currentContents);
});
