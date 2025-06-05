# Documentation

This document provides additional details about the project's structure and development workflow.

## Project Structure
- `index.html` – root HTML file that loads React and the application script.
- `template.html` – original portfolio markup included at runtime by React.
- `app.js` – React application that fetches the template and handles blog logic.
- `css/` – styles for the portfolio.
- `backend/` – FastAPI service containing `main.py` and dependency list.

## Running Locally
1. Install Python dependencies as described in the project README.
2. Start the FastAPI server with `uvicorn main:app --port 8000`.
3. Serve the static files via `python3 -m http.server 8080` from the repository root.
4. Open your browser to `http://localhost:8080` to interact with the site and blog API.

## Adding Posts
After logging in with the default credentials (`admin`/`password`), you can create new posts from the blog section. They will be displayed immediately. Posts are stored in memory only; restarting the backend clears them.

## Customization
The static portfolio layout is kept in `template.html`. To update content or styling without touching the React code, modify this template directly.
