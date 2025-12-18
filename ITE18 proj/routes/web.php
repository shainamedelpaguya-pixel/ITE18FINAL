<?php

use Illuminate\Support\Facades\Route;

// Frontend is served by Next.js application
// Access the frontend at: http://localhost:3000
// API endpoints are available at: http://localhost:8000/api

Route::get('/', function () {
    // Redirect to Next.js frontend if running, otherwise show info
    $nextJsUrl = env('NEXTJS_URL', 'http://localhost:3000');
    return redirect($nextJsUrl);
});





