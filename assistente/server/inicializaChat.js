// assistente/server/inicializaChat.js
// O pacote 'dotenv' é apenas para o ambiente de desenvolvimento local.
// No Vercel, as variáveis de ambiente são lidas automaticamente, então não precisamos do dotenv.
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use a variável de ambiente em vez da chave hardcoded para segurança.
// A chave será configurada no painel do Vercel.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

const chat = model.startChat({
    history: [
    {
        role: "user",
        parts: [{ text: "Você é o Assistente MindED, um chatbot amigável e focado em educação personalizada e acessibilidade. Seu objetivo é ajudar usuários com dúvidas sobre o MindED, suas preferências de aprendizado e perfil cognitivo. Não se identifique como 'Jordi' ou 'Jornada Viagens' e não inicie a conversa pedindo nome e e-mail. Sempre seja útil e acolhedor." }],
    },
    {
        role: "model",
        parts: [{ text: "Olá! Seja bem-vindo(a) ao MindED. Como posso te ajudar hoje com suas dúvidas sobre acessibilidade, sobre o uso da plataforma ou sobre como personalizar seu aprendizado?" }],
    },
    ],
    generationConfig: {
    maxOutputTokens: 1000,
    },
});


function inicializaChat () {
    console.log("Chat Gemini inicializado para MindED.");
}

export { chat, inicializaChat}
