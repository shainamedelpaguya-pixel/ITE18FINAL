<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Renter;
use App\Models\Employees;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->only(['name', 'email', 'password', 'role']);

        // Public registration is now ONLY for renters
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Force role to 'renter' for public registration
        $data['role'] = 'renter';

        // Create the user and the matching renter record in a transaction
        try {
            $user = DB::transaction(function () use ($data) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'role' => $data['role'],
                ]);

                // derive username from email local part
                $username = explode('@', $data['email'])[0];

                // Create renter record
                Renter::create([
                    'full_name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => null,
                    'username' => $username,
                    'password_hash' => bcrypt($data['password']),
                    'created_at' => now(),
                ]);

                return $user;
            });
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Registration failed', 'error' => $e->getMessage()], 500);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    // Manager-only: Create staff/manager account
    public function createStaff(Request $request)
    {
        $data = $request->only(['name', 'email', 'password', 'role']);

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:staff,manager',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the user and the matching employee record in a transaction
        try {
            $user = DB::transaction(function () use ($data) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'role' => $data['role'],
                ]);

                // derive username from email local part
                $username = explode('@', $data['email'])[0];

                // Create employee record for staff/manager
                Employees::create([
                    'full_name' => $data['name'],
                    'position' => ucfirst($data['role']),
                    'role' => $data['role'],
                    'username' => $username,
                    'password_hash' => bcrypt($data['password']),
                    'last_login' => null,
                ]);

                return $user;
            });
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Staff creation failed', 'error' => $e->getMessage()], 500);
        }

        return response()->json(['user' => $user, 'message' => 'Staff account created successfully'], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->only(['email', 'password']);

        $validator = Validator::make($credentials, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 200);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            // Revoke current token
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Logged out'], 200);
        }
        return response()->json(['message' => 'Not authenticated'], 401);
    }
}
