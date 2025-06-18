// Exemplo de dados; depois vocês podem buscar de uma API ou localStorage
const contents = [
  {
    tipo: 'texto',
    titulo: 'Introdução à Neurodiversidade',
    data: '12/06/2025',
    ícone: '/assets/icon-texto.svg'
  },
  // ... outros itens
];

const grid = document.getElementById('cards-grid');
const inputSearch = document.getElementById('search');
const selectType = document.getElementById('filter-type');

function renderCards(list) {
  grid.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${item.ícone}" alt="${item.tipo}"/>
      </div>
      <h3 class="card-title">${item.titulo}</h3>
      <p class="card-meta">Tipo: ${item.tipo.charAt(0).toUpperCase()+item.tipo.slice(1)} • Carregado em ${item.data}</p>
      <button class="card-btn">Ver / Adaptar</button>
    `;
    grid.append(card);
  });
}

function applyFilters() {
  const term = inputSearch.value.toLowerCase();
  const type = selectType.value;
  const filtered = contents.filter(c =>
    c.titulo.toLowerCase().includes(term) &&
    (type === '' || c.tipo === type)
  );
  renderCards(filtered);
}

// eventos
inputSearch.addEventListener('input', applyFilters);
selectType.addEventListener('change', applyFilters);

// inicializa
document.addEventListener('DOMContentLoaded', () => {
  renderCards(contents);
});
