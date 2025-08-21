// assistente/server/chat.js (Este arquivo é para o BACKEND - Servidor Node.js)
// Ele contém a função que interage diretamente com a API do Gemini.

import { chat } from './inicializaChat.js'; // Caminho relativo CORRETO dentro de 'assistente/server'

export async function executaChat(mensagem) {
    console.log("Tamanho do histórico: " + (await chat.getHistory()).length);
    const result = await chat.sendMessage(mensagem);
    const response = await result.response;
    return response.text();
}
