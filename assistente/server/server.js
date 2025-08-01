// assistente/server/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

// IMPORTS CORRETOS DENTRO DA MESMA PASTA 'assistente/server'
import { executaChat } from './chat.js';
import { inicializaChat } from './inicializaChat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Configura o CORS para permitir requisições do seu frontend
app.use(cors({
  // Mudei o 'origin' para a URL do seu site no Vercel
  origin: 'https://mind-ed.vercel.app', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// SERVE OS ARQUIVOS ESTÁTICOS DO FRONTEND.
// 'join(__dirname, '..', '..')' vai dois níveis acima da pasta 'server'
// para chegar na RAIZ do seu projeto (MindED/), onde estão index.html, css/, js/, assets/.
app.use(express.static(join(__dirname, '..', '..'), { extensions: ['html', 'css', 'svg', 'js', 'png'] }));

// Rota inicial para servir o index.html
app.get('/', (req, res) => {
  inicializaChat(); // Chama a função para inicializar o chat Gemini no backend
  res.sendFile(join(__dirname, '..', '..', 'index.html')); // Serve o index.html da raiz
});

// Rota para o frontend enviar mensagens e receber respostas do chatbot
app.post('/chat', async (req, res) => {
  try {
    const mensagem = req.body?.mensagem;
    console.log('Mensagem do usuário', mensagem);

    if (!mensagem) {
      return res.status(400).json({ error: 'Erro no corpo da requisição: mensagem vazia.' });
    }
    const response = await executaChat(mensagem); // Chama a função do backend
    res.json({ response });

  } catch (error) {
    console.error('Erro no endpoint do chat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Rota para o frontend 'iniciar' o chat (só para garantir que a instância do backend esteja pronta)
app.post('/start-chat', (req, res) => {
    inicializaChat(); // Garante que a instância do chat Gemini está pronta
    res.status(200).send({ message: 'Chat backend inicializado ou recuperado.' });
});


// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('Pressione CTRL+C para parar.');
});
