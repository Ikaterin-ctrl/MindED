// assistente/js/app.js (Este arquivo é para o NAVEGADOR - FRONTEND)
// Ele controla a interface do chatbot flutuante e se comunica com o seu backend Node.js.

// Mudei a URL para uma string vazia para que as requisições usem a mesma URL do site (vercel.app)
const BACKEND_URL = ""; 

// Referências aos elementos DOM do chatbot flutuante
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton'); 

// Adiciona event listeners assim que o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    if (sendChatButton) {
        sendChatButton.addEventListener('click', sendMessage);
    } else {
        console.error("Erro: Botão de envio do chat (ID 'sendChatButton') não encontrado no HTML. Verifique seu index.html.");
    }
    
    if (chatInput) {
        chatInput.addEventListener('keyup', function(event) {
            event.preventDefault();
            if (event.key === 'Enter') { 
                sendMessage();
            }
        });
    } else {
        console.error("Erro: Campo de input do chat (ID 'chatInput') não encontrado no HTML. Verifique seu index.html.");
    }
});


// Função para alternar a visibilidade da janela do chatbot
async function toggleChatbot() {
    if (!chatbotWindow) {
        console.error("Erro: Elemento 'chatbotWindow' não encontrado no HTML. O chatbot não pode ser exibido/ocultado. Verifique seu index.html.");
        return;
    }
    
    chatbotWindow.classList.toggle('hidden'); // Alterna a classe 'hidden' para mostrar/esconder

    // Se a janela estiver sendo aberta, tenta iniciar/recuperar o chat no backend
    if (!chatbotWindow.classList.contains('hidden')) {
        // Se a janela de mensagens estiver vazia, significa que é a primeira vez que abrimos o chat nesta sessão.
        if (chatbotMessages && chatbotMessages.children.length === 0) {
            addMessageToChat('Conectando ao assistente...', 'bot-typing'); 
            try {
                // Chama a rota /start-chat do backend para inicializar a instância do Gemini
                const response = await fetch(`${BACKEND_URL}/start-chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const result = await response.json();
                console.log(result.message);

                // Remove o typing indicator
                const typingIndicator = document.querySelector('.message-bubble.bot-typing');
                if (typingIndicator) {
                    typingIndicator.remove();
                }

                // Adiciona a mensagem inicial do bot. Ela vem do histórico configurado no backend.
                // Aqui estamos adicionando uma mensagem padrão para iniciar a UI.
                addMessageToChat("Olá! Estou pronto para ajudar!", 'bot'); 

            } catch (error) {
                console.error("Erro ao iniciar/recuperar chat no backend:", error);
                const typingIndicator = document.querySelector('.message-bubble.bot-typing');
                if (typingIndicator) {
                    typingIndicator.remove();
                }
                addMessageToChat("Não foi possível conectar ao assistente no momento. Verifique se o servidor Node.js está rodando.", 'bot');
            }
        }
        // Foca no input quando o chat é aberto
        chatInput.focus();
    }
}


// Função para enviar uma mensagem para o chatbot (via backend)
async function sendMessage() {
    const message = chatInput.value.trim();
    if (message === "") return;

    addMessageToChat(message, 'user'); // Adiciona a mensagem do usuário ao chat
    chatInput.value = ''; // Limpa o campo de input

    // Desabilita o input e o botão para evitar envios múltiplos
    chatInput.disabled = true;
    sendChatButton.disabled = true;

    addMessageToChat('Digitando...', 'bot-typing');

    try {
        // Envia a mensagem para o backend (rota /chat)
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({'mensagem': message }) 
        });

        const respostaDoBackend = await response.json();

        // Remove o "Digitando..." antes de adicionar a resposta final
        const typingIndicator = document.querySelector('.message-bubble.bot-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }

        if (respostaDoBackend.response) { 
            addMessageToChat(respostaDoBackend.response, 'bot');
        } else if (respostaDoBackend.error) {
            addMessageToChat(`Erro do assistente: ${respostaDoBackend.error}`, 'bot');
            console.error("Erro do backend:", respostaDoBackend.error);
        } else {
            addMessageToChat("Desculpe, não consegui obter uma resposta válida. Tente novamente.", 'bot');
        }

    } catch (error) {
        // Em caso de erro de rede, também remove o "Digitando..."
        const typingIndicator = document.querySelector('.message-bubble.bot-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        addMessageToChat("Ops! Houve um erro de conexão com o servidor. Verifique se o backend está rodando.", 'bot');
        console.error("Erro de rede ou servidor:", error);
    } finally {
        // Este bloco será executado sempre, com sucesso ou erro, garantindo que a UI seja reativada
        // Reabilita o input e o botão
        chatInput.disabled = false;
        sendChatButton.disabled = false;
        chatInput.focus(); // Devolve o foco ao campo de input
    }

    if (chatbotMessages) {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
}

// Função para adicionar uma bolha de mensagem ao chat
function addMessageToChat(text, sender) {
    if (!chatbotMessages) {
        console.error("Erro: Elemento 'chatbotMessages' não encontrado no HTML. Não é possível adicionar a mensagem.");
        return;
    }

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble', sender); 

    if (sender === 'bot-typing') {
        messageBubble.innerHTML = '<i class="fas fa-ellipsis-h animate-pulse"></i>'; 
    } else {
        messageBubble.innerText = text;
    }
    
    chatbotMessages.appendChild(messageBubble); 
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; 
}
