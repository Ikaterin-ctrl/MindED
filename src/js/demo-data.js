/* Ready-made results for the no-login demo: no API call, no Gemini usage.
   One set per example text, keyed like the example buttons (EXAMPLES in workspace.js). */
const DEMO_RESULTS = {
  ciencias: {
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
      titulo: 'Entenda a mitose em 5 passos',
      conteudo_principal: 'Você vai acompanhar como uma célula se divide em duas células geneticamente idênticas.',
      tarefas: [
        { texto: 'Explique com suas palavras o que a mitose produz.', tipo: 'escrever',
          trecho: 'A mitose é um processo de divisão celular em que uma célula-mãe se divide em duas células-filhas geneticamente idênticas.' },
        { texto: 'Coloque as quatro fases da mitose na ordem em que acontecem.', tipo: 'ordenar',
          trecho: 'Ocorre em quatro fases principais: prófase, metáfase, anáfase e telófase.',
          itens: ['Prófase', 'Metáfase', 'Anáfase', 'Telófase'] },
        { texto: 'Onde os cromossomos se alinham na metáfase?', tipo: 'multipla_escolha',
          trecho: 'Na metáfase, os cromossomos se alinham no plano equatorial da célula.',
          opcoes: ['Nos polos da célula', 'No plano equatorial da célula', 'Fora do núcleo'], correta: 1 },
        { texto: 'Marque a frase que explica o que acontece na anáfase.', tipo: 'marcar_no_texto',
          trecho: 'Na metáfase, os cromossomos se alinham no plano equatorial da célula. Na anáfase, as cromátides-irmãs se separam e migram para polos opostos da célula. Por fim, na telófase, uma nova membrana nuclear se forma em torno de cada conjunto de cromossomos, e ocorre a citocinese, dividindo o citoplasma em duas células distintas.',
          frase_certa: 'Na anáfase, as cromátides-irmãs se separam e migram para polos opostos da célula.' },
        { texto: 'Explique a diferença entre a telófase e a citocinese.', tipo: 'escrever',
          trecho: 'Por fim, na telófase, uma nova membrana nuclear se forma em torno de cada conjunto de cromossomos, e ocorre a citocinese, dividindo o citoplasma em duas células distintas.' },
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
        { pergunta: 'Quantas células existem ao fim da mitose?', dica: 'Lembre o que acontece com a célula-mãe no fim do processo.', resposta: 'Duas células-filhas, geneticamente idênticas à célula-mãe.' },
        { pergunta: 'Em qual fase os cromossomos se alinham no meio da célula?', dica: 'É a segunda das quatro fases.', resposta: 'Na metáfase.' },
        { pergunta: 'O que acontece na anáfase?', dica: 'Pense em movimento para os polos.', resposta: 'As cromátides-irmãs se separam e migram para polos opostos.' },
        { pergunta: 'Por que é importante que as células-filhas sejam idênticas?', dica: 'Pense na informação genética.', resposta: 'Porque cada nova célula precisa receber a mesma informação genética para funcionar como a original.' },
      ],
    },
    mindmap: {
      modo: 'mindmap',
      titulo: 'Mitose',
      conteudo_principal: 'Uma célula-mãe se divide em duas células-filhas idênticas.',
      ramos: [
        { ideia: 'Prófase', detalhes: ['A cromatina vira cromossomos visíveis', 'O fuso começa a se formar'] },
        { ideia: 'Metáfase', detalhes: ['Os cromossomos se alinham no meio da célula'] },
        { ideia: 'Anáfase', detalhes: ['As cromátides-irmãs se separam', 'Cada uma vai para um polo'] },
        { ideia: 'Telófase e citocinese', detalhes: ['Surge uma membrana em cada núcleo', 'O citoplasma se divide em dois'] },
      ],
    },
  },

  historia: {
    metaphor: {
      modo: 'metaphor',
      titulo: 'A padaria que virou fábrica',
      universo_analogia: 'Padaria',
      conteudo_principal:
        'Pense numa padaria de bairro onde cada pão é feito à mão, no ritmo do padeiro (o trabalho artesanal). ' +
        'Um dia chega uma máquina a vapor que amassa e assa centenas de pães por hora (a mecanização), e a padaria vira uma fábrica de pães.\n\n' +
        'Para dar conta da máquina, muita gente sai do interior e vem morar perto da fábrica (o êxodo rural). ' +
        'O dono fica cada vez mais rico, enquanto quem trabalha passa o dia inteiro na linha de produção, inclusive crianças, ' +
        'em salas quentes e sem ventilação (as condições insalubres).\n\n' +
        'Cansados disso, os funcionários se juntam para pedir horários menores e mais segurança (os movimentos operários).',
      mapeamentos: [
        { termo_tecnico: 'Trabalho artesanal', equivalente_metafora: 'Pão feito à mão', explicacao_conexao: 'Uma pessoa faz tudo, no próprio ritmo e em pequena quantidade.' },
        { termo_tecnico: 'Máquina a vapor', equivalente_metafora: 'Máquina que amassa e assa', explicacao_conexao: 'Produz muito mais, mais rápido, e muda a forma de trabalhar.' },
        { termo_tecnico: 'Êxodo rural', equivalente_metafora: 'Gente se mudando para perto da fábrica', explicacao_conexao: 'Pessoas deixam o campo atrás de emprego nas cidades.' },
        { termo_tecnico: 'Concentração de riqueza', equivalente_metafora: 'Dono cada vez mais rico', explicacao_conexao: 'O lucro fica com quem é dono das máquinas.' },
        { termo_tecnico: 'Movimentos operários', equivalente_metafora: 'Funcionários se juntando', explicacao_conexao: 'Trabalhadores organizados pedem direitos.' },
      ],
      pontos_de_atencao:
        'A Revolução Industrial mudou países inteiros durante décadas, não só uma empresa. A metáfora também não mostra ' +
        'que ela começou na Grã-Bretanha por volta de 1760.',
    },
    checklist: {
      modo: 'checklist',
      titulo: 'Revolução Industrial em 5 passos',
      conteudo_principal: 'Você vai entender o que mudou no trabalho e na vida das pessoas com a Revolução Industrial.',
      tarefas: [
        { texto: 'Onde e quando a Revolução Industrial começou?', tipo: 'multipla_escolha',
          trecho: 'A Revolução Industrial, iniciada na Grã-Bretanha por volta de 1760, foi uma transformação profunda nos processos de produção, com a substituição do trabalho manual por máquinas movidas a vapor.',
          opcoes: ['Na França, por volta de 1900', 'Na Grã-Bretanha, por volta de 1760', 'Nos Estados Unidos, por volta de 1800'], correta: 1 },
        { texto: 'Explique com suas palavras o que substituiu o trabalho manual.', tipo: 'escrever',
          trecho: 'A Revolução Industrial, iniciada na Grã-Bretanha por volta de 1760, foi uma transformação profunda nos processos de produção, com a substituição do trabalho manual por máquinas movidas a vapor.' },
        { texto: 'Marque a frase que explica por que as cidades cresceram.', tipo: 'marcar_no_texto',
          trecho: 'As fábricas substituíram os ateliês artesanais, e enormes contingentes populacionais migraram do campo para as cidades em busca de emprego.',
          frase_certa: 'As fábricas substituíram os ateliês artesanais, e enormes contingentes populacionais migraram do campo para as cidades em busca de emprego.' },
        { texto: 'Liste três problemas sociais citados no texto.', tipo: 'escrever',
          trecho: 'Este processo trouxe tanto avanços tecnológicos como sérias consequências sociais: jornadas de trabalho exaustivas, trabalho infantil, condições insalubres nas fábricas e o crescimento de bairros operários sem saneamento básico.' },
        { texto: 'Coloque os acontecimentos na ordem de causa e consequência.', tipo: 'ordenar',
          itens: ['Máquinas a vapor chegam às fábricas', 'Pessoas migram do campo para as cidades', 'Trabalhadores enfrentam condições ruins', 'Surgem os movimentos operários'] },
      ],
    },
    summary: {
      modo: 'summary',
      titulo: 'Revolução Industrial: o essencial',
      conteudo_principal:
        '- **Início**: Grã-Bretanha, por volta de 1760.\n' +
        '- **Mudança central**: máquinas a vapor no lugar do trabalho manual.\n' +
        '- **Fábricas**: substituíram os ateliês artesanais.\n' +
        '- **Êxodo rural**: muita gente foi do campo para as cidades em busca de emprego.\n' +
        '- **Problemas sociais**: jornadas exaustivas, trabalho infantil, fábricas insalubres e bairros sem saneamento.\n' +
        '- **Consequência**: riqueza concentrada nos industriais e surgimento dos movimentos operários.',
    },
    questions: {
      modo: 'questions',
      titulo: 'Você entendeu a Revolução Industrial?',
      conteudo_principal: 'Tente responder antes de abrir a resposta.',
      perguntas: [
        { pergunta: 'Em que país a Revolução Industrial começou?', dica: 'Fica na Europa e é uma ilha.', resposta: 'Na Grã-Bretanha, por volta de 1760.' },
        { pergunta: 'O que passou a mover as máquinas das fábricas?', dica: 'Pense em água fervendo.', resposta: 'O vapor.' },
        { pergunta: 'Por que as cidades cresceram tanto nessa época?', dica: 'Pense em onde estavam os empregos.', resposta: 'Porque muitas pessoas saíram do campo em busca de trabalho nas fábricas das cidades.' },
        { pergunta: 'Cite duas condições de trabalho ruins da época.', dica: 'Pense nas horas, na idade e no ambiente.', resposta: 'Jornadas exaustivas, trabalho infantil e fábricas insalubres.' },
      ],
    },
    mindmap: {
      modo: 'mindmap',
      titulo: 'Revolução Industrial',
      conteudo_principal: 'Máquinas a vapor mudaram o trabalho e a vida nas cidades a partir de 1760.',
      ramos: [
        { ideia: 'Produção', detalhes: ['Máquinas a vapor', 'Fábricas no lugar dos ateliês'] },
        { ideia: 'Cidades', detalhes: ['Êxodo rural', 'Bairros operários sem saneamento'] },
        { ideia: 'Trabalho', detalhes: ['Jornadas exaustivas', 'Trabalho infantil', 'Fábricas insalubres'] },
        { ideia: 'Reação', detalhes: ['Movimentos operários', 'Primeiros pedidos por direitos'] },
      ],
    },
  },

  matematica: {
    metaphor: {
      modo: 'metaphor',
      titulo: 'A rampa de skate',
      universo_analogia: 'Skate',
      conteudo_principal:
        'Imagine o desenho de uma pista de skate em formato de U, vista de lado. Esse desenho é a parábola, ' +
        'o gráfico da função quadrática f(x) = ax² + bx + c.\n\n' +
        'O número a decide o formato: se a é positivo, a pista abre para cima, como um U, e tem um ponto mais baixo. ' +
        'Se a é negativo, ela vira de cabeça para baixo, como um morro, e tem um ponto mais alto. ' +
        'Esse ponto extremo é o vértice, onde o skatista para antes de voltar.\n\n' +
        'Os pontos em que a pista toca o chão são as raízes. O discriminante Δ diz quantas vezes ela toca o chão: ' +
        'duas, uma ou nenhuma.',
      mapeamentos: [
        { termo_tecnico: 'Parábola', equivalente_metafora: 'Pista em U', explicacao_conexao: 'É a curva que o gráfico desenha.' },
        { termo_tecnico: 'Coeficiente a', equivalente_metafora: 'Pista virada para cima ou para baixo', explicacao_conexao: 'O sinal de a decide para onde a parábola abre.' },
        { termo_tecnico: 'Vértice', equivalente_metafora: 'Ponto mais baixo ou mais alto da pista', explicacao_conexao: 'É o mínimo ou o máximo da função.' },
        { termo_tecnico: 'Raízes', equivalente_metafora: 'Onde a pista toca o chão', explicacao_conexao: 'São os valores de x em que f(x) = 0.' },
        { termo_tecnico: 'Discriminante Δ', equivalente_metafora: 'Quantas vezes a pista toca o chão', explicacao_conexao: 'Δ > 0: duas raízes; Δ = 0: uma; Δ < 0: nenhuma real.' },
      ],
      pontos_de_atencao:
        'Uma pista real tem fim, mas a parábola continua para sempre dos dois lados. A metáfora também não ensina a calcular: ' +
        'para isso, use as fórmulas do vértice e de Bhaskara.',
    },
    checklist: {
      modo: 'checklist',
      titulo: 'Função quadrática em 5 passos',
      conteudo_principal: 'Você vai entender a forma do gráfico e como encontrar o vértice e as raízes.',
      tarefas: [
        { texto: 'Explique por que a não pode ser zero.', tipo: 'escrever',
          trecho: 'Uma função quadrática é uma função polinomial de segundo grau definida pela equação f(x) = ax² + bx + c, onde a ≠ 0.' },
        { texto: 'Se a < 0, para onde a parábola abre?', tipo: 'multipla_escolha',
          trecho: 'O gráfico de uma função quadrática é uma parábola: quando a > 0, a parábola abre para cima e tem um mínimo; quando a < 0, abre para baixo e tem um máximo.',
          opcoes: ['Para cima, com um mínimo', 'Para baixo, com um máximo', 'Ela vira uma reta'], correta: 1 },
        { texto: 'Coloque os passos para achar as raízes na ordem.', tipo: 'ordenar',
          itens: ['Identificar a, b e c', 'Calcular Δ = b² − 4ac', 'Ver quantas raízes Δ indica', 'Usar a fórmula de Bhaskara'] },
        { texto: 'Marque a frase que diz quantas raízes existem quando Δ = 0.', tipo: 'marcar_no_texto',
          trecho: 'O discriminante determina o número de raízes reais: Δ > 0 indica duas raízes distintas, Δ = 0 uma raiz dupla, e Δ < 0 nenhuma raiz real.',
          frase_certa: 'O discriminante determina o número de raízes reais: Δ > 0 indica duas raízes distintas, Δ = 0 uma raiz dupla, e Δ < 0 nenhuma raiz real.' },
        { texto: 'Calcule Δ para f(x) = x² − 4x + 3 e diga quantas raízes reais ela tem.', tipo: 'escrever',
          trecho: 'O vértice da parábola, ponto de máximo ou mínimo, pode ser calculado pela fórmula xv = -b/(2a) e yv = -Δ/(4a), onde Δ = b² - 4ac é o discriminante.' },
      ],
    },
    summary: {
      modo: 'summary',
      titulo: 'Função quadrática: o essencial',
      conteudo_principal:
        '- **Forma geral**: f(x) = ax² + bx + c, com a ≠ 0.\n' +
        '- **Gráfico**: uma parábola.\n' +
        '- **Concavidade**: a > 0 abre para cima (tem mínimo); a < 0 abre para baixo (tem máximo).\n' +
        '- **Vértice**: xv = −b/(2a) e yv = −Δ/(4a).\n' +
        '- **Discriminante**: Δ = b² − 4ac.\n' +
        '- **Raízes**: x = (−b ± √Δ)/(2a), a fórmula de Bhaskara. Δ > 0 dá duas raízes, Δ = 0 uma, Δ < 0 nenhuma real.',
    },
    questions: {
      modo: 'questions',
      titulo: 'A parábola ficou clara?',
      conteudo_principal: 'Tente responder antes de abrir a resposta.',
      perguntas: [
        { pergunta: 'Por que a não pode ser zero numa função quadrática?', dica: 'Veja o que sobra da expressão se o termo com x² sumir.', resposta: 'Porque sem o termo ax² a função deixa de ser de segundo grau e vira uma função do primeiro grau.' },
        { pergunta: 'Se a < 0, a parábola tem ponto de máximo ou de mínimo?', dica: 'Pense para onde ela abre.', resposta: 'De máximo, porque ela abre para baixo.' },
        { pergunta: 'Quantas raízes reais existem quando Δ = 0?', dica: 'Veja o que acontece com ±√Δ.', resposta: 'Uma raiz real, chamada de raiz dupla.' },
        { pergunta: 'Qual é o x do vértice de f(x) = x² − 4x + 3?', dica: 'Use xv = −b/(2a) com os coeficientes da função.', resposta: 'xv = −(−4)/(2·1) = 2.' },
      ],
    },
    mindmap: {
      modo: 'mindmap',
      titulo: 'Função quadrática',
      conteudo_principal: 'f(x) = ax² + bx + c, com a ≠ 0, desenha uma parábola.',
      ramos: [
        { ideia: 'Concavidade', detalhes: ['a > 0: abre para cima', 'a < 0: abre para baixo'] },
        { ideia: 'Vértice', detalhes: ['xv = −b/(2a)', 'yv = −Δ/(4a)', 'É o mínimo ou o máximo'] },
        { ideia: 'Discriminante', detalhes: ['Δ = b² − 4ac', 'Diz quantas raízes reais existem'] },
        { ideia: 'Raízes', detalhes: ['x = (−b ± √Δ)/(2a)', 'Δ > 0: duas; Δ = 0: uma; Δ < 0: nenhuma'] },
      ],
    },
  },

  // The video example: what the lesson in the video explains, standing in for the video
  fotossintese: {
    metaphor: {
      modo: 'metaphor',
      titulo: 'A cozinha solar da folha',
      universo_analogia: 'Cozinha',
      conteudo_principal:
        'Pense na folha como uma cozinha que funciona com energia solar. A luz do sol é o fogão ligado (a energia luminosa), ' +
        'a água chega pela raiz como um cano (a água absorvida) e o ar entra pelas janelinhas da folha (o gás carbônico pelos estômatos).\n\n' +
        'Quem cozinha é a clorofila, a cozinheira verde dentro dos cloroplastos. Ela usa a energia do fogão para juntar a água e o ar e ' +
        'preparar um alimento doce (a glicose), que a planta guarda e usa para crescer.\n\n' +
        'Sobra um cheiro que sai pela janela: o oxigênio, que vai para o ar e que nós respiramos.',
      mapeamentos: [
        { termo_tecnico: 'Luz do sol', equivalente_metafora: 'Fogão ligado', explicacao_conexao: 'É a fonte de energia da reação.' },
        { termo_tecnico: 'Clorofila', equivalente_metafora: 'Cozinheira verde', explicacao_conexao: 'Capta a luz e faz a reação acontecer.' },
        { termo_tecnico: 'Gás carbônico e água', equivalente_metafora: 'Ingredientes', explicacao_conexao: 'São o que a planta transforma em alimento.' },
        { termo_tecnico: 'Glicose', equivalente_metafora: 'Alimento doce', explicacao_conexao: 'É a energia guardada que a planta usa.' },
        { termo_tecnico: 'Oxigênio', equivalente_metafora: 'Cheiro que sai pela janela', explicacao_conexao: 'É liberado no ar como resultado.' },
      ],
      pontos_de_atencao: 'A planta não cozinha com calor: a energia vem da luz. A metáfora também não mostra as duas etapas da fotossíntese.',
    },
    checklist: {
      modo: 'checklist',
      titulo: 'Fotossíntese em 5 passos',
      conteudo_principal: 'Você vai entender como a planta produz o próprio alimento a partir da luz.',
      tarefas: [
        { texto: 'Explique com suas palavras o que é a fotossíntese.', tipo: 'escrever',
          trecho: 'A fotossíntese é o processo em que as plantas usam a luz do sol para produzir o próprio alimento.' },
        { texto: 'O que a planta libera no ar durante a fotossíntese?', tipo: 'multipla_escolha',
          trecho: 'No fim, a planta produz glicose e libera oxigênio no ar.',
          opcoes: ['Gás carbônico', 'Oxigênio', 'Nitrogênio'], correta: 1 },
        { texto: 'Coloque as etapas na ordem.', tipo: 'ordenar',
          itens: ['A clorofila capta a luz', 'A planta usa água e gás carbônico', 'Forma-se a glicose', 'O oxigênio é liberado'] },
        { texto: 'Marque a frase que diz onde a fotossíntese acontece.', tipo: 'marcar_no_texto',
          trecho: 'A fotossíntese é o processo em que as plantas usam a luz do sol para produzir o próprio alimento. Ela acontece nos cloroplastos, que ficam principalmente nas folhas. A clorofila, um pigmento verde, capta a energia da luz.',
          frase_certa: 'Ela acontece nos cloroplastos, que ficam principalmente nas folhas.' },
        { texto: 'Explique por que a fotossíntese é importante para os animais.', tipo: 'escrever',
          trecho: 'No fim, a planta produz glicose e libera oxigênio no ar. Esse oxigênio é o que os animais, e nós, respiramos.' },
      ],
    },
    summary: {
      modo: 'summary',
      titulo: 'Fotossíntese: o essencial',
      conteudo_principal:
        '- **O que é**: a planta usa a luz do sol para produzir o próprio alimento.\n' +
        '- **Onde**: nos cloroplastos, principalmente nas folhas.\n' +
        '- **Quem capta a luz**: a clorofila, um pigmento verde.\n' +
        '- **Ingredientes**: água, que vem da raiz, e gás carbônico, que entra pelos estômatos.\n' +
        '- **Resultado**: glicose, que a planta usa como energia, e oxigênio, liberado no ar.',
    },
    questions: {
      modo: 'questions',
      titulo: 'A fotossíntese ficou clara?',
      conteudo_principal: 'Tente responder antes de abrir a resposta.',
      perguntas: [
        { pergunta: 'De onde vem a energia da fotossíntese?', dica: 'Olhe para o céu durante o dia.', resposta: 'Da luz do sol.' },
        { pergunta: 'Qual pigmento capta a luz?', dica: 'É ele que deixa as folhas verdes.', resposta: 'A clorofila.' },
        { pergunta: 'Quais são os dois ingredientes que a planta usa?', dica: 'Um vem pela raiz e o outro pelo ar.', resposta: 'Água e gás carbônico.' },
        { pergunta: 'O que a planta libera no ar?', dica: 'É o gás que respiramos.', resposta: 'Oxigênio.' },
      ],
    },
    mindmap: {
      modo: 'mindmap',
      titulo: 'Fotossíntese',
      conteudo_principal: 'A planta transforma luz, água e gás carbônico em alimento e oxigênio.',
      ramos: [
        { ideia: 'Onde', detalhes: ['Nos cloroplastos', 'Principalmente nas folhas'] },
        { ideia: 'Entra', detalhes: ['Luz do sol', 'Água pela raiz', 'Gás carbônico pelos estômatos'] },
        { ideia: 'Quem faz', detalhes: ['A clorofila capta a luz'] },
        { ideia: 'Sai', detalhes: ['Glicose para a planta', 'Oxigênio para o ar'] },
      ],
    },
  },
};
