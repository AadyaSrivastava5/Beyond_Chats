# Deployment Guide

This guide will help you deploy the BeyondChats Article Scraper & Enhancer application to production.

## Deployment Architecture

```
┌─────────────────┐
│  Vercel/Netlify │  ← Frontend (React)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Render      │  ← Backend (Express API)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB Atlas  │  ← Database (Already Cloud)
└─────────────────┘
```

## Prerequisites

- GitHub account (for connecting to deployment platforms)
- MongoDB Atlas account (already set up)
- Google Gemini API key
- Git repository with your code pushed

---

## Part 1: Backend Deployment on Render

### Step 1: Prepare Backend for Deployment

1. **Create a `render.yaml` file** (optional but recommended):

   ```yaml
   services:
     - type: web
       name: beyondchats-backend
       env: node
       buildCommand: cd backend && npm install
       startCommand: cd backend && npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: MONGODB_URI
           sync: false
         - key: PORT
           value: 10000
   ```

2. **Update `backend/server.js`** to use Render's PORT:

   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

   (Already done in your code)

3. **Add a health check endpoint** (already exists at `/health`)

### Step 2: Deploy to Render

1. **Sign up/Login to Render**

   - Go to https://render.com
   - Sign up with GitHub

2. **Create a New Web Service**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the Service**

   - **Name**: `beyondchats-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install --legacy-peer-deps --fetch-retries=5`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or choose paid for better performance)

   **Note**: If you encounter network errors during build, try:

   - `cd backend && npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000`
   - Or use: `cd backend && npm ci --legacy-peer-deps`

4. **Set Environment Variables**
   Click "Environment" tab and add:

   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=10000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Wait for deployment to complete (5-10 minutes)
   - Note your backend URL: `https://beyondchats-backend.onrender.com` (or similar)

### Step 3: Test Backend

1. Visit your backend URL: `https://your-backend-url.onrender.com/health`
2. Should return: `{"status":"OK","message":"Server is running"}`
3. Test API: `https://your-backend-url.onrender.com/api/articles`

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Deployment

1. **Update API URL in frontend**

   - The frontend already uses `VITE_API_URL` environment variable
   - We'll set this in Vercel

2. **Create `vercel.json`** (optional):
   ```json
   {
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/dist",
     "devCommand": "cd frontend && npm run dev",
     "installCommand": "cd frontend && npm install",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**

   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**

   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure Project**

   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**
   Click "Environment Variables" and add:

   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

   Replace `your-backend-url` with your actual Render backend URL

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-5 minutes)
   - Vercel will provide a URL like: `https://beyondchats-frontend.vercel.app`

### Step 3: Test Frontend

1. Visit your Vercel URL
2. Check if articles load from the backend
3. Test dark mode toggle
4. Test article navigation

---

## Part 3: Frontend Deployment on Netlify (Alternative)

If you prefer Netlify over Vercel:

### Step 1: Prepare for Netlify

1. **Create `netlify.toml`** in the root:

   ```toml
   [build]
     base = "frontend"
     command = "npm install && npm run build"
     publish = "frontend/dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Step 2: Deploy to Netlify

1. **Sign up/Login to Netlify**

   - Go to https://netlify.com
   - Sign up with GitHub

2. **New Site from Git**

   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select your repository

3. **Configure Build Settings**

   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`

4. **Set Environment Variables**

   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com/api`

5. **Deploy**
   - Click "Deploy site"
   - Netlify will provide a URL like: `https://random-name-123.netlify.app`

---

## Part 4: Update Scripts for Production

### Update Scripts Environment

1. **Update `scripts/.env`**:

   ```
   API_BASE_URL=https://your-backend-url.onrender.com/api
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_API_KEY=optional
   GOOGLE_CX=optional
   ```

2. **Run enhancement scripts locally** (they'll call the production API):
   ```bash
   cd scripts
   node enhance-articles.js --all
   ```

---

## Part 5: Custom Domain (Optional)

### Vercel Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Render Custom Domain

1. Go to your service → Settings → Custom Domains
2. Add your domain
3. Configure DNS records as instructed

---

## Part 6: Environment Variables Summary

### Backend (Render)

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
PORT=10000
```

### Frontend (Vercel/Netlify)

```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Scripts (Local - for enhancement)

```
API_BASE_URL=https://your-backend-url.onrender.com/api
GEMINI_API_KEY=your_key_here
```

---

## Part 7: Post-Deployment Checklist

- [ ] Backend health check works
- [ ] Frontend loads correctly
- [ ] API calls work from frontend
- [ ] Dark mode toggle works
- [ ] Images display correctly
- [ ] Articles load from database
- [ ] Enhancement scripts can connect to production API
- [ ] CORS is properly configured (should work with Render defaults)

---

## Troubleshooting

### Backend Issues

**Problem**: Backend returns 404

- **Solution**: Check that routes are prefixed with `/api`

**Problem**: MongoDB connection fails

- **Solution**:
  - Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
  - Check connection string is correct

**Problem**: Backend sleeps after inactivity (Render free tier)

- **Solution**:
  - First request may take 30-60 seconds to wake up
  - Consider upgrading to paid plan for always-on service

### Frontend Issues

**Problem**: API calls fail with CORS error

- **Solution**: Backend CORS should allow your frontend domain. Check `backend/server.js`

**Problem**: Images not loading

- **Solution**: Check image URLs are absolute or relative paths work

**Problem**: Environment variables not working

- **Solution**:
  - Vercel: Restart deployment after adding env vars
  - Netlify: Redeploy after adding env vars

---

## Quick Deploy Commands

### Render (Backend)

```bash
# Already deployed via GitHub integration
# Just push to main branch to trigger redeploy
git push origin main
```

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Or push to GitHub (auto-deploys)
git push origin main
```

### Netlify (Frontend)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod

# Or push to GitHub (auto-deploys)
git push origin main
```

---

## Cost Estimate

### Free Tier (Recommended for Start)

- **Render Backend**: Free (with sleep after inactivity)
- **Vercel Frontend**: Free (generous limits)
- **MongoDB Atlas**: Free (512MB storage)
- **Total**: $0/month

### Paid Tier (For Production)

- **Render Backend**: $7/month (always-on)
- **Vercel Frontend**: Free (usually enough)
- **MongoDB Atlas**: Free tier usually sufficient
- **Total**: ~$7/month

---

## Next Steps After Deployment

1. **Test the live application**
2. **Run the scraper** to populate articles
3. **Run enhancement script** to enhance articles
4. **Share your live link** in README.md
5. **Set up monitoring** (optional)

---

## Support

If you encounter issues:

1. Check Render/Vercel deployment logs
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test API endpoints directly

Good luck with your deployment! 🚀
