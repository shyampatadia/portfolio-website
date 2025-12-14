# Deployment Guide - Hybrid Setup

This guide will help you deploy your portfolio to **GitHub Pages** (frontend) and **Vercel** (backend).

## Overview

- **Frontend** (Portfolio + Admin UI): GitHub Pages
- **Backend** (API): Vercel
- **Database**: Supabase (already set up)

---

## Step 1: Deploy Backend to Vercel

### 1.1 Prepare Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Install Vercel CLI (optional but recommended):
   ```bash
   npm install -g vercel
   ```

### 1.2 Deploy Backend

**Option A: Using Vercel Dashboard (Recommended)**

1. Click "Add New Project" in Vercel
2. Import your GitHub repository
3. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)

4. **Add Environment Variables** (click "Environment Variables"):
   ```
   SUPABASE_URL=https://xblygzcpqxytexcctzyh.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibHlnemNwcXh5dGV4Y2N0enloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODQ1NDcsImV4cCI6MjA4MTI2MDU0N30.Efwe3aUkKayoxOKP0dau3zfOqHGSNiUbG_ha-kCNTAE
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibHlnemNwcXh5dGV4Y2N0enloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4NDU0NywiZXhwIjoyMDgxMjYwNTQ3fQ.kvtauOWFV017VWSwdAaJSlYf196dzPCNFs-0YTeA2h8
   SECRET_KEY=53186232e742f2479a5c0a749480f31cdc1532070287e5176d40e1b432efb794
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ADMIN_EMAIL=shyampatadia22@gmail.com
   ADMIN_PASSWORD=SPFfall@2025
   ENVIRONMENT=production
   ```

5. Click **Deploy**

6. **Copy your backend URL** (e.g., `https://your-project.vercel.app`)

**Option B: Using Vercel CLI**

```bash
cd backend
vercel

# Follow prompts:
# Set up and deploy? Yes
# Which scope? (select your account)
# Link to existing project? No
# What's your project's name? portfolio-backend
# In which directory is your code located? ./
# Want to override the settings? No

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
# ... (add all variables from .env file)

# Deploy to production
vercel --prod
```

---

## Step 2: Update Admin Panel with Backend URL

1. Open `admin/config.js`
2. Find line with `'https://your-backend.vercel.app/api'`
3. Replace with your actual Vercel URL:
   ```javascript
   return 'https://your-actual-project.vercel.app/api';
   ```

---

## Step 3: Deploy Frontend to GitHub Pages

### 3.1 Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. That's it! The workflow is already set up.

### 3.2 Push Changes

```bash
git add .
git commit -m "Configure for Vercel and GitHub Pages deployment"
git push origin main
```

The GitHub Actions workflow will automatically deploy your site to:
```
https://YOUR_USERNAME.github.io/REPO_NAME/
```

---

## Step 4: Test Everything

### Test Portfolio
1. Visit: `https://YOUR_USERNAME.github.io/REPO_NAME/`
2. Check navigation between tabs works

### Test Admin Panel
1. Visit: `https://YOUR_USERNAME.github.io/REPO_NAME/admin/`
2. Login with:
   - Email: `shyampatadia22@gmail.com`
   - Password: `SPFfall@2025`
3. Try creating/editing content

---

## Local Development

### Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```
Backend runs at: `http://localhost:8000`

### View Frontend
Just open `index.html` in your browser, or use a local server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

The admin panel will automatically detect you're on localhost and use `http://localhost:8000/api`.

---

## Troubleshooting

### Backend Deployment Issues

**Error: "No Python version specified"**
- Add `runtime.txt` in backend folder:
  ```
  python-3.11
  ```

**Error: "Module not found"**
- Make sure `requirements-vercel.txt` exists in backend folder
- Vercel should auto-detect it

### Admin Panel Can't Connect

1. Check browser console (F12) for errors
2. Verify backend URL in `admin/config.js` is correct
3. Test backend directly: `https://your-backend.vercel.app/health`
4. Check CORS is enabled in backend (already configured)

### GitHub Pages 404 Error

1. Make sure GitHub Pages is enabled in Settings
2. Check the workflow ran successfully in Actions tab
3. Wait a few minutes for deployment to complete

---

## Custom Domain (Optional)

### For GitHub Pages
1. Go to Settings → Pages
2. Add your custom domain
3. Enable "Enforce HTTPS"

### For Vercel Backend
1. Go to Vercel project settings
2. Add custom domain
3. Update `admin/config.js` with new domain

---

## Security Notes

⚠️ **IMPORTANT**: Never commit `.env` file to GitHub!

The `.env` file contains sensitive credentials. While it's currently in your repo, you should:

1. Add `.env` to `.gitignore`:
   ```bash
   echo "backend/.env" >> .gitignore
   ```

2. Remove it from git history:
   ```bash
   git rm --cached backend/.env
   git commit -m "Remove .env from tracking"
   git push
   ```

3. Rotate your credentials:
   - Generate new Supabase keys
   - Generate new SECRET_KEY
   - Change ADMIN_PASSWORD

---

## What's Next?

- ✅ Portfolio is live on GitHub Pages
- ✅ Admin panel accessible at `/admin`
- ✅ Backend API running on Vercel
- ✅ Content stored in Supabase

You can now manage your portfolio content through the admin panel from anywhere!

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Pages**: https://docs.github.com/pages
- **Supabase**: https://supabase.com/docs
