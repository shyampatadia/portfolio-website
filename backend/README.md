# Portfolio Backend API

FastAPI backend for Shyam Patadia's portfolio website.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /api/personal-info` - Personal information
- `GET /api/skills` - Skills and categories
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Development

The API runs on `http://localhost:8000` by default and includes CORS support for the React frontend running on `http://localhost:3000`.