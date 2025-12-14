## Backend API - Portfolio Website

FastAPI backend for managing portfolio content with Supabase database.

### Features

- **Authentication**: JWT-based admin authentication
- **Blog Management**: Create, edit, publish blog posts
- **Content Management**: Manage skills, experience, projects, education, certifications
- **Bookshelf**: Track reading list and reviews
- **RESTful API**: Full CRUD operations for all content types
- **Supabase Integration**: PostgreSQL database with Row Level Security

### Setup

#### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the `supabase_schema.sql` file
3. Get your project URL and API keys from Settings > API

#### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Configuration
SECRET_KEY=generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin Credentials
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your-secure-password

# Environment
ENVIRONMENT=development
```

#### 4. Generate Secret Key

```bash
openssl rand -hex 32
```

### Running Locally

```bash
cd backend
python -m app.main
```

Or with uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Profile
- `GET /api/profile` - Get profile (public)
- `PUT /api/profile` - Update profile (authenticated)

#### Blog
- `GET /api/blog/posts` - List blog posts
- `POST /api/blog/posts` - Create post (authenticated)
- `GET /api/blog/posts/{id}` - Get single post
- `PUT /api/blog/posts/{id}` - Update post (authenticated)
- `DELETE /api/blog/posts/{id}` - Delete post (authenticated)

#### Content (Skills, Experience, Projects, Education, Certifications)
- Similar pattern: GET, POST, PUT, DELETE for each type

#### Books
- `GET /api/books` - List books
- `GET /api/books/stats` - Reading statistics
- `POST /api/books` - Add book (authenticated)
- `PUT /api/books/{id}` - Update book (authenticated)
- `DELETE /api/books/{id}` - Delete book (authenticated)

### Deployment

#### Option 1: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Follow prompts
4. Add environment variables in Vercel dashboard

#### Option 2: Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Run `railway init` in backend directory
3. Run `railway up`
4. Set environment variables: `railway variables`

#### Option 3: Render

1. Create account at render.com
2. New Web Service
3. Connect GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables

### Security Notes

- Never commit `.env` file
- Use strong passwords for admin account
- Rotate SECRET_KEY regularly in production
- Enable HTTPS in production
- Use Supabase Row Level Security policies

### Troubleshooting

**Port already in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Module not found:**
```bash
pip install -r requirements.txt --upgrade
```

**Supabase connection error:**
- Check your URL and keys
- Verify network connectivity
- Check Supabase project status

### Development

Run with hot reload:
```bash
uvicorn app.main:app --reload
```

### Testing

```bash
pytest tests/
```

For more information, see the main [README.md](../README.md) in the project root.
