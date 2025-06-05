# Portfolio Website

This project contains a single-page portfolio with a simple blog backend. The front-end is written in React and served as a static site. A small FastAPI service provides endpoints for authentication and blog posts.

## Requirements
- Python 3.10+
- `pip` for installing Python packages

## Setup
Install dependencies for the backend:

```bash
cd backend
pip install -r requirements.txt
```

Run the FastAPI server:

```bash
uvicorn main:app --port 8000
```

In another terminal, serve the static front-end files from the repository root:

```bash
python3 -m http.server 8080
```

Visit `http://localhost:8080` to view the site. The blog section communicates with the backend running on port 8000.

## Usage
- Log in with username `admin` and password `password`.
- Create blog posts via the form in the blog section. Posts appear under the form after submission.

The project preserves the original look and feel of the portfolio by loading `template.html` into the React application.
