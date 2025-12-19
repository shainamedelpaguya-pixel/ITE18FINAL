<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(['email' => 'sean@gmail.com'], [
            'name' => 'Sean Morales',
            'password' => Hash::make('sean123'),
            'role' => 'manager',
        ]);

        User::updateOrCreate(['email' => 'jurls@gmail.com'], [
            'name' => 'Jurls Velasco',
            'password' => Hash::make('jurls123'),
            'role' => 'staff',
        ]);

        User::updateOrCreate(['email' => 'cedric@gmail.com'], [
            'name' => 'Cedric Uy',
            'password' => Hash::make('cedric123'),
            'role' => 'renter',
        ]);
    }
}
