# Quick Start Guide

Get your portfolio website running in minutes!

## 🚀 Fast Track (5 Minutes)

### 1. Set Up Supabase (2 min)

1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor → New Query
4. Copy/paste `backend/supabase_schema.sql` → Run
5. Go to Settings → API → Copy URL and keys

### 2. Configure Backend (1 min)

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
- Add Supabase URL and keys
- Set admin email/password
- Generate secret: `openssl rand -hex 32`

### 3. Run Locally (30 sec)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

✅ Backend running at `http://localhost:8000`

### 4. Access Admin (30 sec)

1. Open `admin/index.html` in browser
2. Update API_BASE in `admin/admin.js`:
   ```javascript
   const API_BASE = 'http://localhost:8000/api';
   ```
3. Login with your admin credentials
4. Start adding content!

### 5. View Portfolio (30 sec)

Open `index.html` in browser - your portfolio is ready!

---

## 📋 Full Setup

For production deployment, follow [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎯 What's Included

✅ **Frontend**
- Modern responsive portfolio
- Blog section
- Bookshelf
- Optimized CSS/JS

✅ **Backend API**
- FastAPI with Supabase
- JWT authentication
- Full CRUD operations
- RESTful endpoints

✅ **Admin Dashboard**
- Secure login
- Content management
- Blog editor
- Profile configuration

✅ **CI/CD**
- GitHub Actions workflows
- Automated deployment
- Multi-platform support

## 📁 Project Structure

```
portfolio-website/
├── index.html          # Main portfolio
├── admin/             # Admin dashboard
│   ├── index.html
│   └── admin.js
├── blog/              # Blog section
├── bookshelf/         # Reading list
├── assets/            # Optimized assets
│   ├── css/          # Modular CSS
│   ├── js/           # JavaScript modules
│   └── data/         # JSON data
└── backend/           # FastAPI backend
    ├── app/
    │   ├── api/      # API routes
    │   ├── core/     # Config & auth
    │   └── schemas/  # Data models
    ├── requirements.txt
    └── supabase_schema.sql
```

## 🔧 Common Tasks

### Add Blog Post
1. Login to admin
2. Go to Blog Posts tab
3. Click "New Post"
4. Write & Publish

### Update Profile
1. Login to admin
2. Go to Profile tab
3. Edit fields
4. Save changes

### Add Skills/Projects
1. Login to admin
2. Select appropriate tab
3. Add/Edit/Delete items

## 🆘 Need Help?

- **Setup Issues**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Backend Help**: See [backend/README.md](./backend/README.md)
- **General Info**: See [README.md](./README.md)
- **Structure**: See [STRUCTURE.md](./STRUCTURE.md)

## 🎨 Customize

### Colors
Edit `assets/js/config.js` - Tailwind color palette

### Styles
Edit files in `assets/css/`:
- `base.css` - Foundation
- `components.css` - UI elements
- `animations.css` - Effects
- `utilities.css` - Helpers

### Content
All content managed through admin dashboard!

---

**Ready to deploy?** Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup! 🚀
