# Prompt3D — AI Text-to-3D Web Application

A technical evaluation project that converts a user's natural-language prompt into a 3D model, displays the model in an interactive Three.js viewer, and lets the user download the generated `.glb` file.

## Features

- Text prompt input
- AI text-to-3D generation
- Hugging Face Gradio Space integration
- Interactive Three.js / WebGL viewer
- Rotate with mouse/touch
- Zoom with scroll/pinch
- Automatic model framing
- `.glb` download
- Responsive UI
- React + Vite frontend
- FastAPI backend

## Architecture

```text
User
  |
  v
React + Vite
  |
  | POST /api/generate
  v
FastAPI backend
  |
  | gradio_client
  v
Hugging Face Shap-E Space
  |
  | generated GLB
  v
FastAPI
  |
  | model URL
  v
Three.js GLTFLoader
  |
  v
Interactive 3D model
```

## AI model

This project uses the public `hysts/Shap-E` Hugging Face Space through its Gradio API.

The Space exposes a `text-to-3d` endpoint and produces a 3D model that can be consumed by the application.

## Run locally

### 1. Backend

Open a terminal:

```bash
cd backend

python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Start API:

```bash
uvicorn main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

The frontend automatically uses:

```text
http://localhost:8000
```

unless `VITE_API_URL` is provided.

## Deployment

### Backend — Render

Create a new Web Service from the `backend` folder.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```text
HF_SPACE=hysts/Shap-E
ALLOWED_ORIGINS=https://YOUR-FRONTEND.vercel.app
```

`HF_TOKEN` is optional for the public Space.

### Frontend — Vercel

Create a Vercel project using the `frontend` folder.

Environment variable:

```text
VITE_API_URL=https://YOUR-BACKEND.onrender.com
```

Then deploy.

## GitHub

Recommended repository name:

```text
prompt3d-ai-generator
```

Push both folders:

```bash
git init
git add .
git commit -m "Build AI text-to-3D generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/prompt3d-ai-generator.git
git push -u origin main
```

## Important deployment note

The AI generation is handled by the external Hugging Face Space. Your Render backend acts as a lightweight API/proxy and does not need a GPU.

The generated files are stored temporarily on the backend filesystem. This is intentional for a technical evaluation MVP; they are not intended as permanent asset storage.

## Evaluation flow

1. Enter a prompt.
2. Click Generate 3D.
3. Wait for the Hugging Face generation queue.
4. The generated GLB appears in the Three.js viewer.
5. Rotate and zoom the model.
6. Click Download `.GLB`.

## Example prompts

- A small futuristic sports car
- A cute low-poly penguin
- A medieval treasure chest
- A stylized rocket ship
- A wooden chair with curved legs

## Future improvements

- User accounts and generation history
- Persistent cloud object storage
- Generation progress / queue position
- More AI model providers
- Texture generation
- OBJ/FBX export
- Prompt history
- Model metadata and polygon statistics
