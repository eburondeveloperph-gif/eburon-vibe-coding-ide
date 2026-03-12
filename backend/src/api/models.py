import os
from typing import Any
import httpx
from fastapi import APIRouter
from vercel.oidc.aio import get_vercel_oidc_token


router = APIRouter(prefix="/api", tags=["models"])


ALLOWED_MODELS: list[str] = [
    "xai/grok-4",
    "eburon/opencode-zen-3.5",
    "eburon/opencode-zen-v2",
    "eburon/opencode-zen-mini",
    "anthropic/claude-sonnet-4.5",
    "anthropic/claude-sonnet-4",
    "anthropic/claude-3.7-sonnet",
    "anthropic/claude-3.5-haiku",
    "xai/grok-4-fast-non-reasoning",
    "openai/gpt-4.1",
    "openai/gpt-4.1-mini",
    "openai/gpt-5",
    "openai/gpt-5-mini",
]


async def get_zen_models() -> list[str]:
    """Placeholder for auto-detecting local Zen models if a service is running."""
    # Assuming Zen models might be exposed on a local inference server
    zen_host = os.getenv("ZEN_HOST", "http://localhost:8000")
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            resp = await client.get(f"{zen_host}/api/models")
            if resp.status_code == 200:
                data = resp.json()
                models = [f"zen/{m['id']}" for m in data.get("models", [])]
                print(f"Discovered Zen models: {models}")
                return models
    except Exception as e:
        print(f"Zen discovery error: {e}")
    return []


async def get_ollama_models() -> list[str]:
    """Attempt to fetch models from a local Ollama instance."""
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{ollama_host}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [f"ollama/{m['name']}" for m in data.get("models", [])]
                print(f"Discovered Ollama models: {models}")
                return models
    except Exception as e:
        print(f"Ollama discovery error: {e}")
    return []


@router.get("/models")
async def list_models() -> dict[str, Any]:
    oidc_token = None
    try:
        oidc_token = await get_vercel_oidc_token()
    except Exception:
        pass

    # Start with our preferred cloud models
    result = list(ALLOWED_MODELS)
    
    # Add local detected models
    ollama_models = await get_ollama_models()
    if ollama_models:
        result.extend(ollama_models)
    
    zen_models = await get_zen_models()
    if zen_models:
        result.extend(zen_models)

    api_key = os.getenv("VERCEL_AI_GATEWAY_API_KEY") or oidc_token

    if not api_key:
        return {"models": result}

    gateway_base = (
        os.getenv("AI_GATEWAY_BASE_URL")
        or os.getenv("OPENAI_BASE_URL")
        or "https://ai-gateway.vercel.sh/v1"
    )

    url = f"{gateway_base.rstrip('/')}/models"
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            # The Gateway might return models in a 'data' field
            available_ids = {
                str(m.get("id")) for m in (data.get("data") or []) if m.get("id")
            }
            if not available_ids:
                return {"models": result}

            # Filter cloud models by what's actually available in the gateway
            intersected = [m for m in ALLOWED_MODELS if m in available_ids]
            
            # Combine with local models that were already added to 'result' but might have been lost if we used intersected directly
            # Actually, let's rebuild the final list
            final_models = intersected
            
            # Add back local models (they are prefixed with ollama/ or zen/)
            local_models = [m for m in result if m.startswith(("ollama/", "zen/"))]
            final_models.extend(local_models)
            
            return {"models": final_models or result}
    except Exception:
        return {"models": result}
