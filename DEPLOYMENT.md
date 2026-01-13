# 🚀 DEPLOYMENT.md — Deploy Abyss Explorer to the World

> *"The best code is code that's actually running."*

This guide walks you through deploying Abyss Explorer to GitHub Pages (free hosting!) and making it accessible to fractal enthusiasts worldwide.

---

## Table of Contents

1. [Quick Deploy (5 Minutes)](#quick-deploy-5-minutes)
2. [Detailed Setup](#detailed-setup)
3. [Custom Domain](#custom-domain-optional)
4. [Performance Optimization](#performance-optimization)
5. [CDN & Caching](#cdn--caching)
6. [Troubleshooting](#troubleshooting)
7. [Alternative Hosting](#alternative-hosting)

---

## Quick Deploy (5 Minutes)

### Option A: Fork & Deploy

1. **Fork this repository** on GitHub
2. Go to **Settings → Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**
6. Wait 1-2 minutes for deployment
7. Your site is live at: `https://YOUR-USERNAME.github.io/abyss-explorer/`

### Option B: Upload to New Repo

```bash
# 1. Create new GitHub repo (via github.com or CLI)
gh repo create abyss-explorer --public

# 2. Clone and add files
git clone https://github.com/YOUR-USERNAME/abyss-explorer.git
cd abyss-explorer

# 3. Copy all Abyss Explorer files here
# (Extract the zip contents to this folder)

# 4. Commit and push
git add .
git commit -m "🚀 Initial release: Abyss Explorer v1.0.0"
git push origin main

# 5. Enable GitHub Pages in Settings → Pages
```

---

## Detailed Setup

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `abyss-explorer` (or your preferred name)
3. Description: `The Ultimate Browser-Based Fractal Navigator`
4. Visibility: **Public** (required for free GitHub Pages)
5. Initialize with README: **No** (we have our own)
6. Click **Create repository**

### Step 2: Upload Files

**Method A: GitHub Web Interface**
1. Click **uploading an existing file**
2. Drag and drop the entire `abyss-explorer` folder contents
3. Commit message: `Initial release`
4. Click **Commit changes**

**Method B: Git Command Line**
```bash
# Clone empty repo
git clone https://github.com/YOUR-USERNAME/abyss-explorer.git
cd abyss-explorer

# Copy files (assuming you extracted the zip to ~/Downloads/abyss-explorer)
cp -r ~/Downloads/abyss-explorer/* .

# Add, commit, push
git add .
git commit -m "🚀 Initial release: Abyss Explorer v1.0.0"
git push origin main
```

**Method C: GitHub Desktop**
1. File → Clone Repository → Your repo
2. Copy files into the local folder
3. Commit to main
4. Push origin

### Step 3: Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** (gear icon)
3. Scroll to **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

### Step 4: Verify Deployment

1. Wait 1-3 minutes for GitHub Actions to build
2. Refresh the Pages settings page
3. You'll see: "Your site is live at https://YOUR-USERNAME.github.io/abyss-explorer/"
4. Click the link to verify!

### Step 5: Update README with Live Link

Edit `README.md` and replace the placeholder:

```markdown
## 🎬 Live Demo

**[🚀 Launch Abyss Explorer](https://YOUR-USERNAME.github.io/abyss-explorer/)**
```

---

## Custom Domain (Optional)

Want to use your own domain like `fractals.yourdomain.com`?

### Step 1: Configure DNS

Add a CNAME record with your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | fractals | YOUR-USERNAME.github.io |

Or for apex domain (`yourdomain.com`):

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

### Step 2: Configure GitHub

1. Go to Settings → Pages
2. Under **Custom domain**, enter: `fractals.yourdomain.com`
3. Check **Enforce HTTPS** (after DNS propagates)
4. Click **Save**

### Step 3: Add CNAME File

Create a file named `CNAME` in your repo root:

```
fractals.yourdomain.com
```

### DNS Propagation

- Can take 1-48 hours
- Check status: `dig fractals.yourdomain.com`
- Or use [dnschecker.org](https://dnschecker.org/)

---

## Performance Optimization

### Image Optimization

The SVG icons are already optimized, but if you add screenshots:

```bash
# Install imagemin (optional)
npm install -g imagemin-cli

# Optimize PNGs
imagemin assets/images/*.png --out-dir=assets/images/

# Or use online tools:
# - tinypng.com
# - squoosh.app
```

### Recommended Image Sizes

| Use Case | Dimensions | Format |
|----------|------------|--------|
| Hero banner | 1920×1080 | WebP/PNG |
| Preset thumbnails | 400×300 | WebP/JPEG |
| Social sharing | 1200×630 | PNG |
| Favicon | 32×32, 192×192 | PNG/SVG |

### Lazy Loading

The app already uses lazy loading for presets. For additional images:

```html
<img src="screenshot.webp" loading="lazy" alt="Description">
```

### Code Optimization (Already Done)

- ✅ ES6 modules for tree-shaking potential
- ✅ Web Workers for non-blocking computation
- ✅ RequestAnimationFrame for smooth rendering
- ✅ Canvas ImageData for efficient pixel manipulation

---

## CDN & Caching

### GitHub Pages CDN

GitHub Pages automatically uses Fastly CDN. Your assets are served from edge nodes worldwide.

### External CDN Resources

Three.js is loaded from CDN in `index.html`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js"></script>
```

Alternative CDNs if needed:
- unpkg: `https://unpkg.com/three@0.160.0/build/three.min.js`
- jsDelivr: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`

### Cache Headers

GitHub Pages sets reasonable cache headers automatically. For custom hosting, add:

```
Cache-Control: public, max-age=31536000
```

For static assets (JS, CSS, images).

---

## Troubleshooting

### "404 Not Found"

**Cause**: GitHub Pages not enabled or wrong branch
**Fix**: 
1. Check Settings → Pages
2. Ensure source is set to `main` branch
3. Wait 2-3 minutes after changes

### "Page build failed"

**Cause**: Invalid file or configuration
**Fix**:
1. Check Actions tab for error details
2. Common issues: Invalid YAML, broken symlinks
3. This project has no build step, so errors are rare

### "Mixed Content" Warnings

**Cause**: HTTP resources on HTTPS page
**Fix**: Ensure all external URLs use `https://`

### 3D Mode Not Working

**Cause**: WebGL not available or Three.js failed to load
**Fix**:
1. Check browser console for errors
2. Verify Three.js CDN is accessible
3. Test in Chrome (most compatible)

### Deep Zoom Glitches

**Cause**: Expected at extreme depths, perturbation limitations
**Fix**: This is a known limitation at 10^500+ zooms

### Mobile Touch Issues

**Cause**: Browser touch handling conflicts
**Fix**: 
1. Test in Safari/Chrome mobile
2. Ensure viewport meta tag is present
3. Check touch-action CSS properties

### CORS Errors

**Cause**: Loading resources from different origin
**Fix**: All resources should be relative paths, not cross-origin

---

## Alternative Hosting

### Netlify (Recommended Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site → Import an existing project**
3. Connect GitHub and select your repo
4. Build command: (leave empty)
5. Publish directory: `.` or `/`
6. Click **Deploy site**

Benefits:
- Automatic HTTPS
- Deploy previews for PRs
- Form handling (if needed later)
- Analytics

### Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repo
4. Framework: **Other**
5. Click **Deploy**

### Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect GitHub
3. Select repo
4. Build command: (leave empty)
5. Output directory: `/`
6. Deploy

Benefits:
- Unlimited bandwidth
- Global edge network
- Web analytics included

### Self-Hosted (Nginx)

```nginx
server {
    listen 80;
    server_name fractals.yourdomain.com;
    root /var/www/abyss-explorer;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

---

## Post-Deployment Checklist

- [ ] Site loads at the deployed URL
- [ ] 2D fractals render correctly
- [ ] 3D fractals render (Three.js loaded)
- [ ] Presets load and navigate
- [ ] Export features work (PNG, share URL)
- [ ] Mobile touch gestures work
- [ ] No console errors
- [ ] README updated with live link
- [ ] Social sharing image works (Open Graph)

---

## Live Demo Links

Once deployed, update these:

```
🌐 Live Demo: https://YOUR-USERNAME.github.io/abyss-explorer/
📦 Repository: https://github.com/YOUR-USERNAME/abyss-explorer
```

---

## Celebrate! 🎉

You've just deployed one of the most ambitious browser-based fractal explorers ever created. Share it with the world:

- Tweet about it with #FractalArt #WebGL #OpenSource
- Post on Reddit r/generative, r/math, r/webdev
- Submit to Hacker News
- Share on Fractal Forums

**The abyss awaits explorers worldwide!** 🌀

---

*Last updated: January 2025*
