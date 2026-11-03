# MindED

**Estação cognitiva para neurodivergentes.** Adapta textos densos em metáforas do cotidiano, microtarefas acionáveis ou resumos semânticos de alto contraste — usando IA generativa (Claude, da Anthropic) e um design acessível.

Nasceu como projeto de Iniciação Científica sobre acessibilidade cognitiva. Evoluiu para um produto open-source.

---

## O problema

Pessoas neurodivergentes (TDAH, dislexia, autismo) e estudantes lidando com conteúdos técnicos densos frequentemente encontram:

- **Sobrecarga de memória de trabalho** — conceitos abstratos sem âncora contextual
- **Paralisia por excesso de informação** — dificuldade em decompor um assunto em etapas
- **Fadiga visual** — interfaces poluídas que causam dispersão imediata

## A solução

Cinco lentes de assimilação do mesmo conteúdo:

| Modo | O que faz |
|---|---|
| 🧠 **Metáfora** | Converte a teoria em analogia do cotidiano com tabela termo → metáfora e alerta de limitações |
| ✅ **Microtarefas** | Gera checklist sequencial e gamificado com barra de progresso em tempo real |
| 📋 **Resumo Semântico** | Sintetiza em tópicos com palavras-chave em negrito para leitura dinâmica |
| ❓ **Perguntas** | Gera perguntas com dica e resposta; as perguntas avaliadas voltam em revisão espaçada |
| 🗺️ **Mapa de ideias** | Põe o tema no centro e organiza as ideias ligadas a ele, cada uma com seus detalhes |

---

## Estrutura do projeto

```
MindED/
├── index.html          # Landing page
├── workspace.html      # Workspace principal (estrutura da página)
├── preferencias.html   # Preferências e controle dos dados locais
├── termos.html         # Termos de Uso
├── privacidade.html    # Política de Privacidade
├── src/
│   ├── css/
│   │   ├── base.css      # Design system (tokens, botões, cabeçalho)
│   │   └── workspace.css # Estilos do workspace
│   └── js/
│       ├── workspace.js  # Lógica do workspace (modos, histórico, revisão, foco)
│       ├── account.js    # Separa os dados locais por conta
│       ├── theme.js      # Aplica o tema antes da primeira pintura
│       └── demo-data.js  # Resultados prontos da demonstração sem login
│   └── vendor/pdfjs/     # pdf.js 5.4.394, servido pelo próprio site
├── api/
│   ├── main.py         # FastAPI — /adapt, /explain e /extract-url
│   ├── test_main.py    # Testes da API (pytest)
│   ├── Dockerfile      # Imagem para publicar a API
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md       # Instruções detalhadas do backend
├── img/
│   └── logominded.png
```

---

## Início rápido

### Frontend

Abra qualquer HTML diretamente no navegador ou sirva com um servidor local:

```bash
# Python
python3 -m http.server 5500

# Node
npx serve .
```

Acesse `http://localhost:5500`.

### Backend (API Python)

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # adicione sua ANTHROPIC_API_KEY
# para testar sem login Firebase, adicione AUTH_DISABLED=true ao .env
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

A API sobe em `http://127.0.0.1:8000`. Documentação interativa: `/docs`.

Testes: `pip install pytest && pytest test_main.py`.

### Publicação

O frontend está no Firebase Hosting; a API precisa de um host próprio (a imagem de `api/Dockerfile` serve para isso). Depois de publicar:

1. Defina no host a `ANTHROPIC_API_KEY` (de console.anthropic.com) — e nunca `AUTH_DISABLED`.
2. Preencha `PROD_API_BASE` no `workspace.html` com a URL pública da API.
3. Se usar outro domínio no frontend, inclua-o em `ALLOWED_ORIGINS`.
4. Preencha os campos `[PREENCHER: ...]` de `termos.html` e `privacidade.html` e faça revisão jurídica.
5. No Firebase, em Authentication → Sign-in method, ative **Google**, **E-mail/senha** e **Anônimo**.
   O anônimo é o que permite testar com o próprio conteúdo sem criar conta (até `GUEST_DAILY_REQUESTS`
   usos por dia, textos de até `GUEST_MAX_CHARS` caracteres e sem vídeo).

> **Obter a chave do Claude:** crie em [console.anthropic.com](https://console.anthropic.com) e defina `ANTHROPIC_API_KEY`. O uso da API é cobrado à parte: um plano Claude.ai (Pro ou Max) não inclui acesso à API.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML + CSS (Design System próprio) + Vanilla JS |
| Backend | Python · FastAPI · Pydantic v2 |
| IA | Claude, da Anthropic (modelo configurável em `CLAUDE_MODEL`, padrão `claude-opus-5-5`) |
| Design | Preto e roxo com toques de pixel art · Atkinson Hyperlegible + Bricolage Grotesque + Pixelify Sans · WCAG AA |

---

## API — contrato

`POST /adapt`

```json
{
  "texto": "Cole aqui o conteúdo a adaptar (mín. 10 chars)",
  "modo": "metaphor",
  "perfil": "TDAH/Iniciante"
}
```

`modo` aceita: `metaphor` · `checklist` · `summary` · `questions` · `mindmap`

No `checklist`, cada item de `tarefas` tem um `tipo` (`escrever`, `multipla_escolha`, `ordenar`, `marcar_no_texto`)
e o `trecho` do texto que usa; `passos_acao` traz só os textos, para quem precisa da lista simples.

Links de vídeo do YouTube (`video_url`) recebem uma mensagem pedindo a transcrição: o Claude lê texto, não vídeos.

As chamadas exigem `Authorization: Bearer <Firebase ID token>`.

`POST /explain` explica um trecho selecionado do resultado (`trecho`, `contexto`, `perfil`).

`POST /check` dá um retorno curto sobre a resposta escrita num passo (`tarefa`, `resposta`, `trecho`, `contexto`, `perfil`)
e devolve `avaliacao` (`certo`, `quase` ou `revisar`), `comentario` e `dica`.

Resposta completa segue o schema `AdaptationResponse` em [`api/main.py`](api/main.py).

---

## Segurança

- `ANTHROPIC_API_KEY` exclusivamente via variável de ambiente — nunca hardcoded
- Token do Firebase verificado no servidor em todas as rotas que usam IA ou buscam links
- Limites por usuário, por minuto e por dia (por processo, reiniciam com o servidor)
- O nome do perfil (TDAH, autismo etc.) não chega à IA: a API o converte em orientações de escrita
- `/extract-url` bloqueia endereços internos, inclusive em redirecionamentos
- CORS restrito às origens em `ALLOWED_ORIGINS`
- A chave `apiKey` do Firebase no frontend é pública por definição; a proteção vem das regras e dos domínios autorizados

---

## Licença

[MIT](LICENSE) — livre para usar, estudar e contribuir.
