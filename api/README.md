# MindED — API Backend

FastAPI backend for the MindED cognitive adaptation engine.

## Setup

```bash
# 1. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# → Edit .env and paste your GEMINI_API_KEY

# 4. Run the server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Endpoints

| Method | Path      | Description                          |
|--------|-----------|--------------------------------------|
| GET    | `/health` | Health check                         |
| POST   | `/adapt`  | Submit text for cognitive adaptation |

## Request body (`POST /adapt`)

```json
{
  "texto": "Cole aqui o texto a adaptar (mín. 10 chars)",
  "modo": "metaphor",
  "perfil": "TDAH/Iniciante"
}
```

`modo` accepts: `"metaphor"` · `"checklist"` · `"summary"`

## Interactive docs

Open `http://127.0.0.1:8000/docs` for the auto-generated Swagger UI.

## Security notes

- GEMINI_API_KEY is read from environment variables, never hard-coded.
- CORS is restricted to `localhost` origins only.
- Server binds to `127.0.0.1` — not exposed to the network.
