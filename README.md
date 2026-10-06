# MindED

**Estação cognitiva para neurodivergentes.** Adapta textos densos em metáforas do cotidiano, microtarefas acionáveis ou resumos semânticos de alto contraste — usando IA generativa (Gemini) e um design glassmorphism acessível.

Nasceu como projeto de Iniciação Científica sobre acessibilidade cognitiva. Evoluiu para um produto open-source.

---

## Demonstração visual

| Modo Metáfora | Modo Microtarefas |
|:---:|:---:|
| ![Workspace — Modo Metáfora](docs/demo-metaphor.svg) | ![Workspace — Modo Microtarefas](docs/demo-checklist.svg) |

---

## O problema

Pessoas neurodivergentes (TDAH, dislexia, autismo) e estudantes lidando com conteúdos técnicos densos frequentemente encontram:

- **Sobrecarga de memória de trabalho** — conceitos abstratos sem âncora contextual
- **Paralisia por excesso de informação** — dificuldade em decompor um assunto em etapas
- **Fadiga visual** — interfaces poluídas que causam dispersão imediata

## A solução

Três lentes de assimilação do mesmo conteúdo:

| Modo | O que faz |
|---|---|
| 🧠 **Metáfora** | Converte a teoria em analogia do cotidiano com tabela termo → metáfora e alerta de limitações |
| ✅ **Microtarefas** | Gera checklist sequencial e gamificado com barra de progresso em tempo real |
| 📋 **Resumo Semântico** | Sintetiza em tópicos com palavras-chave em negrito para leitura dinâmica |

---

## Estrutura do projeto

```
MindED/
├── index.html          # Landing page
├── workspace.html      # Workspace principal (two-column layout)
├── preferencias.html   # Onboarding de perfil cognitivo
├── src/
│   └── css/
│       └── base.css    # Design system completo (tokens, glass, botões, header)
├── api/
│   ├── main.py         # FastAPI — endpoint POST /adapt
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md       # Instruções detalhadas do backend
├── img/
│   └── logominded.png
└── docs/
    ├── demo-metaphor.svg
    └── demo-checklist.svg
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
cp .env.example .env   # adicione sua GEMINI_API_KEY
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

A API sobe em `http://127.0.0.1:8000`. Documentação interativa: `/docs`.

> **Obter chave Gemini:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — gratuito.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML + CSS (Design System próprio) + Vanilla JS |
| Backend | Python · FastAPI · Pydantic v2 |
| IA | Google Gemini 1.5 Flash |
| Design | Glassmorphism dark · Inter + Outfit · WCAG AA |

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

`modo` aceita: `metaphor` · `checklist` · `summary`

Resposta completa segue o schema `AdaptationResponse` em [`api/main.py`](api/main.py).

---

## Segurança

- `GEMINI_API_KEY` exclusivamente via variável de ambiente — nunca hardcoded
- Servidor API vincula apenas `127.0.0.1` — não exposto à rede
- CORS restrito a origens `localhost`

---

## Licença

MIT — livre para usar, estudar e contribuir.
