/* Ready-made results for the no-login demo: no API call, no Gemini usage. */
const DEMO_RESULTS = {
  metaphor: {
    modo: 'metaphor',
    titulo: 'A biblioteca que vira duas',
    universo_analogia: 'Biblioteca',
    conteudo_principal:
      'Imagine uma biblioteca (a célula-mãe) que precisa virar duas bibliotecas iguais. Os livros já foram copiados, e agora ' +
      'cada cópia precisa chegar ao prédio certo.\n\n' +
      'Primeiro, os livros soltos são guardados em caixas (os cromossomos), porque assim fica fácil carregar. Depois, as caixas são ' +
      'alinhadas no corredor central (o plano equatorial), com cordas presas nelas (o fuso mitótico). As cordas puxam cada exemplar para um lado do prédio.\n\n' +
      'No fim, cada lado ganha sua própria sala de acervo, e uma parede divide o prédio ao meio (a citocinese). ' +
      'Agora existem duas bibliotecas idênticas.',
    mapeamentos: [
      { termo_tecnico: 'Célula-mãe', equivalente_metafora: 'Biblioteca original', explicacao_conexao: 'É o ponto de partida, de onde tudo será dividido.' },
      { termo_tecnico: 'Cromossomos', equivalente_metafora: 'Caixas de livros', explicacao_conexao: 'O material genético fica compacto para ser transportado com segurança.' },
      { termo_tecnico: 'Fuso mitótico', equivalente_metafora: 'Cordas', explicacao_conexao: 'Puxam o material para lados opostos.' },
      { termo_tecnico: 'Plano equatorial', equivalente_metafora: 'Corredor central', explicacao_conexao: 'É a linha do meio onde tudo se alinha antes da separação.' },
      { termo_tecnico: 'Citocinese', equivalente_metafora: 'Parede no meio do prédio', explicacao_conexao: 'Separa de vez o espaço em duas unidades.' },
    ],
    pontos_de_atencao:
      'Uma biblioteca não se divide sozinha, mas a célula sim. A metáfora também não mostra a etapa anterior, ' +
      'em que o DNA é copiado.',
  },
  checklist: {
    modo: 'checklist',
    titulo: 'Entenda a mitose em 6 passos',
    conteudo_principal: 'Você vai acompanhar como uma célula se divide em duas células geneticamente idênticas.',
    passos_acao: [
      'Escreva em uma frase: uma célula-mãe vira duas células-filhas iguais.',
      'Anote os nomes das quatro fases, em ordem: prófase, metáfase, anáfase e telófase.',
      'Prófase: desenhe os cromossomos ficando visíveis e o fuso se formando.',
      'Metáfase: desenhe os cromossomos alinhados no meio da célula.',
      'Anáfase: desenhe as cromátides-irmãs indo para polos opostos.',
      'Telófase e citocinese: desenhe as duas novas membranas nucleares e a célula se dividindo.',
    ],
  },
  summary: {
    modo: 'summary',
    titulo: 'Mitose: o essencial',
    conteudo_principal:
      '- **Mitose**: divisão de uma célula-mãe em duas células-filhas geneticamente idênticas.\n' +
      '- **Prófase**: a cromatina se condensa em cromossomos e o fuso começa a se formar.\n' +
      '- **Metáfase**: os cromossomos se alinham no meio da célula.\n' +
      '- **Anáfase**: as cromátides-irmãs se separam e vão para polos opostos.\n' +
      '- **Telófase**: uma nova membrana nuclear se forma em torno de cada conjunto.\n' +
      '- **Citocinese**: o citoplasma se divide, formando duas células.',
  },
  questions: {
    modo: 'questions',
    titulo: 'Será que a mitose ficou clara?',
    conteudo_principal: 'Tente responder antes de abrir a resposta.',
    perguntas: [
      { pergunta: 'Quantas células existem ao fim da mitose?', dica: 'Pense em células-filhas.', resposta: 'Duas células-filhas, geneticamente idênticas à célula-mãe.' },
      { pergunta: 'Em qual fase os cromossomos se alinham no meio da célula?', dica: 'O nome começa com "meta".', resposta: 'Na metáfase.' },
      { pergunta: 'O que acontece na anáfase?', dica: 'Pense em movimento para os polos.', resposta: 'As cromátides-irmãs se separam e migram para polos opostos.' },
      { pergunta: 'Por que é importante que as células-filhas sejam idênticas?', dica: 'Pense na informação genética.', resposta: 'Porque cada nova célula precisa receber a mesma informação genética para funcionar como a original.' },
    ],
  },
};
