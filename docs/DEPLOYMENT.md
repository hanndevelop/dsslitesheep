# Deploying DSS Lite to Netlify

## Quick Deploy (Drag & Drop)

### Step 1: Build the App

```bash
cd dss-lite-app
npm install
npm run build
```

This creates a `build/` folder with your production-ready app.

### Step 2: Deploy to Netlify

1. Go to https://app.netlify.com/
2. Sign in (or create free account)
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag the entire `build/` folder onto the upload area
5. Wait for deployment (usually 30 seconds)
6. Your app is live! Copy the URL

---

## Git-Based Deploy (Recommended for Teams)

### Step 1: Push to GitHub

```bash
cd dss-lite-app
git init
git add .
git commit -m "Initial DSS Lite app"
git remote add origin https://github.com/YOUR_USERNAME/dss-lite-app.git
git push -u origin main
```

### Step 2: Connect Netlify to GitHub

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import from Git"**
3. Choose **GitHub** and authorize Netlify
4. Select your `dss-lite-app` repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
6. Click **"Deploy site"**

### Step 3: Automatic Deploys

Now every time you push to GitHub, Netlify auto-deploys! 🎉

---

## Custom Domain (Optional)

1. In Netlify dashboard, go to **Domain settings**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `dss.yourbusiness.co.za`)
4. Follow DNS configuration instructions
5. Netlify auto-enables HTTPS!

---

## Environment Variables (Future Use)

If you add backend API later:

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add variables like:
   - `REACT_APP_API_URL`
   - `REACT_APP_API_KEY`
3. Redeploy for changes to take effect

---

## Monitoring & Analytics

- **Netlify Analytics:** Enable in site settings ($9/mo)
- **Google Analytics:** Add tracking code to `public/index.html`

---

## Troubleshooting

### Build fails
- Check that `npm run build` works locally
- Ensure `package.json` has all dependencies
- Check Netlify build logs for error messages

### App doesn't load
- Verify publish directory is `build` (not `build/`)
- Check browser console for errors
- Ensure all files uploaded correctly

### Routing issues (if you add React Router later)
Add `_redirects` file to `public/`:
```
/*  /index.html  200
```

---

## Cost

- **Netlify Free Tier:**
  - 100 GB bandwidth/month
  - 300 build minutes/month
  - Perfect for internal tools with 2-10 users

- **Netlify Pro ($19/mo):**
  - If you need more bandwidth or team features

---

## Alternative: Vercel

Vercel is another great option (same process):

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Your Deployed App

After deployment, you'll get a URL like:
- `https://dss-lite-abc123.netlify.app`

Share this with your team! Everyone can access without installing anything.

**No backend needed** - everything runs in the browser, data never leaves the user's computer.
