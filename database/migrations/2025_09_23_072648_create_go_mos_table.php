<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('renters', function (Blueprint $table) {
    $table->increments('renter_id');
    $table->string('full_name', 100);
    $table->string('email', 100)->unique();
    $table->string('phone', 20)->nullable();
    $table->string('username', 50)->unique();       // login username
    $table->string('password_hash', 255);           // encrypted password
    $table->timestamp('created_at')->useCurrent();
    });

    Schema::create('vehicles', function (Blueprint $table) {
        $table->increments('vehicle_id');
        $table->string('type', 50);
        $table->string('model', 100);
        $table->string('plate_number', 20)->unique();
        $table->decimal('price_per_day', 10, 2);
        $table->string('status', 20)->default('available');
        $table->timestamps();
    });

    Schema::create('employees', function (Blueprint $table) {
         $table->increments('employee_id'); // Auto-incrementing primary key
         $table->string('full_name', 100);
         $table->string('position', 50)->nullable();  
         // Role: restrict to 'staff' or 'manager'
         $table->enum('role', ['staff', 'manager'])->default('staff'); 
         $table->string('username', 50)->unique();
         $table->string('password_hash', 255);
         $table->timestamp('last_login')->nullable();
         // Optional: timestamps for created/updated tracking
         $table->timestamps();
    });

    Schema::create('rentals', function (Blueprint $table) {
        $table->increments('rental_id');
    $table->unsignedInteger('renter_id');
    $table->unsignedInteger('vehicle_id');
    
    // FIXED approved_by_id column
    $table->unsignedInteger('approved_by_id')->nullable();

    $table->date('start_date');
    $table->date('end_date');
    $table->decimal('total_cost', 10, 2)->nullable();
    $table->string('status', 20)->default('ongoing');
    $table->timestamps();

    // Foreign keys
    $table->foreign('renter_id')->references('renter_id')->on('renters')->onDelete('cascade');
    $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles')->onDelete('cascade');
    $table->foreign('approved_by_id')->references('employee_id')->on('employees')->nullOnDelete();
    });

    Schema::create('payments', function (Blueprint $table) {
        $table->increments('payment_id');
        $table->unsignedInteger('rental_id');
        $table->decimal('amount', 10, 2);
        $table->timestamp('payment_date')->useCurrent();
        $table->string('method', 50)->nullable();
        $table->timestamps();
        // Foreign key
        $table->foreign('rental_id')->references('rental_id')->on('rentals')->onDelete('cascade');
    });

}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('rentals');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('renters');
    }
};
