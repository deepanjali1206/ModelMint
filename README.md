# ModelMint — AI Text-to-3D Web Application

**From words to worlds.**

ModelMint is an AI-powered web application that turns a natural-language description into a 3D model. Users can describe an object, generate its 3D model, explore it using an interactive Three.js viewer, and download the result as a `.glb` file.

## Features

- Text prompt input
- AI-powered text-to-3D generation
- Hugging Face Gradio Space integration
- Interactive Three.js / WebGL viewer
- Rotate with mouse or touch
- Zoom with scroll or pinch
- Automatic model framing
- `.glb` download
- Responsive UI
- React + Vite frontend
- FastAPI backend

## How It Works

```text
User
  |
  v
Describe an idea
  |
  v
React + Vite
  |
  | POST /api/generate
  v
FastAPI Backend
  |
  | gradio_client
  v
Hugging Face Shap-E
  |
  | Generated 3D Model
  v
FastAPI
  |
  | Model URL
  v
Three.js + GLTFLoader
  |
  v
Interactive 3D Model
