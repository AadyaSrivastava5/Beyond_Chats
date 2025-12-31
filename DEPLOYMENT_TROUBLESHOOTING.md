# Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. npm Network Errors on Render

**Error**: `npm error network Invalid response body while trying to fetch`

**Solutions**:

#### Option A: Retry the Deployment
Often these are temporary network issues. Simply retry the deployment:
1. Go to your Render dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"

#### Option B: Update Build Command
Change your build command in Render to:
```bash
cd backend && npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000
```

Or use `npm ci` (clean install):
```bash
cd backend && npm ci --legacy-peer-deps
```

#### Option C: Use Different npm Registry (if issues persist)
Add to your `backend/.npmrc` file:
```
registry=https://registry.npmjs.org/
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-timeout=300000
```

#### Option D: Check Node.js Version
Make sure you're using a stable Node.js version. In Render:
- Go to Environment → Add Environment Variable
- Key: `NODE_VERSION`
- Value: `18` or `20` (avoid 22 if having issues)

### 2. MongoDB Connection Issues

**Error**: `MongooseServerSelectionError` or connection timeout

**Solutions**:
1. **Check MongoDB Atlas IP Whitelist**:
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (for development)
   - Or add Render's IP ranges

2. **Verify Connection String**:
   - Make sure `MONGODB_URI` is set correctly in Render
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
   - Ensure username/password are URL-encoded if they contain special characters

3. **Check Database User Permissions**:
   - User must have read/write permissions

### 3. Build Timeout Issues

**Error**: Build takes too long and times out

**Solutions**:
1. **Optimize Dependencies**:
   - Remove unused packages from `package.json`
   - Use `npm ci` instead of `npm install` (faster, more reliable)

2. **Increase Build Timeout** (if on paid plan):
   - Render free tier has limited build time
   - Consider upgrading or optimizing dependencies

3. **Use Build Cache**:
   - Render caches `node_modules` between builds
   - Clear cache only if needed: "Clear build cache & deploy"

### 4. Port Issues

**Error**: `EADDRINUSE` or port binding issues

**Solutions**:
1. **Use Render's PORT Environment Variable**:
   - Render automatically sets `PORT` environment variable
   - Your code should use: `const PORT = process.env.PORT || 3000;`
   - ✅ Already configured in `backend/server.js`

2. **Don't Hardcode Ports**:
   - Never use `app.listen(3000)` in production
   - Always use `process.env.PORT`

### 5. CORS Issues

**Error**: Frontend can't access backend API

**Solutions**:
1. **Check CORS Configuration**:
   - Backend should allow your frontend domain
   - Already configured in `backend/server.js` to allow Vercel/Netlify domains

2. **Verify API URL**:
   - Frontend `VITE_API_URL` should point to your Render backend URL
   - Format: `https://your-backend.onrender.com/api`

### 6. Environment Variables Not Working

**Error**: Variables not found or undefined

**Solutions**:
1. **Check Variable Names**:
   - Case-sensitive: `MONGODB_URI` not `mongodb_uri`
   - No spaces or special characters in variable names

2. **Restart After Adding Variables**:
   - After adding env vars in Render, redeploy the service
   - Variables are loaded at build/start time

3. **Verify in Logs**:
   - Check Render logs to see if variables are being read
   - Don't log sensitive values in production

### 7. Puppeteer Issues on Render

**Error**: Puppeteer fails to launch or download Chrome

**Solutions**:
1. **Install System Dependencies** (if on paid plan):
   - Add buildpack or install Chrome dependencies
   - Or use `puppeteer-core` with external Chrome

2. **Alternative**: Use a different scraping approach
   - Consider using Cheerio-only scraping
   - Or use a headless browser service

### 8. Frontend Build Fails on Vercel/Netlify

**Error**: Build errors or missing dependencies

**Solutions**:
1. **Check Build Command**:
   - Vercel: Should auto-detect Vite
   - Netlify: `npm install && npm run build` in `frontend` directory

2. **Verify Environment Variables**:
   - `VITE_API_URL` must be set
   - Vite requires `VITE_` prefix for env vars

3. **Check Node Version**:
   - Ensure Node 16+ is used
   - Can specify in `package.json`: `"engines": { "node": ">=16.0.0" }`

### 9. Service Sleeps (Render Free Tier)

**Issue**: First request takes 30-60 seconds

**Solutions**:
1. **This is Normal**:
   - Render free tier services sleep after 15 minutes of inactivity
   - First request "wakes up" the service (takes time)

2. **Upgrade to Paid**:
   - Paid plans keep services always-on
   - $7/month for always-on service

3. **Use a Ping Service** (workaround):
   - Use services like UptimeRobot to ping your service every 10 minutes
   - Keeps service awake (may violate free tier terms)

### 10. Module Not Found Errors

**Error**: `Cannot find module 'xxx'`

**Solutions**:
1. **Check package.json**:
   - Ensure all dependencies are listed
   - Run `npm install` locally to verify

2. **Clear Build Cache**:
   - In Render: "Clear build cache & deploy"
   - Forces fresh `node_modules` installation

3. **Check Import Paths**:
   - Use relative paths: `require('../models/Article')`
   - Not absolute: `require('/models/Article')`

## Quick Fixes Checklist

When deployment fails:

- [ ] Retry the deployment (often fixes temporary issues)
- [ ] Clear build cache and redeploy
- [ ] Check Render/Vercel logs for specific errors
- [ ] Verify all environment variables are set
- [ ] Check Node.js version compatibility
- [ ] Ensure build commands are correct
- [ ] Verify MongoDB connection string
- [ ] Check CORS configuration
- [ ] Review package.json for issues
- [ ] Test locally first before deploying

## Getting Help

1. **Check Logs**: Always check deployment logs first
2. **Render Docs**: https://render.com/docs/troubleshooting-deploys
3. **Vercel Docs**: https://vercel.com/docs
4. **Netlify Docs**: https://docs.netlify.com

## Common Build Commands Reference

### Render (Backend)
```bash
# Standard
cd backend && npm install

# With retries (recommended)
cd backend && npm install --legacy-peer-deps --fetch-retries=5

# Clean install (faster)
cd backend && npm ci --legacy-peer-deps
```

### Vercel (Frontend)
```bash
# Auto-detected for Vite
npm install && npm run build

# Or specify
cd frontend && npm install && npm run build
```

### Netlify (Frontend)
```bash
# In netlify.toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "frontend/dist"
```

