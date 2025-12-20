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
- A local web server (optional, for development)

**Backend:**
- Python 3.9+
- PostgreSQL database (Supabase recommended)
- Vercel account (for deployment)

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd portfolio-website
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js (http-server)
   npx http-server

   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000` in your browser

### Backend Setup

1. **Set up Supabase Database**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Note your database URL and password
   - The schema will be created automatically by SQLAlchemy

2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   SECRET_KEY=your-secret-key-here
   ENVIRONMENT=development
   ```

3. **Install Dependencies**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Populate Database**:
   Run the migration script to populate initial data:
   ```bash
   # Connect to your Supabase database and run:
   psql -h your-host -U postgres -d your-database -f migration_insert_data.sql
   ```

5. **Run Locally**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Backend will be available at `http://localhost:8000`

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
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `ENVIRONMENT=production`

**Frontend Deployment:**
- Deploy to any static hosting (Netlify, Vercel, GitHub Pages)
- Update API URL in `assets/js/api.js` to your deployed backend URL

## API Documentation

**Base URL:** `https://portfolio-website-nine-red-56.vercel.app`

### Public Endpoints (No Authentication Required)

#### Portfolio Content
- `GET /api/content/profile` - Get profile information
- `GET /api/content/skills` - Get all skills
- `GET /api/content/experience` - Get work experience
- `GET /api/content/projects` - Get projects
- `GET /api/content/education` - Get education history
- `GET /api/content/certifications` - Get certifications

#### Blog
- `GET /api/blog/posts` - Get all blog posts (supports pagination & filtering)
  - Query params: `published_only`, `category`, `tag`, `page`, `page_size`
- `GET /api/blog/posts/{id}` - Get single blog post
- `GET /api/blog/categories` - Get all blog categories
- `GET /api/blog/tags` - Get all blog tags

#### Bookshelf
- `GET /api/books` - Get all books (supports status filter)
  - Query params: `status_filter` (read/reading/to-read)
- `GET /api/books/stats` - Get reading statistics
- `GET /api/books/{id}` - Get single book

### Admin Endpoints (Authentication Required)

**Authentication:**
- `POST /api/admin/login` - Login with username/password, returns JWT token
- All admin endpoints require `Authorization: Bearer <token>` header

#### Content Management
- `POST /api/content/skills` - Create new skill
- `PUT /api/content/skills/{id}` - Update skill
- `DELETE /api/content/skills/{id}` - Delete skill
- Similar CRUD endpoints exist for: experience, projects, education, certifications

#### Blog Management
- `POST /api/blog/posts` - Create new blog post
- `PUT /api/blog/posts/{id}` - Update blog post
- `DELETE /api/blog/posts/{id}` - Delete blog post
- `PUT /api/blog/posts/{id}/publish` - Publish blog post
- `PUT /api/blog/posts/{id}/unpublish` - Unpublish blog post

#### Bookshelf Management
- `POST /api/books` - Add new book
- `PUT /api/books/{id}` - Update book
- `DELETE /api/books/{id}` - Delete book
- `PUT /api/books/{id}/status` - Update reading status

### Example API Usage

```javascript
// Fetch all skills
const skills = await fetch('https://portfolio-website-nine-red-56.vercel.app/api/content/skills')
  .then(res => res.json());

// Fetch blog posts with pagination
const posts = await fetch('https://portfolio-website-nine-red-56.vercel.app/api/blog/posts?published_only=true&page=1&page_size=10')
  .then(res => res.json());

// Admin login
const response = await fetch('https://portfolio-website-nine-red-56.vercel.app/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password' })
});
const { access_token } = await response.json();
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

- **api.js**: Centralized API service for all backend communication
- **portfolio.js**: Alpine.js component with reactive state and data loading
- **app.js**: Navigation, routing, and tab management
- **config.js**: Tailwind CSS configuration

### Adding Content via Admin Panel

All content can be managed through the admin panel:

1. Navigate to `/backend/admin/login.html`
2. Login with admin credentials
3. Use the dashboard to add/edit/delete:
   - Skills
   - Experience
   - Projects
   - Education
   - Certifications
   - Blog posts
   - Books

### Adding Content Programmatically

Use the API endpoints with authentication:

```javascript
// Example: Add a new skill
const token = 'your-jwt-token';
const newSkill = {
  name: 'React',
  category: 'frontend',
  proficiency: 4,
  icon_class: 'fab fa-react'
};

await fetch('https://your-backend-url/api/content/skills', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(newSkill)
});
```

## Portfolio Sections

### Main Portfolio (`/index.html`)
All sections are dynamically loaded from the database via API:

- **Summary**: Professional overview and introduction
- **Skills**: Technical skills organized by 6 categories (Languages, AI/ML, Testing, Cloud, Data, Backend)
  - Terminal/code editor aesthetic with proficiency indicators
  - Dynamic rendering with Alpine.js
- **Experience**: Professional work history with date ranges
- **Education**: Academic background
- **Projects**: Notable projects with descriptions and links
- **Certifications**: Professional certifications

### Blog (`/blog/index.html`)
- Markdown-based blog posts with syntax highlighting
- Category and tag organization
- Published/draft status management
- Pagination support
- Admin panel for content creation

### Bookshelf (`/bookshelf/index.html`)
- Track reading progress (Read, Reading, To Read)
- Rate and review books
- Display reading statistics (total books, pages read, etc.)
- Filter by reading status

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
