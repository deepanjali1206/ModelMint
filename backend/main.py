import os
import shutil
import tempfile
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from gradio_client import Client

load_dotenv()

SPACE_ID = os.getenv("HF_SPACE", "hysts/Shap-E")
HF_TOKEN = os.getenv("HF_TOKEN")

app = FastAPI(
    title="Prompt3D API",
    version="1.0.0",
    description="Text-to-3D generation API using Hugging Face."
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GENERATED_DIR = Path(tempfile.gettempdir()) / "prompt3d_models"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)


class GenerateRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=2,
        max_length=500
    )


def get_client():
    return Client(SPACE_ID)


def extract_file_path(result):
    if isinstance(result, str):
        return result

    if isinstance(result, dict):
        for key in ["path", "name", "url"]:
            value = result.get(key)

            if isinstance(value, str):
                return value

    if isinstance(result, (list, tuple)):
        if len(result) > 0:
            return extract_file_path(result[0])

    raise RuntimeError(
        "Unexpected model output: "
        + str(type(result))
    )


@app.get("/")
def root():
    return {
        "name": "Prompt3D API",
        "status": "ok",
        "model_space": SPACE_ID
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/api/generate")
def generate(request: GenerateRequest):
    prompt = request.prompt.strip()

    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="Prompt cannot be empty."
        )

    try:
        client = get_client()

        seed = int.from_bytes(
            os.urandom(4),
            "big"
        ) % 10000000

        result = client.predict(
            prompt,
            seed,
            15.0,
            64,
            api_name="/text-to-3d"
        )

        source_path = Path(
            extract_file_path(result)
        )

        if not source_path.exists():
            raise RuntimeError(
                "Generated file was not found: "
                + str(source_path)
            )

        model_id = uuid.uuid4().hex

        destination = (
            GENERATED_DIR /
            (model_id + ".glb")
        )

        shutil.copyfile(
            source_path,
            destination
        )

        return {
            "success": True,
            "model_url": "/api/models/" + model_id,
            "download_url": "/api/models/" + model_id,
            "format": "glb",
            "prompt": prompt
        }

    except Exception as exc:
        print(
            "Generation error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=502,
            detail=str(exc)
        )


@app.get("/api/models/{model_id}")
def get_model(model_id: str):
    if not model_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid model id."
        )

    model_path = (
        GENERATED_DIR /
        (model_id + ".glb")
    )

    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Model not found or expired."
        )

    return FileResponse(
        model_path,
        media_type="model/gltf-binary",
        filename="generated-model.glb"
    )