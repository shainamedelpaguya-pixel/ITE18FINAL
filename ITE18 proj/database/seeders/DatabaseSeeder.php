<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Database\Seeders\UsersTableSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------
        // Renters
        // -------------------
        $renters = [];
        for ($i = 0; $i < 10; $i++) {
            $renters[] = [
                'full_name'     => fake()->name(),
                'email'         => fake()->unique()->safeEmail(),
                'phone'         => fake()->phoneNumber(),
                'username'      => fake()->unique()->userName(),
                'password_hash' => bcrypt('password123'), // default password
                'created_at'    => now(),
            ];
        }
        DB::table('renters')->insert($renters);

        // -------------------
        // Vehicles
        // -------------------
        $vehicles = [];
        for ($i = 0; $i < 10; $i++) {
            $vehicles[] = [
                'type'          => fake()->randomElement(['Car', 'Van', 'Motorcycle']),
                'model'         => fake()->company() . ' ' . fake()->word(),
                'plate_number'  => strtoupper(fake()->bothify('???-####')),
                'price_per_day' => fake()->randomFloat(2, 500, 5000),
                'status'        => fake()->randomElement(['available', 'rented', 'maintenance']),
                'image_url'     => 'https://picsum.photos/seed/vehicle' . $i . '/640/360',
                'created_at'    => now(),
            ];
        }
        DB::table('vehicles')->insert($vehicles);

        // -------------------
        // Employees
        // -------------------
        $employees = [];
        for ($i = 0; $i < 10; $i++) {
            $employees[] = [
                'full_name'     => fake()->name(),
                'position'      => fake()->randomElement(['Staff', 'Manager', 'Supervisor', 'Clerk']),
                'role'          => fake()->randomElement(['staff', 'manager']),
                'username'      => fake()->unique()->userName(),
                'password_hash' => bcrypt('password'),
                'last_login'    => fake()->optional()->dateTimeThisYear(),
                'created_at'    => now(),
            ];
        }
        DB::table('employees')->insert($employees);

        // -------------------
        // Rentals
        // -------------------
        $rentals = [];
        $renterIds   = DB::table('renters')->pluck('renter_id');
        $vehicleIds  = DB::table('vehicles')->pluck('vehicle_id');
        $employeeIds = DB::table('employees')->pluck('employee_id');

        for ($i = 0; $i < 10; $i++) {
            $start = fake()->dateTimeBetween('-1 month', 'now');
            $end   = (clone $start)->modify('+' . rand(1, 10) . ' days');

            $rentals[] = [
                'renter_id'     => $renterIds->random(),
                'vehicle_id'    => $vehicleIds->random(),
                'approved_by_id'=> fake()->boolean(80) ? $employeeIds->random() : null, // 80% approved
                'start_date'    => $start,
                'end_date'      => $end,
                'total_cost'    => fake()->randomFloat(2, 1000, 50000),
                'status'        => fake()->randomElement(['ongoing', 'completed', 'cancelled']),
                'created_at'    => now(),
            ];
        }
        DB::table('rentals')->insert($rentals);

        // -------------------
        // Payments
        // -------------------
        $payments = [];
        $rentalIds = DB::table('rentals')->pluck('rental_id');

        foreach ($rentalIds as $rentalId) {
            $numPayments = rand(0, 2);
            for ($j = 0; $j < $numPayments; $j++) {
                $payments[] = [
                    'rental_id'    => $rentalId,
                    'amount'       => fake()->randomFloat(2, 500, 20000),
                    'payment_date' => fake()->dateTimeBetween('-1 month', 'now'),
                    'method'       => fake()->randomElement(['cash', 'card', 'gcash']),
                    'created_at'   => now(),
                ];
            }
        }
        DB::table('payments')->insert($payments);

        // Seed example users (manager, staff, renter)
        $this->call(UsersTableSeeder::class);
    }
}
