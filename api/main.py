"""
MindED — FastAPI Backend
Adaptive cognition engine: metaphor, checklist, and semantic summary modes.
"""
from __future__ import annotations

import os
import json
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env file from api directory or workspace if present
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

app = FastAPI(
    title="MindED API",
    description="Adaptive cognitive content engine for neurodivergent learners.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:5501", "http://127.0.0.1:5501", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class MetaphorMapping(BaseModel):
    termo_tecnico: str = Field(description="O conceito original complexo")
    equivalente_metafora: str = Field(description="O elemento correspondente na analogia")
    explicacao_conexao: str = Field(description="Por que essa correspondência é precisa")


class AdaptationRequest(BaseModel):
    texto: str = Field(..., min_length=10, description="Texto original a ser adaptado")
    modo: Literal["metaphor", "checklist", "summary"] = "metaphor"
    perfil: Optional[str] = "TDAH/Iniciante"


class AdaptationResponse(BaseModel):
    modo: Literal["metaphor", "checklist", "summary"]
    titulo: str
    universo_analogia: Optional[str] = None
    conteudo_principal: str
    mapeamentos: Optional[List[MetaphorMapping]] = None
    passos_acao: Optional[List[str]] = None
    pontos_de_atencao: Optional[str] = None


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------
def _build_prompt(req: AdaptationRequest) -> str:
    perfil = req.perfil or "TDAH/Iniciante"

    if req.modo == "metaphor":
        return f"""Você é um educador especialista em acessibilidade cognitiva.
Perfil do estudante: {perfil}

Texto a adaptar:
\"\"\"
{req.texto}
\"\"\"

Responda EXCLUSIVAMENTE em JSON válido com este schema exato:
{{
  "titulo": "título criativo para a adaptação",
  "universo_analogia": "domínio da metáfora (ex: Culinária, Trânsito, Cinema)",
  "conteudo_principal": "narrativa explicativa da metáfora em 2-3 parágrafos",
  "mapeamentos": [
    {{"termo_tecnico": "...", "equivalente_metafora": "...", "explicacao_conexao": "..."}}
  ],
  "pontos_de_atencao": "o que a metáfora NÃO cobre — limitações importantes"
}}"""

    if req.modo == "checklist":
        return f"""Você é um especialista em aprendizado ativo e acessibilidade cognitiva.
Perfil do estudante: {perfil}

Texto a adaptar:
\"\"\"
{req.texto}
\"\"\"

Responda EXCLUSIVAMENTE em JSON válido com este schema exato:
{{
  "titulo": "título motivador para o checklist",
  "conteudo_principal": "breve introdução do que será aprendido (1 parágrafo)",
  "passos_acao": [
    "Passo 1: ação específica e mensurável",
    "Passo 2: ...",
    "Passo 3: ...",
    "... (entre 5 e 10 passos)"
  ]
}}"""

    # summary
    return f"""Você é um especialista em síntese cognitiva e clareza textual.
Perfil do estudante: {perfil}

Texto a adaptar:
\"\"\"
{req.texto}
\"\"\"

Responda EXCLUSIVAMENTE em JSON válido com este schema exato:
{{
  "titulo": "título claro e direto do resumo",
  "conteudo_principal": "resumo em tópicos usando markdown — bullets com **palavra-chave** em negrito no início de cada ponto"
}}"""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "MindED API v1"}


@app.post("/adapt", response_model=AdaptationResponse)
async def adapt(req: AdaptationRequest) -> AdaptationResponse:
    if not client:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY not configured. Set the environment variable and restart.",
        )

    prompt = _build_prompt(req)

    try:
        result = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
                response_mime_type="application/json",
            ),
        )
        raw = result.text.strip()
        # Strip markdown code fences if the model wraps output
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Model returned invalid JSON: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return AdaptationResponse(modo=req.modo, **data)
