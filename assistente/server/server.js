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
import userRoutes from './routes/userRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Configura o CORS para permitir requisições do seu frontend
app.use(cors({
  origin: 'null', // Permite requisições de arquivos locais (file://)
  // Se for hospedar o site em um domínio, mude para:
  // origin: 'http://seu-dominio.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// SERVE OS ARQUIVOS ESTÁTICOS DO FRONTEND.
// Aponta para a pasta 'static' que agora está dentro de 'assistente'
app.use(express.static(join(__dirname, '..', 'static'), { extensions: ['html', 'css', 'svg', 'js', 'png'] }));

// Rota inicial para servir o index.html
app.get('/', (req, res) => {
  inicializaChat(); // Chama a função para inicializar o chat Gemini no backend
  res.sendFile(join(__dirname, '..', 'static', 'index.html')); // Serve o index.html da nova pasta static
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

// Rotas da API de autenticação
app.use('/api/users', userRoutes);

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log('Pressione CTRL+C para parar.');
});