
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para o login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  console.log(`Tentativa de login com email: ${email}`);
  // Lógica de autenticação (a ser implementada)
  res.send('Login recebido');
});

// Rota para o cadastro
app.post('/cadastrar', (req, res) => {
  const { nome, email, senha } = req.body;
  console.log(`Tentativa de cadastro com email: ${email}`);
  // Lógica de cadastro (a ser implementada)
  res.send('Cadastro recebido');
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
