# 🚀 Deployment Guide (Very Detailed, Click‑by‑Click)

**Goal: put this project online using free services only.**  
We will:
- host the **Laravel backend API** on **Railway**
- host the **Next.js frontend** on **Vercel**

You do **not** need Render for this guide.

---

## ✅ Why This Setup?

- ✅ **Free tiers** on both platforms
- ✅ **Automatic deployments** when you push to GitHub
- ✅ **Next.js friendly** (Vercel is built for it)
- ✅ **Laravel friendly** (Railway runs PHP apps easily)
- ✅ **No server management** – you never touch an actual server

---

## 📋 Before You Start

Make sure you have:

1. **GitHub account** (free)
2. **Vercel account** (free) – `https://vercel.com`
3. **Railway account** (free tier) – `https://railway.app`
4. Your project code pushed to **GitHub** (not just on your computer)

If you have not pushed yet, in the project folder run:

```bash
git init
git add .
git commit -m "Initial deployment setup"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Replace `<your-username>` and `<your-repo>` with your own values, then confirm the repo exists on GitHub in your browser.

---

## 🎯 Part 1: Deploy the Laravel Backend to Railway

### Step 1: Create the Railway project

1. Open a browser and go to **`https://railway.app`**.
2. Click **“Login”** (top‑right) and sign in with **GitHub**.
3. Once logged in, on the **Dashboard** click the big **“New Project”** button.
4. In the popup, click **“Deploy from GitHub repo”**.
5. If asked, **authorize GitHub** and **select your repository** for this project.
6. Click **“Deploy”** or **“Confirm”** (wording may change slightly).

Railway will now create a **service** for your Laravel backend.

---

### Step 2: Configure build & start commands

1. Click on the **service** that Railway just created (it usually has your repo name).
2. In the service view, open the **“Settings”** tab at the top.
3. Scroll to the **“Deployment”** or **“Source & Builds”** section:
   - Make sure **Root Directory** is `/` (blank or `/` is fine).
   - Set **Build Command** to:
     ```bash
     composer install --optimize-autoloader --no-dev
     ```
   - Set **Start Command** to:
     ```bash
     php artisan serve --host=0.0.0.0 --port=$PORT
     ```
4. Click **Save** (if there is a save button) or let Railway auto‑save.

---

### Step 3: Create the SQLite database file

1. Still inside your Railway service, go to the **“Deployments”** or **“Shell”** / **“Run Command”** area.
2. Find a button like **“New Command”**, **“Run Command”**, or `>` icon.
3. Run this command:

```bash
mkdir -p database && touch database/database.sqlite
```

This creates the SQLite database file at the path Laravel expects in production.

---

### Step 4: Set environment variables on Railway

1. In the same service, click the **“Variables”** tab at the top.
2. Click **“New Variable”** (or the `+` button) and add the following keys and values:

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

> For now you can leave `SANCTUM_STATEFUL_DOMAINS` as `your-frontend-url.vercel.app`.  
> We will come back and update it with the real Vercel URL later.

#### Generate APP_KEY locally

On **your own computer**, inside the Laravel project folder, run:

```bash
php artisan key:generate --show
```

Copy the entire result (it starts with `base64:`) and paste it into the `APP_KEY` variable on Railway.

---

### Step 5: First deploy + run migrations

1. Back in Railway, go to the **“Deployments”** tab for your service.
2. If a deployment is not already running, click **“Redeploy”** or **“Deploy”**.
3. Wait until the status is **“Deployed”** (or similar). You can watch the **Logs** tab to see progress.
4. Once it’s deployed, in the same **Deployments** view, click the **“Run Command”** or `...` menu.
5. Run:

```bash
php artisan migrate --force
php artisan db:seed      # optional: only if you want seed data
php artisan storage:link
```

If any of these commands fails, check the error text and fix it before continuing.

---

### Step 6: Get your backend URL

1. In the Railway service, open the **“Settings”** tab.
2. Scroll to **“Networking”** or **“Domains”**.
3. Copy the public URL – it will look like:

```text
https://your-app-name.up.railway.app
```

We will use this in Vercel as `NEXT_PUBLIC_API_URL`.

---

## 🎯 Part 2: Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

1. Open a browser and go to **`https://vercel.com`**.
2. Click **“Log in”** and sign in with **GitHub**.
3. On the Vercel dashboard, click the **“Add New…”** button (top‑right) → choose **“Project”**.
4. In the list of repositories, click **“Import”** on your project repo.
5. On the **“Configure Project”** screen:
   - **Framework Preset**: should automatically show **Next.js**.
   - Click **“Edit”** next to **Root Directory** and change it to `frontend` (select the `frontend` folder).
   - Leave **Build Command** as `npm run build`.
   - Leave **Install Command** as `npm install`.
   - Leave **Output Directory** as `.next`.
6. Scroll down and click **“Deploy”**.

### Step 2: Set Environment Variables

1. After the project is created, click on the project name to open it.
2. Go to the **“Settings”** tab at the top.
3. In the left sidebar, click **“Environment Variables”**.
4. Click **“Add”** and create this variable:

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

If you changed any environment variables after the first deployment:

1. In the Vercel project overview, click the **“Deployments”** tab.
2. Click **“Redeploy”** on the latest deployment.
3. Wait until the deployment shows **“Ready”** with a green checkmark.

### Step 5: Get Your Frontend URL

1. In the Vercel project overview, look at the top bar or **Deployments** list.
2. Copy the URL that looks like:

```text
https://your-project.vercel.app
```

You will use this in `SANCTUM_STATEFUL_DOMAINS` on Railway.

---

## 🔄 Part 3: Connect Frontend & Backend

### Update Railway Environment Variable

1. Go back to **Railway** → open your Laravel service.
2. Click the **“Variables”** tab.
3. Find `SANCTUM_STATEFUL_DOMAINS` and change its value to:

```env
SANCTUM_STATEFUL_DOMAINS=your-project.vercel.app,www.your-project.vercel.app
```

4. Click **Save** if needed. Railway will usually **auto‑redeploy** when variables change.

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

