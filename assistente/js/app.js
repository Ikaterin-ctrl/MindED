window.onload = function() {
    console.log('Script app.js carregado e em execução.');

    const chatbotWindow = document.getElementById('chatbot-window');
    const toggleChatbotBtn = document.getElementById('toggle-chatbot-btn');
    const closeChatbotBtn = document.getElementById('close-chatbot-btn');
    const chatbox = document.getElementById('chatbox');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    if (!chatbotWindow || !toggleChatbotBtn || !closeChatbotBtn || !chatbox || !userInput || !sendBtn) {
        console.error('Um ou mais elementos do DOM não foram encontrados. Verifique os IDs no seu arquivo index.html.');
        return;
    }

    let isChatbotVisible = false;

    const apiUrl = "/chat"; 

    const toggleChatbot = () => {
        isChatbotVisible = !isChatbotVisible;
        chatbotWindow.style.display = isChatbotVisible ? 'flex' : 'none';
        toggleChatbotBtn.style.display = isChatbotVisible ? 'none' : 'flex';
    };

    toggleChatbotBtn.addEventListener('click', toggleChatbot);
    closeChatbotBtn.addEventListener('click', toggleChatbot);

    const addMessage = (sender, message) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerHTML = `<div class="message-text">${message}</div>`;
        chatbox.appendChild(messageElement);
        chatbox.scrollTop = chatbox.scrollHeight;
    };

    const showTypingIndicator = () => {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot', 'typing-indicator');
        typingIndicator.innerHTML = `<div class="message-text"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        chatbox.appendChild(typingIndicator);
        chatbox.scrollTop = chatbox.scrollHeight;
        return typingIndicator;
    };

    const removeTypingIndicator = (indicator) => {
        if (indicator) {
            chatbox.removeChild(indicator);
        }
    };

    const sendMessageToGemini = async (message) => {
        const typingIndicator = showTypingIndicator();
        addMessage('user', message);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: message }) // ✅ payload correto
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erro na resposta da API:', response.status, response.statusText, errorData);
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const botResponse = result.response; // ✅ resposta tratada no backend

            removeTypingIndicator(typingIndicator);
            addMessage('bot', botResponse);

        } catch (error) {
            console.error('Erro ao chamar a API do Gemini:', error);
            removeTypingIndicator(typingIndicator);
            addMessage('bot', "Desculpe, houve um erro ao se comunicar com a IA. Tente novamente mais tarde.");
        }
    };

    addMessage('bot', "Olá! Como posso te ajudar hoje com a acessibilidade ou sobre o MindED?");

    sendBtn.addEventListener('click', async () => {
        const message = userInput.value.trim();
        if (message) {
            userInput.value = '';
            await sendMessageToGemini(message);
        }
    });

    userInput.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter') {
            const message = userInput.value.trim();
            if (message) {
                userInput.value = '';
                await sendMessageToGemini(message);
            }
        }
    });
};
