# 🚀 Best Deployment Solution for Your Project

**Recommended: Vercel (Frontend) + Railway (Backend)**

This is the easiest, most cost-effective solution perfect for your Laravel + Next.js setup.

---

## ✅ Why This Setup?

- ✅ **Free tiers available** for both services
- ✅ **Zero server management** - fully managed
- ✅ **Automatic deployments** from GitHub
- ✅ **Perfect for Next.js** - Vercel is made by Next.js creators
- ✅ **Great Laravel support** - Railway handles PHP perfectly
- ✅ **SQLite friendly** - Railway supports persistent storage
- ✅ **Easy to scale** when needed

---

## 📋 Prerequisites

1. **GitHub account** (free)
2. **Vercel account** (free) - https://vercel.com
3. **Railway account** (free tier available) - https://railway.app
4. **Push your code to GitHub** (if not already done)

---

## 🎯 Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository

Make sure your code is on GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Railway

1. **Go to [Railway](https://railway.app)** and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect it's a Laravel project

### Step 3: Configure Railway Service

Railway will create a service. Configure it:

**Settings:**
- **Root Directory:** `/` (leave as default)
- **Build Command:** `composer install --optimize-autoloader --no-dev`
- **Start Command:** `php artisan serve --host=0.0.0.0 --port=$PORT`

### Step 4: Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
APP_NAME="Vehicle Rental System"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=https://your-app-name.up.railway.app

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite

SESSION_DRIVER=database
SESSION_LIFETIME=120

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync

SANCTUM_STATEFUL_DOMAINS=your-frontend-url.vercel.app
```

**Important:**
- Generate `APP_KEY` by running locally: `php artisan key:generate` and copy the value
- Replace `your-frontend-url.vercel.app` with your actual Vercel URL (you'll get this after deploying frontend)

### Step 5: Run Migrations

After first deployment, go to Railway dashboard:
1. Click on your service
2. Go to **Deployments** tab
3. Click **"..."** menu → **"Run Command"**
4. Run: `php artisan migrate --force`
5. (Optional) Run: `php artisan db:seed` for sample data

### Step 6: Get Your Backend URL

Railway will provide a URL like: `https://your-app-name.up.railway.app`
**Copy this URL** - you'll need it for the frontend!

---

## 🎯 Part 2: Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)** and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:

**Project Settings:**
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `frontend` ⚠️ **IMPORTANT!**
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### Step 2: Set Environment Variables

In Vercel project settings → **Environment Variables**, add:

```env
NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app/api
```

Replace `your-app-name.up.railway.app` with your actual Railway backend URL.

### Step 3: Update next.config.mjs

Create/update `frontend/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const apiUrlObj = new URL(apiUrl);

const nextConfig = {
  async rewrites() {
    // Only use rewrites in development
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: apiUrlObj.protocol.replace(':', ''),
        hostname: apiUrlObj.hostname,
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
```

### Step 4: Deploy

Click **"Deploy"** - Vercel will build and deploy automatically!

### Step 5: Get Your Frontend URL

Vercel will provide a URL like: `https://your-project.vercel.app`
**Copy this URL** - you need to update Railway with it!

---

## 🔄 Part 3: Connect Frontend & Backend

### Update Railway Environment Variable

1. Go back to Railway dashboard
2. Update the `SANCTUM_STATEFUL_DOMAINS` variable:
   ```env
   SANCTUM_STATEFUL_DOMAINS=your-project.vercel.app,www.your-project.vercel.app
   ```
3. Railway will automatically redeploy

### Update Vercel (if needed)

Make sure `NEXT_PUBLIC_API_URL` in Vercel points to your Railway backend.

---

## ✅ Verify Deployment

1. **Frontend:** Visit `https://your-project.vercel.app`
2. **Backend API:** Visit `https://your-app-name.up.railway.app/api/ping`
   - Should return: `{"message":"API is working!"}`

---

## 🔧 Post-Deployment Setup

### Create Storage Link (Railway)

In Railway, run command:
```bash
php artisan storage:link
```

### Verify Database

Check if migrations ran:
```bash
php artisan migrate:status
```

---

## 📝 Custom Domain (Optional)

### Vercel Custom Domain:
1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Follow DNS instructions

### Railway Custom Domain:
1. Go to Railway service → Settings → Networking
2. Add custom domain
3. Configure DNS

---

## 🔄 Updating Your App

### Automatic Deployments:
- **Push to GitHub** → Both Vercel and Railway auto-deploy!
- No manual steps needed

### Manual Updates:
If you need to run migrations or commands:

**Railway:**
- Dashboard → Deployments → Run Command
- Example: `php artisan migrate --force`

**Vercel:**
- Usually auto-deploys on git push
- Or trigger redeploy in dashboard

---

## 💰 Pricing

### Free Tiers:
- **Vercel:** Free forever (with limits)
- **Railway:** $5/month free credit (usually enough for small apps)

### If You Need More:
- **Vercel Pro:** $20/month (more bandwidth)
- **Railway:** Pay-as-you-go (very affordable)

---

## 🆘 Troubleshooting

### Frontend can't connect to backend:
- ✅ Check `NEXT_PUBLIC_API_URL` in Vercel matches Railway URL
- ✅ Verify Railway service is running
- ✅ Check Railway logs for errors

### CORS/Authentication errors:
- ✅ Update `SANCTUM_STATEFUL_DOMAINS` in Railway with Vercel URL
- ✅ Make sure URLs use `https://` (not `http://`)

### Database errors:
- ✅ Run migrations: `php artisan migrate --force` in Railway
- ✅ Check Railway logs for database connection errors

### Images not loading:
- ✅ Run `php artisan storage:link` in Railway
- ✅ Check file permissions in Railway
- ✅ Verify image URLs use Railway domain

### 500 errors:
- ✅ Check Railway logs
- ✅ Verify all environment variables are set
- ✅ Make sure `APP_KEY` is generated

---

## 📊 Monitoring

### Railway:
- View logs in dashboard
- Monitor resource usage
- Check deployment status

### Vercel:
- View build logs
- Monitor analytics
- Check deployment status

---

## 🎉 You're Done!

Your app is now live:
- **Frontend:** `https://your-project.vercel.app`
- **Backend:** `https://your-app-name.up.railway.app`

Both will auto-deploy when you push to GitHub!

---

## 🔐 Security Checklist

- [x] `APP_DEBUG=false` in production
- [x] `APP_ENV=production`
- [x] Strong `APP_KEY` generated
- [x] HTTPS enabled (automatic on both platforms)
- [x] `SANCTUM_STATEFUL_DOMAINS` configured correctly
- [x] Environment variables secured (not in code)

---

**Need help?** Check Railway and Vercel documentation for platform-specific guides.

