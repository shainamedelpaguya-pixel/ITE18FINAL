<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;


class VehicleController extends Controller
{
    public function index() { return response()->json(Vehicle::all(), 200); }
    public function show($id) {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) return response()->json(['message' => 'Vehicle not found'], 404);
        return response()->json($vehicle, 200);
    }
    public function store(Request $request) {
        // Map frontend form field names (v_*) to model columns and validate
        $mapped = [
            'type' => $request->input('v_type', $request->input('type')),
            'model' => $request->input('v_model', $request->input('model')),
            'plate_number' => $request->input('v_plate', $request->input('plate_number')),
            'price_per_day' => $request->input('v_price', $request->input('price_per_day')),
            'status' => strtolower($request->input('v_status', $request->input('status', 'available'))),
        ];

        $validator = \Validator::make($mapped, [
            'type' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'plate_number' => 'required|string|max:255',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'nullable|string|max:50',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $mapped;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            
            // Validate file type and size
            $validator = \Validator::make(['image' => $file], [
                'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5MB max
            ]);
            
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->move(public_path('storage/vehicles'), $filename);
            $data['image_url'] = '/storage/vehicles/' . $filename;
        }
        $vehicle = Vehicle::create($data);
        return response()->json($vehicle, 201);
    }
    public function update(Request $request, $id) {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) return response()->json(['message' => 'Vehicle not found'], 404);
        // Map incoming fields, falling back to existing values when not provided
        $mapped = [
            'type' => $request->input('v_type', $request->input('type', $vehicle->type)),
            'model' => $request->input('v_model', $request->input('model', $vehicle->model)),
            'plate_number' => $request->input('v_plate', $request->input('plate_number', $vehicle->plate_number)),
            'price_per_day' => $request->input('v_price', $request->input('price_per_day', $vehicle->price_per_day)),
            'status' => $request->input('v_status', $request->input('status', $vehicle->status)),
        ];

        $validator = \Validator::make($mapped, [
            'type' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'plate_number' => 'required|string|max:255',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'nullable|string|max:50',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $mapped;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            
            // Validate file type and size
            $validator = \Validator::make(['image' => $file], [
                'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:5120', // 5MB max
            ]);
            
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            // delete old image if it exists
            if ($vehicle->image_url && str_starts_with($vehicle->image_url, '/storage/')) {
                $oldPath = public_path($vehicle->image_url);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->move(public_path('storage/vehicles'), $filename);
            $data['image_url'] = '/storage/vehicles/' . $filename;
        }
        $vehicle->update($data);
        return response()->json($vehicle, 200);
    }
    public function destroy($id) {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) return response()->json(['message' => 'Vehicle not found'], 404);
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle deleted'], 200);
    }

    // Staff/Manager: update only the vehicle status
    public function updateStatus(Request $request, $id)
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) return response()->json(['message' => 'Vehicle not found'], 404);
        $status = $request->input('status');
        if (!$status) return response()->json(['message' => 'status is required'], 422);
        $vehicle->status = strtolower($status);
        $vehicle->save();
        return response()->json($vehicle, 200);
    }
}

