# 🚀 Quick Setup Guide - Vehicle Rental System

Follow these steps in order to get your project running.

---

## ✅ Step 1: Check Prerequisites

Make sure you have these installed:

- **PHP 8.2+** - Check with: `php -v`
- **Composer** - Check with: `composer --version`
- **Node.js 18+** - Check with: `node -v` and `npm -v`

**If missing:**
- PHP: Download from https://www.php.net/downloads.php
- Composer: Download from https://getcomposer.org/download/
- Node.js: Download from https://nodejs.org/

---

## 📦 Step 2: Install Backend Dependencies

Open PowerShell/Terminal in the project root folder and run:

```powershell
composer install
```

This installs all Laravel PHP packages. Wait for it to complete.

---

## 📦 Step 3: Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

This installs Next.js, React, and other frontend packages.

---

## ⚙️ Step 4: Create Environment File

Create a `.env` file in the project root. You can copy this template:

```powershell
# Create .env file (if it doesn't exist)
New-Item -ItemType File -Path ".env" -Force
```

Then add this content to `.env`:

```env
APP_NAME="Vehicle Rental System"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=sqlite
DB_DATABASE=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

---

## 🔑 Step 5: Generate Application Key

```powershell
php artisan key:generate
```

This automatically fills in `APP_KEY` in your `.env` file.

---

## 🗄️ Step 6: Setup Database

The database file already exists, but you need to run migrations:

```powershell
php artisan migrate
```

**Optional - Add Sample Data:**
```powershell
php artisan db:seed
```

This creates test users:
- **Manager**: `sean@gmail.com` / `sean123`
- **Staff**: `jurls@gmail.com` / `jurls123`
- **Renter**: `cedric@gmail.com` / `cedric123`

---

## 🔗 Step 7: Create Storage Link

This allows uploaded images to be accessible:

```powershell
php artisan storage:link
```

**Note:** If this fails on Windows, you may need to run PowerShell as Administrator.

---

## 🚀 Step 8: Start the Servers

You need **TWO terminal windows** running simultaneously:

### Terminal 1 - Frontend (Next.js)
```powershell
cd frontend
npm run dev
```
Keep this running. Frontend will be at: **http://localhost:3000**

### Terminal 2 - Backend (Laravel API)
```powershell
php artisan serve
```
Keep this running. Backend will be at: **http://127.0.0.1:8000**

---

## 🌐 Step 9: Access the Application

1. Open your browser
2. Go to: **http://localhost:3000**
3. You'll see the login/register page

**To test with sample data:**
- Login with: `sean@gmail.com` / `sean123` (Manager account)
- Or register a new account (will be created as "renter" role)

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in both terminal windows to stop the servers.

---

## ❗ Common Issues & Fixes

### "composer: command not found"
- Install Composer from https://getcomposer.org/download/
- Make sure it's added to your system PATH

### "php: command not found"
- Install PHP 8.2+ and add it to your system PATH
- On Windows, you may need to add PHP to PATH manually

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### "Class not found" errors
```powershell
composer dump-autoload
```

### Database connection errors
- Make sure `database/database.sqlite` file exists
- Check that SQLite extension is enabled in PHP (`php.ini`)

### Port 8000 or 3000 already in use
- Close other applications using those ports
- Or change port: `php artisan serve --port=8001`
- Update `APP_URL` in `.env` if you change the port

### Storage link fails
- Run PowerShell as Administrator
- Or manually create: `mklink /D public\storage storage\app\public`

### Frontend can't connect to backend
- Make sure both servers are running
- Check that backend is at `http://127.0.0.1:8000`
- Verify API URL in `frontend/lib/api.js` points to correct backend

---

## 📝 Quick Reference Commands

```powershell
# Install dependencies
composer install
cd frontend && npm install && cd ..

# Setup environment
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link

# Start servers (in separate terminals)
cd frontend && npm run dev
php artisan serve

# Clear caches (if needed)
php artisan optimize:clear
php artisan cache:clear
```

---

## 🎯 What You Should See

✅ **Backend running:** `http://127.0.0.1:8000` shows Laravel welcome or API response  
✅ **Frontend running:** `http://localhost:3000` shows login/register page  
✅ **Database:** Tables created after `php artisan migrate`  
✅ **Sample data:** Users available after `php artisan db:seed`

---

**That's it! Your project should now be running.** 🎉

If you encounter any issues, check the troubleshooting section above or review the full README.md file.

