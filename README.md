# Portfolio Website - Shyam Patadia

A modern, full-stack personal portfolio website with a FastAPI backend and dynamic frontend built with Alpine.js. Features a complete admin panel for content management, RESTful API, and database integration with Supabase.

## Features

- **Full-Stack Architecture**: FastAPI backend with PostgreSQL database (Supabase)
- **Admin Panel**: Secure content management system with JWT authentication
- **Dynamic Content**: All portfolio sections load from database via REST API
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI/UX**: Smooth animations, interactive elements, and clean design
- **Blog Section**: Markdown-based blog with categories and tags
- **Bookshelf**: Track reading progress with statistics
- **Performance Optimized**: Lazy loading, efficient queries, and serverless deployment

## Project Structure

```
portfolio-website/
├── index.html                  # Main portfolio page
├── blog/                       # Blog section
│   └── index.html             # Blog listing page
├── bookshelf/                  # Bookshelf section
│   └── index.html             # Book collection page
├── assets/                     # All static assets
│   ├── css/                   # Modular stylesheets
│   │   ├── base.css          # Base styles and resets
│   │   ├── components.css     # Reusable component styles
│   │   ├── animations.css     # Animation keyframes
│   │   ├── skills_terminal.css # Skills section styling
│   │   ├── utilities.css      # Utility classes
│   │   └── main.css          # Main stylesheet (imports all)
│   ├── js/                    # JavaScript modules
│   │   ├── api.js            # API service layer (backend communication)
│   │   ├── config.js         # Tailwind configuration
│   │   ├── portfolio.js      # Alpine.js main component
│   │   └── app.js            # Navigation and routing logic
│   └── images/                # Image assets
├── backend/                    # FastAPI backend application
│   ├── app/                   # Application code
│   │   ├── main.py           # FastAPI app initialization & routes
│   │   ├── config.py         # Configuration (DB, JWT, environment)
│   │   ├── database.py       # Database connection & session management
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── profile.py
│   │   │   ├── skills.py
│   │   │   ├── experience.py
│   │   │   ├── projects.py
│   │   │   ├── education.py
│   │   │   ├── certifications.py
│   │   │   ├── blog.py
│   │   │   ├── books.py
│   │   │   └── admin.py
│   │   ├── routes/           # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── admin.py      # Admin authentication
│   │   │   ├── content.py    # Portfolio content endpoints
│   │   │   ├── blog.py       # Blog endpoints
│   │   │   └── books.py      # Bookshelf endpoints
│   │   └── schemas/          # Pydantic schemas for validation
│   │       └── ...
│   ├── admin/                 # Admin panel frontend
│   │   ├── index.html        # Admin dashboard
│   │   ├── login.html        # Admin login page
│   │   └── assets/           # Admin panel assets
│   │       ├── css/
│   │       └── js/
│   ├── requirements.txt       # Python dependencies
│   ├── vercel.json           # Vercel deployment config
│   └── migration_insert_data.sql  # Database population script
└── README.md                   # This file
```

## Getting Started

### Prerequisites

**Frontend:**
- A modern web browser (Chrome, Firefox, Safari, Edge)

**Backend:**
- Python 3.9+
- Supabase account (for database and storage)
- Vercel account (for production deployment)

### Quick Start (Local Development)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd portfolio-website
   ```

2. **Set up Supabase**:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the migration SQL files in Supabase SQL Editor (in order):
     1. Database schema setup
     2. Storage setup for images
     3. Insert initial data (optional)
   - Get your Supabase URL and keys from Project Settings → API

3. **Configure Backend**:
   Create a `.env` file in the `backend/` directory:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   JWT_SECRET_KEY=your-secret-key-here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   ```

4. **Install Backend Dependencies**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Run Backend Locally**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Backend will be available at `http://localhost:8000`

6. **Open Frontend**:
   Simply open `index.html` in your browser. The frontend automatically detects:
   - **Local Development**: Uses `http://localhost:8000` when opened from localhost
   - **Production**: Uses Vercel URL when deployed

   No configuration needed! The API URL switches automatically based on environment.

### Deployment

**Backend Deployment to Vercel:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy from backend directory:
   ```bash
   cd backend
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

**Frontend Deployment:**
- Deploy to any static hosting (Netlify, Vercel, GitHub Pages)
- **No API URL configuration needed!** The frontend automatically detects the environment:
  - When accessed via `localhost`, it uses `http://localhost:8000`
  - When accessed via production domain, it uses the production Vercel URL
- To change the production URL, edit `assets/js/app-config.js`

## API Documentation

**Base URL:**
- **Local Development**: `http://localhost:8000` (automatic)
- **Production**: `https://portfolio-website-nine-red-56.vercel.app` (automatic)

The frontend automatically detects and uses the correct URL based on your environment.

### Public Endpoints (No Authentication Required)

#### Blog
- `GET /api/blog/posts` - Get all blog posts
  - Query params: `published_only=true`, `page=1`, `page_size=10`, `category`
  - Returns: `{ posts: [], total: 0, page: 1, page_size: 10 }`
- `GET /api/blog/posts/{post_id}` - Get single blog post by ID
- `GET /api/blog/posts/slug/{slug}` - Get single blog post by slug

#### Bookshelf
- `GET /api/books` - Get all books
  - Query params: `status_filter` (read/reading/to-read), `include_hidden=false`
  - Returns: Array of books
- `GET /api/books/stats` - Get reading statistics
  - Returns: `{ total_read: 0, currently_reading: 0, to_read: 0 }`
- `GET /api/books/{book_id}` - Get single book by ID

### Admin Endpoints (Authentication Required)

**Authentication:**
- `POST /api/auth/login` - Login with username/password
  - Body: `{ username: "admin", password: "your-password" }`
  - Returns: `{ access_token: "jwt-token", token_type: "bearer" }`
- All admin endpoints require `Authorization: Bearer <token>` header

#### Blog Management
- `POST /api/blog/posts` - Create new blog post
- `PUT /api/blog/posts/{post_id}` - Update blog post
- `DELETE /api/blog/posts/{post_id}` - Delete blog post

#### Bookshelf Management
- `POST /api/books` - Add new book
- `PUT /api/books/{book_id}` - Update book
- `DELETE /api/books/{book_id}` - Delete book

#### Storage Management
- `POST /api/storage/upload/blog` - Upload blog image
- `POST /api/storage/upload/book-cover` - Upload book cover image
- `DELETE /api/storage/delete/{path}` - Delete image from storage

### Example API Usage

The frontend uses the centralized API service (`window.api`) which automatically handles environment detection:

```javascript
// Using the API service (recommended)
const blogPosts = await window.api.getBlogPosts({
  published_only: true,
  page: 1,
  page_size: 10
});

const books = await window.api.getBooks();
const stats = await window.api.getBookStats();

// Direct fetch (if needed)
const response = await fetch(`${window.AppConfig.getApiBaseUrl()}/api/blog/posts`);
const data = await response.json();

// Admin login
const loginResponse = await fetch(`${window.AppConfig.getApiBaseUrl()}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'your-password' })
});
const { access_token } = await loginResponse.json();
```

## Development

### Modifying Styles

The CSS is organized into modular files in `assets/css/`:

- **base.css**: Modify foundational styles (typography, resets, base elements)
- **components.css**: Update component-specific styles (cards, buttons, navigation)
- **animations.css**: Add or modify animations and keyframes
- **utilities.css**: Add utility classes and responsive breakpoints

All CSS is imported via `main.css`, which is loaded in the HTML.

### Frontend JavaScript Architecture

JavaScript is organized into modules in `assets/js/`:

- **app-config.js**: Environment detection and API URL configuration
  - Automatically detects localhost vs production
  - Provides `window.AppConfig.getApiBaseUrl()` for environment-aware API calls
- **api.js**: Centralized API service for all backend communication
  - Uses app-config.js to automatically switch between local and production URLs
  - Provides methods: `getBlogPosts()`, `getBooks()`, `getBookStats()`
- **portfolio.js**: Alpine.js component with reactive state and data loading
  - Handles blog and bookshelf data fetching
  - Manages loading states and error handling
- **app.js**: Navigation, routing, and tab management
- **config.js**: Tailwind CSS configuration

### Environment Configuration

The application automatically detects whether it's running locally or in production:

**How it works:**
- `app-config.js` checks `window.location.hostname`
- If hostname is `localhost` or `127.0.0.1`, uses `http://localhost:8000`
- Otherwise, uses the production Vercel URL

**Changing Production URL:**
Edit `assets/js/app-config.js` and update the production URL:
```javascript
getApiBaseUrl() {
  if (this.isDevelopment()) {
    return 'http://localhost:8000';
  } else {
    return 'https://your-production-url.vercel.app';  // Update this
  }
}
```

**Benefits:**
- No manual configuration when switching between development and production
- No need to modify code before commits or deployments
- Works seamlessly when opening `index.html` directly or via a local server

### Updating Skills

Skills are managed via a simple JSON file for easy updates when your resume changes:

**To update your skills:**

1. Edit `assets/data/skills.json`
2. Add, remove, or modify skills in any category:
   ```json
   {
     "languages": ["Python", "JavaScript", "Your New Language"],
     "ai": ["LLMs", "RAG Architecture", "New AI Tool"],
     "testing": ["Selenium", "Playwright"],
     "cloud": ["AWS", "Docker", "Kubernetes"],
     "data": ["PostgreSQL", "MongoDB"],
     "backend": ["FastAPI", "Django"]
   }
   ```
3. Save the file
4. Refresh your website - changes appear immediately!

**No code changes needed** - just edit the JSON file and your skills section updates automatically.

**Categories:**
- `languages`: Programming languages
- `ai`: AI/ML tools and frameworks
- `testing`: Testing frameworks and tools
- `cloud`: Cloud platforms and DevOps tools
- `data`: Databases and data tools
- `backend`: Backend frameworks

### Adding Content via Admin Panel

All content can be managed through the admin panel:

1. Start your backend locally or access your deployed backend
2. Navigate to `/admin/index.html` (or `/admin/login.html` if not logged in)
3. Login with your admin credentials (configured in `.env`)
4. Use the dashboard to add/edit/delete:
   - **Blog posts**: Create, update, publish/unpublish posts
   - **Books**: Add books, update reading status, upload cover images

**Admin Features:**
- JWT-based authentication
- Image upload for blog posts and book covers (stored in Supabase Storage)
- Rich text content editing
- Published/draft status management for blog posts
- Reading status tracking for books (read, reading, to-read)

### Adding Content Programmatically

Use the API endpoints with authentication:

```javascript
// Example: Add a new blog post
const token = 'your-jwt-token';
const newPost = {
  title: 'My First Blog Post',
  slug: 'my-first-blog-post',
  content: 'This is the content of my blog post...',
  excerpt: 'A short summary',
  cover_image: 'https://example.com/image.jpg',
  category: 'Technology',
  published: true
};

await fetch(`${window.AppConfig.getApiBaseUrl()}/api/blog/posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(newPost)
});
```

## Portfolio Sections

### Main Portfolio (`/index.html`)

The portfolio is a single-page application with multiple sections:

**Static Sections** (content embedded in HTML):
- **Summary**: Professional overview and introduction
- **Skills**: Technical skills organized by categories (Languages, AI/ML, Testing, Cloud, Data, Backend)
  - Terminal/code editor aesthetic with proficiency indicators
- **Experience**: Professional work history with date ranges
- **Education**: Academic background
- **Projects**: Notable projects with descriptions and links
- **Certifications**: Professional certifications

**Dynamic Sections** (loaded from Supabase via API):
- **Blog**: Latest blog posts with excerpts
  - Loads published posts from API
  - Shows post title, excerpt, read time, and published date
  - Responsive card layout
- **Bookshelf**: Reading list with book covers
  - Displays books with status (read, reading, to-read)
  - Shows reading statistics
  - Book covers loaded from Supabase Storage

## Customization

### Colors and Theme

Update colors in `assets/js/config.js`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { /* your colors */ },
        secondary: { /* your colors */ }
      }
    }
  }
};
```

### Profile Information

Update profile via the admin panel or directly through the API:
- Personal information
- Bio and summary
- Social media links
- Contact information

### Adding New Sections

To add new sections to the main page:

1. Create database model in `backend/app/models/`
2. Add API routes in `backend/app/routes/`
3. Update admin panel with CRUD interface
4. Add tab button in navigation (`index.html`)
5. Create section template with Alpine.js directives
6. Update `portfolio.js` to fetch data from API

## Performance Optimization

**Frontend:**
- **Lazy Loading**: Images use lazy loading via Intersection Observer
- **Modular CSS**: Only load what you need
- **CDN Resources**: External libraries loaded from CDNs
- **Parallel Data Fetching**: All API calls made concurrently with Promise.all()
- **Loading States**: Smooth loading overlays for better UX

**Backend:**
- **Serverless Deployment**: Vercel serverless functions for auto-scaling
- **Database Connection Pooling**: SQLAlchemy connection pooling
- **Efficient Queries**: Optimized database queries with proper indexing
- **CORS Optimization**: Proper CORS headers for cross-origin requests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

**Frontend:**
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid
- **Tailwind CSS**: Utility-first CSS framework
- **Alpine.js**: Lightweight reactive JavaScript framework
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

**Backend:**
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Relational database (via Supabase)
- **Pydantic**: Data validation and settings management
- **JWT**: JSON Web Tokens for authentication
- **Uvicorn**: ASGI server
- **Vercel**: Serverless deployment platform

## Database Schema

The database includes the following tables:
- **profile**: Personal information and bio
- **skills**: Technical skills with categories and proficiency levels
- **experience**: Work history with date ranges
- **projects**: Portfolio projects with descriptions and links
- **education**: Academic background
- **certifications**: Professional certifications
- **blog_posts**: Blog articles with markdown content
- **blog_categories**: Blog post categories
- **blog_tags**: Blog post tags
- **books**: Reading list with ratings and reviews
- **admin_users**: Admin authentication

## Current Implementation Status

**Completed:**
- ✅ Full backend API with FastAPI
- ✅ Database integration with Supabase
- ✅ Admin panel with JWT authentication
- ✅ Skills section dynamic rendering
- ✅ API service layer for frontend
- ✅ Loading states and error handling
- ✅ CORS configuration for deployment
- ✅ Dark/light theme toggle
- ✅ Responsive design

**In Progress:**
- 🔄 Dynamic rendering for Experience section
- 🔄 Dynamic rendering for Projects section
- 🔄 Dynamic rendering for Education section
- 🔄 Dynamic rendering for Certifications section
- 🔄 Blog content population
- 🔄 Bookshelf content population

**Future Enhancements:**
- [ ] Full-text search for blog posts
- [ ] RSS feed for blog
- [ ] Markdown editor in admin panel
- [ ] Image upload functionality
- [ ] Analytics dashboard
- [ ] Contact form with email integration
- [ ] Resume download functionality
- [ ] Social media integration

## License

© 2025 Shyam Patadia. All rights reserved.

## Contact

- Email: shyampatadia22@gmail.com
- LinkedIn: [linkedin.com/in/shyampatadia](https://www.linkedin.com/in/shyampatadia/)
- GitHub: [github.com/shyampatadia](https://github.com/shyampatadia)

---

**Note**: This is a static website. For dynamic features like blog comments or contact forms, you'll need to integrate backend services or third-party APIs.
