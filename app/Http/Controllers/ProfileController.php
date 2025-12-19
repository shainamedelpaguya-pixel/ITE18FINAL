<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Renter;
use App\Models\Employees;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * Get current user's profile information
     */
    public function show(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $profile = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profile_picture' => $user->profile_picture,
        ];

        // Get additional info based on role
        if ($user->role === 'renter') {
            $renter = Renter::where('email', $user->email)->first();
            if ($renter) {
                $profile['phone'] = $renter->phone;
                $profile['username'] = $renter->username;
                $profile['full_name'] = $renter->full_name;
            }
        } elseif (in_array($user->role, ['staff', 'manager'])) {
            $username = explode('@', $user->email)[0];
            $employee = Employees::where('username', $username)->first();
            if ($employee) {
                $profile['position'] = $employee->position;
                $profile['username'] = $employee->username;
                $profile['full_name'] = $employee->full_name;
            }
        }

        return response()->json($profile, 200);
    }

    /**
     * Update profile information
     */
    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->only(['name', 'email', 'phone', 'position']);

        $validator = Validator::make($data, [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:20',
            'position' => 'sometimes|nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Prevent role changes through profile update (security measure)
        // Role changes should be handled by admin/manager endpoints only
        if ($request->has('role')) {
            return response()->json(['message' => 'Role cannot be changed through profile update'], 403);
        }

        try {
            DB::transaction(function () use ($user, $data) {
                // Get old email before updating
                $oldEmail = $user->email;
                $oldUsername = explode('@', $oldEmail)[0];

                // Update users table
                $userUpdate = [];
                if (isset($data['name'])) {
                    $userUpdate['name'] = $data['name'];
                }
                if (isset($data['email'])) {
                    $userUpdate['email'] = $data['email'];
                }
                if (!empty($userUpdate)) {
                    $user->update($userUpdate);
                    $user->refresh(); // Refresh to get new email
                }

                // Sync with renters table
                if ($user->role === 'renter') {
                    // Find renter by old email first
                    $renter = Renter::where('email', $oldEmail)->first();
                    if ($renter) {
                        $renterUpdate = [];
                        if (isset($data['name'])) {
                            $renterUpdate['full_name'] = $data['name'];
                        }
                        if (isset($data['email'])) {
                            $renterUpdate['email'] = $data['email'];
                        }
                        if (isset($data['phone'])) {
                            $renterUpdate['phone'] = $data['phone'];
                        }
                        if (!empty($renterUpdate)) {
                            $renter->update($renterUpdate);
                        }
                    }
                }

                // Sync with employees table
                if (in_array($user->role, ['staff', 'manager'])) {
                    // Find employee by old username first
                    $employee = Employees::where('username', $oldUsername)->first();
                    if ($employee) {
                        $employeeUpdate = [];
                        if (isset($data['name'])) {
                            $employeeUpdate['full_name'] = $data['name'];
                        }
                        if (isset($data['position'])) {
                            $employeeUpdate['position'] = $data['position'];
                        }
                        // Update username if email changed
                        if (isset($data['email'])) {
                            $newUsername = explode('@', $data['email'])[0];
                            $employeeUpdate['username'] = $newUsername;
                        }
                        if (!empty($employeeUpdate)) {
                            $employee->update($employeeUpdate);
                        }
                    }
                }
            });

            // Refresh user to get updated data
            $user->refresh();
            return $this->show($request);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Update failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Change password
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
            'confirm_password' => 'required|string|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verify current password
        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        try {
            DB::transaction(function () use ($user, $request) {
                $newPassword = Hash::make($request->input('new_password'));

                // Update users table
                $user->password = $newPassword;
                $user->save();

                // Sync with renters table
                if ($user->role === 'renter') {
                    $renter = Renter::where('email', $user->email)->first();
                    if ($renter) {
                        $renter->password_hash = $newPassword;
                        $renter->save();
                    }
                }

                // Sync with employees table
                if (in_array($user->role, ['staff', 'manager'])) {
                    $username = explode('@', $user->email)[0];
                    $employee = Employees::where('username', $username)->first();
                    if ($employee) {
                        $employee->password_hash = $newPassword;
                        $employee->save();
                    }
                }
            });

            return response()->json(['message' => 'Password updated successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Password update failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Upload/Update profile picture
     */
    public function uploadPicture(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'picture' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Delete old picture if exists
            if ($user->profile_picture && str_starts_with($user->profile_picture, '/storage/')) {
                $oldPath = public_path($user->profile_picture);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            // Upload new picture
            $file = $request->file('picture');
            $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->move(public_path('storage/profile-pictures'), $filename);
            $imageUrl = '/storage/profile-pictures/' . $filename;

            // Update user profile picture
            $user->profile_picture = $imageUrl;
            $user->save();

            return response()->json([
                'message' => 'Profile picture uploaded successfully',
                'profile_picture' => $imageUrl
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Picture upload failed', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete profile picture
     */
    public function deletePicture(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            if ($user->profile_picture && str_starts_with($user->profile_picture, '/storage/')) {
                $oldPath = public_path($user->profile_picture);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $user->profile_picture = null;
            $user->save();

            return response()->json(['message' => 'Profile picture deleted successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Picture deletion failed', 'error' => $e->getMessage()], 500);
        }
    }
}

