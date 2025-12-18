<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\RenterController;
use App\Http\Controllers\RentalsController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\PaymentsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ProfileController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

use App\Http\Controllers\AuthController;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']); // Renter self-registration only
Route::post('/login', [AuthController::class, 'login']);

// Protected auth route
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

Route::get('/ping', function () {
    return response()->json(['message' => 'API is working!']);
});

// Protect resources - require authentication
Route::middleware('auth:sanctum')->group(function () {
    // Example: employees routes allowed for staff and manager
    Route::middleware('role:staff,manager')->apiResource('employees', EmployeesController::class);

    // Renters can be managed by managers and renters themselves
    Route::middleware('role:manager,renter')->apiResource('renters', RenterController::class);

    // Rentals CRUD (base), plus workflow actions
    Route::apiResource('rentals', RentalsController::class);
    // Workflow: renter requests; staff/manager approve/reject; renter cancel; staff return
    Route::post('rentals/request', [RentalsController::class, 'requestRental'])->middleware('role:renter');
    Route::post('rentals/{id}/approve', [RentalsController::class, 'approve'])->middleware('role:staff,manager');
    Route::post('rentals/{id}/reject', [RentalsController::class, 'reject'])->middleware('role:staff,manager');
    Route::post('rentals/{id}/cancel', [RentalsController::class, 'cancel'])->middleware('role:renter');
    Route::post('rentals/{id}/return', [RentalsController::class, 'markReturned'])->middleware('role:staff,manager');

    // Vehicles: allow index/show to all authenticated; restrict create/update/delete/status to staff/manager
    Route::get('vehicles', [VehicleController::class, 'index']);
    Route::get('vehicles/{id}', [VehicleController::class, 'show']);
    Route::middleware('role:staff,manager')->group(function () {
        Route::post('vehicles', [VehicleController::class, 'store']);
        Route::put('vehicles/{id}', [VehicleController::class, 'update']);
        Route::delete('vehicles/{id}', [VehicleController::class, 'destroy']);
        Route::patch('vehicles/{id}/status', [VehicleController::class, 'updateStatus']);
    });

    // Payments: renters can pay only for their own approved rentals
    Route::post('rentals/{id}/pay', [PaymentsController::class, 'payForRental'])->middleware('role:renter');
    Route::apiResource('payments', PaymentsController::class)->middleware('role:manager');

    // Manager-only routes
    Route::middleware('role:manager')->group(function () {
        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/revenue', [ReportsController::class, 'revenue']);
            Route::get('/usage', [ReportsController::class, 'usage']);
            Route::get('/active', [ReportsController::class, 'activeRentals']);
            Route::get('/history', [ReportsController::class, 'history']);
            Route::delete('/history/clear', [ReportsController::class, 'clearHistory']);
        });
        
        // Create staff accounts
        Route::post('/staff/create', [AuthController::class, 'createStaff']);
    });
    // Additional renter helper endpoints (keep secured)
    Route::prefix('renters')->group(function () {
        Route::get('/list', [RenterController::class, 'getRenters']);
        Route::get('/first', [RenterController::class, 'getFirstRenter']);
        Route::get('/sorted', [RenterController::class, 'getSortedRenters']);
        Route::get('/count', [RenterController::class, 'countRenters']);
        // Sample/utility endpoints (limit to manager)
        Route::middleware('role:manager')->group(function () {
            Route::post('/sample', [RenterController::class, 'createSampleRenter']);
            Route::patch('/{id}/name', [RenterController::class, 'updateRenterName']);
            Route::delete('/{id}', [RenterController::class, 'deleteRenterById']);
        });
    });

    // Compatibility alias used by renter.js (expects /api/renterList)
    Route::get('/renterList', [RenterController::class, 'getRenters']);

    // Profile routes - all authenticated users can manage their own profile
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::post('/picture', [ProfileController::class, 'uploadPicture']);
        Route::delete('/picture', [ProfileController::class, 'deletePicture']);
    });
});





