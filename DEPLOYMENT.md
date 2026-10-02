# Deployment checklist

## Backend
1. Push repository to GitHub.
2. In Render, create a Web Service.
3. Set root directory to `backend`.
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add:
   - `HF_SPACE=hysts/Shap-E`
   - `ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app`
7. Deploy.
8. Test `https://YOUR-RENDER-DOMAIN.onrender.com/health`.

## Frontend
1. In Vercel, import the same GitHub repository.
2. Set root directory to `frontend`.
3. Add environment variable:
   `VITE_API_URL=https://YOUR-RENDER-DOMAIN.onrender.com`
4. Deploy.
5. Open the Vercel URL and test a prompt.

## Before submission
- Generate at least two different objects.
- Rotate and zoom both models.
- Test `.glb` download.
- Test on phone and laptop.
- Put both live links in README.
- Confirm GitHub repository is accessible.
