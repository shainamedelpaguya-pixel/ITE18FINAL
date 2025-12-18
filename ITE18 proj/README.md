<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

-   [Simple, fast routing engine](https://laravel.com/docs/routing).
-   [Powerful dependency injection container](https://laravel.com/docs/container).
-   Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
-   Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
-   Database agnostic [schema migrations](https://laravel.com/docs/migrations).
-   [Robust background job processing](https://laravel.com/docs/queues).
-   [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

-   **[Vehikl](https://vehikl.com)**
-   **[Tighten Co.](https://tighten.co)**
-   **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
-   **[64 Robots](https://64robots.com)**
-   **[Curotec](https://www.curotec.com/services/technologies/laravel)**
-   **[DevSquad](https://devsquad.com/hire-laravel-developers)**
-   **[Redberry](https://redberry.international/laravel-development)**
-   **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

## How to Run the Project on Another Laptop

This guide will help you set up and run this Laravel project on a new machine.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **PHP 8.2 or higher** - [Download PHP](https://www.php.net/downloads.php)
- **Composer** - PHP dependency manager - [Download Composer](https://getcomposer.org/download/)
- **Node.js 18+ and npm** - For frontend asset compilation - [Download Node.js](https://nodejs.org/)
- **SQLite** - Usually comes with PHP, but ensure it's enabled in your `php.ini`

### Step 1: Clone or Copy the Project

1. Copy the project folder to your new laptop, or clone it from your repository:
   ```powershell
   git clone <repository-url>
   cd "ITE18 proj"
   ```

### Step 2: Install PHP Dependencies

1. Open a terminal in the project root directory.

2. Install Composer dependencies:
   ```powershell
   composer install
   ```

   This will install all PHP packages defined in `composer.json`, including Laravel framework and other dependencies.

### Step 3: Install Frontend Dependencies

1. Install npm packages for the Next.js frontend:
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

   This installs Next.js, React, Tailwind CSS, and other frontend dependencies.

### Step 4: Environment Configuration

1. Copy the environment example file to create your `.env` file:
   ```powershell
   copy .env.example .env
   ```
   (If `.env.example` doesn't exist, create a new `.env` file)

2. Generate the application key:
   ```powershell
   php artisan key:generate
   ```

3. Open the `.env` file and configure the following settings if needed:
   - `APP_NAME` - Your application name
   - `APP_ENV` - Set to `local` for development
   - `APP_DEBUG` - Set to `true` for development
   - `APP_URL` - Set to `http://127.0.0.1:8000` for local development
   - Database configuration (SQLite is used by default)

### Step 5: Database Setup

1. Create the SQLite database file (if it doesn't exist):
   ```powershell
   New-Item -ItemType File -Path "database\database.sqlite" -Force
   ```

   Or manually create an empty file named `database.sqlite` in the `database` folder.

2. Update your `.env` file to use SQLite:
   ```env
   DB_CONNECTION=sqlite
   DB_DATABASE=C:\Users\User\Documents\SeanFiles\ITE18 proj\database\database.sqlite
   ```
   (Update the path to match your actual project location)

3. Run database migrations to create all tables:
   ```powershell
   php artisan migrate
   ```

4. (Optional) Seed the database with sample data:
   ```powershell
   php artisan db:seed
   ```
   
   This will populate the database with:
   - 10 sample renters
   - 10 sample vehicles
   - 10 sample employees
   - Sample rentals and payments
   - Default users (sean@gmail.com, jurls@gmail.com, cedric@gmail.com)

### Step 6: Create Storage Link

Create a symbolic link from `public/storage` to `storage/app/public` to serve uploaded files:

```powershell
php artisan storage:link
```

This allows uploaded vehicle images to be accessible via the `/storage` URL.

### Step 7: Start the Next.js Frontend

The frontend is built with Next.js and runs on a separate port from the Laravel backend.

**Development Mode (with hot reload)**
```powershell
cd frontend
npm run dev
```
This starts the Next.js development server on `http://localhost:3000` with hot module replacement. Keep this terminal open.

**Production Build**
```powershell
cd frontend
npm run build
npm start
```
This builds and starts the Next.js production server.

### Step 8: Start the Laravel Backend Server

1. Open a new terminal window (keep the Next.js dev server running in the previous terminal).

2. Start the Laravel development server:
   ```powershell
   php artisan serve
   ```

   The API backend will be available at `http://127.0.0.1:8000`
   The API endpoints are accessible at `http://127.0.0.1:8000/api`

### Step 9: Access the Application

1. Open your browser and navigate to:
   - **Frontend Application**: `http://localhost:3000`
   - **API Backend**: `http://127.0.0.1:8000/api`

2. The Next.js frontend will automatically redirect to the authentication page if you're not logged in.

3. Test the authentication:
   - Register a new user with roles: `renter`, `staff`, or `manager`
   - Login with existing seeded users:
     - Manager: `sean@gmail.com` / `sean123`
     - Staff: `jurls@gmail.com` / `jurls123`
     - Renter: `cedric@gmail.com` / `cedric123`

### Alternative: Run Everything with One Command

If you want to run the Laravel backend services together, use the Composer dev script:

```powershell
composer run dev
```

This single command starts:
- Laravel development server (port 8000)
- Queue worker
- Log viewer (Pail)

**Note:** You still need to run the Next.js frontend separately:
```powershell
cd frontend
npm run dev
```

Press `Ctrl+C` to stop all services.

### Troubleshooting

**Issue: "Class not found" or autoload errors**
```powershell
composer dump-autoload
```

**Issue: Database connection errors**
- Ensure SQLite is enabled in your `php.ini` (uncomment `extension=sqlite3`)
- Verify the database file path in `.env` matches your actual project location
- Check that the `database` folder has write permissions

**Issue: Frontend not loading**
- Make sure Next.js is running: `cd frontend && npm run dev`
- Check that Next.js is accessible at `http://localhost:3000`
- Verify the API URL in `frontend/.env.local` is set to `http://localhost:8000/api`
- Clear Laravel cache: `php artisan cache:clear`

**Issue: Storage link not working**
- On Windows, you may need to run PowerShell as Administrator
- Or manually create the symlink using: `mklink /D public\storage storage\app\public`

**Issue: Permission errors**
- Ensure the `storage` and `bootstrap/cache` directories are writable
- On Windows, check folder permissions in Properties > Security

**Issue: Port 8000 already in use**
- Use a different port: `php artisan serve --port=8001`
- Update `APP_URL` in `.env` accordingly

### Additional Commands

- Clear all caches:
  ```powershell
  php artisan optimize:clear
  ```

- Run tests:
  ```powershell
  composer run test
  ```

- View routes:
  ```powershell
  php artisan route:list
  ```

- Access Tinker (Laravel REPL):
  ```powershell
  php artisan tinker
  ```

---

## Frontend Architecture

The application uses a **Next.js 16** frontend (React 19) that communicates with the Laravel API backend:

- **Frontend**: Next.js application running on `http://localhost:3000`
- **Backend API**: Laravel API running on `http://127.0.0.1:8000/api`
- **Authentication**: Token-based authentication using Laravel Sanctum
- **Styling**: Tailwind CSS v4 with custom design system

The Next.js frontend includes:
- Authentication page (`/auth`) - Register and login
- Manager dashboard (`/manager`) - Full management interface
- Staff dashboard (`/staff`) - Staff operations
- Renter dashboard (`/renter`) - Renter interface
- Users management (`/users`) - User administration
- Vehicles management (`/vehicles`) - Vehicle CRUD operations
- Profile page (`/profile`) - User profile management

## Serving uploaded images

Uploaded vehicle images are stored on the `public` disk. To serve them from the `/storage` URL run:

```powershell
php artisan storage:link
```

After that, uploaded images saved by the Vehicles admin will be accessible under `/storage/vehicles/...`.
