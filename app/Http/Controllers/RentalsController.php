<?php

namespace App\Http\Controllers;

use App\Models\Rentals;
use App\Models\Renter;
use App\Models\Vehicle;
use App\Models\Employees;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RentalsController extends Controller
{
    public function index(Request $request) {
        $user = $request->user();
        
        // Filter by role: renters see only their rentals; staff/manager see all
        if ($user->role === 'renter') {
            $renter = Renter::where('email', $user->email)->first();
            if (!$renter) {
                return response()->json([], 200);
            }
            $rentals = Rentals::where('renter_id', $renter->renter_id)
                ->with(['renter', 'vehicle', 'approvedBy'])
                ->get();
        } else {
            // Staff and manager see all rentals
            $rentals = Rentals::with(['renter', 'vehicle', 'approvedBy'])->get();
        }
        
        return response()->json($rentals, 200);
    }
    public function show($id) {
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        return response()->json($rental, 200);
    }
    public function store(Request $request) {
        $data = $request->only(['renter_id','vehicle_id','approved_by_id','start_date','end_date','total_cost','status']);

        $validator = Validator::make($data, [
            'renter_id' => 'required|integer|exists:renters,renter_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'total_cost' => 'nullable|numeric',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Confirm renter and vehicle exist (exists rule should cover this, but double-check to return 404 if missing)
        $renter = Renter::find($data['renter_id']);
        if (!$renter) return response()->json(['message' => 'Renter not found'], 404);
        $vehicle = Vehicle::find($data['vehicle_id']);
        if (!$vehicle) return response()->json(['message' => 'Vehicle not found'], 404);

        // If total_cost not provided, compute from vehicle price_per_day and dates
        if (empty($data['total_cost'])) {
            $days = (new \DateTime($data['end_date']))->diff(new \DateTime($data['start_date']))->days + 1;
            $data['total_cost'] = round($vehicle->price_per_day * $days, 2);
        }

        // Ensure approved_by_id nullable; leave null if not provided
        if (empty($data['approved_by_id'])) {
            $data['approved_by_id'] = null;
        }

        $rental = Rentals::create($data);
        return response()->json($rental, 201);
    }
    public function update(Request $request, $id) {
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        
        // Only allow updating specific fields
        $data = $request->only(['renter_id','vehicle_id','approved_by_id','start_date','end_date','total_cost','status']);
        
        $validator = Validator::make($data, [
            'renter_id' => 'nullable|integer|exists:renters,renter_id',
            'vehicle_id' => 'nullable|integer|exists:vehicles,vehicle_id',
            'approved_by_id' => 'nullable|integer|exists:employees,employee_id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'total_cost' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:50',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Check for date conflicts if dates or vehicle are being updated
        if (isset($data['vehicle_id']) || isset($data['start_date']) || isset($data['end_date'])) {
            $vehicleId = $data['vehicle_id'] ?? $rental->vehicle_id;
            $startDate = $data['start_date'] ?? $rental->start_date;
            $endDate = $data['end_date'] ?? $rental->end_date;
            
            // Check for overlapping rentals (excluding current rental)
            $conflictingRental = Rentals::where('vehicle_id', $vehicleId)
                ->where('rental_id', '!=', $id)
                ->where(function($query) use ($startDate, $endDate) {
                    $query->where(function($q) use ($startDate, $endDate) {
                        // Check if requested dates overlap with existing rentals
                        $q->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate])
                          ->orWhere(function($q2) use ($startDate, $endDate) {
                              $q2->where('start_date', '<=', $startDate)
                                 ->where('end_date', '>=', $endDate);
                          });
                    })
                    ->whereIn('status', ['pending', 'approved', 'paid', 'rented']);
                })
                ->first();
            
            if ($conflictingRental) {
                return response()->json([
                    'message' => 'Vehicle is already rented for the selected dates',
                    'conflicting_rental_id' => $conflictingRental->rental_id
                ], 409);
            }
        }
        
        $rental->update($data);
        return response()->json($rental, 200);
    }
    public function destroy($id) {
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        $rental->delete();
        return response()->json(['message' => 'Rental deleted'], 200);
    }

    // Workflow: renter requests a rental
    public function requestRental(Request $request)
    {
        $user = $request->user();
        $renter = Renter::where('email', $user->email)->first();
        if (!$renter) return response()->json(['message' => 'Renter profile not found'], 404);

        $data = $request->only(['vehicle_id','start_date','end_date']);
        $data['renter_id'] = $renter->renter_id;

        $validator = Validator::make($data, [
            'renter_id' => 'required|integer|exists:renters,renter_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $vehicle = Vehicle::find($data['vehicle_id']);
        if (!$vehicle) return response()->json(['message' => 'Vehicle not found'], 404);
        if (in_array(strtolower($vehicle->status), ['reserved','rented','under maintenance', 'maintenance'])) {
            return response()->json(['message' => 'Vehicle not available'], 409);
        }

        // Check for date conflicts
        $conflictingRental = Rentals::where('vehicle_id', $data['vehicle_id'])
            ->where(function($query) use ($data) {
                $query->where(function($q) use ($data) {
                    $q->whereBetween('start_date', [$data['start_date'], $data['end_date']])
                      ->orWhereBetween('end_date', [$data['start_date'], $data['end_date']])
                      ->orWhere(function($q2) use ($data) {
                          $q2->where('start_date', '<=', $data['start_date'])
                             ->where('end_date', '>=', $data['end_date']);
                      });
                })
                ->whereIn('status', ['pending', 'approved', 'paid', 'rented']);
            })
            ->first();
        
        if ($conflictingRental) {
            return response()->json([
                'message' => 'Vehicle is already rented for the selected dates',
                'conflicting_rental_id' => $conflictingRental->rental_id
            ], 409);
        }

        // compute cost
        $days = (new \DateTime($data['end_date']))->diff(new \DateTime($data['start_date']))->days + 1;
        $data['total_cost'] = round($vehicle->price_per_day * $days, 2);
        $data['status'] = 'pending';
        $data['approved_by_id'] = null;

        $rental = Rentals::create($data);
        return response()->json($rental, 201);
    }

    // Workflow: staff/manager approve
    public function approve(Request $request, $id)
    {
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        if ($rental->status !== 'pending') return response()->json(['message' => 'Only pending rentals can be approved'], 422);

        $user = $request->user();
        $username = explode('@', $user->email)[0];
        $employee = Employees::where('username', $username)->first();
        $rental->approved_by_id = $employee ? $employee->employee_id : null;
        $rental->status = 'approved';
        $rental->save();

        // Check for date conflicts before approving
        $conflictingRental = Rentals::where('vehicle_id', $rental->vehicle_id)
            ->where('rental_id', '!=', $rental->rental_id)
            ->where(function($query) use ($rental) {
                $query->where(function($q) use ($rental) {
                    $q->whereBetween('start_date', [$rental->start_date, $rental->end_date])
                      ->orWhereBetween('end_date', [$rental->start_date, $rental->end_date])
                      ->orWhere(function($q2) use ($rental) {
                          $q2->where('start_date', '<=', $rental->start_date)
                             ->where('end_date', '>=', $rental->end_date);
                      });
                })
                ->whereIn('status', ['pending', 'approved', 'paid', 'rented']);
            })
            ->first();
        
        if ($conflictingRental) {
            return response()->json([
                'message' => 'Cannot approve: Vehicle is already rented for overlapping dates',
                'conflicting_rental_id' => $conflictingRental->rental_id
            ], 409);
        }
        
        // Reserve vehicle
        $vehicle = Vehicle::find($rental->vehicle_id);
        if ($vehicle) {
            $vehicle->status = 'reserved';
            $vehicle->save();
        }

        return response()->json($rental, 200);
    }

    // Workflow: staff/manager reject
    public function reject(Request $request, $id)
    {
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        if ($rental->status !== 'pending') return response()->json(['message' => 'Only pending rentals can be rejected'], 422);
        $rental->status = 'rejected';
        $rental->approved_by_id = null;
        $rental->save();
        return response()->json($rental, 200);
    }

    // Workflow: renter cancels (pending or approved)
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $renter = Renter::where('email', $user->email)->first();
        if (!$renter) return response()->json(['message' => 'Renter profile not found'], 404);
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        if ($rental->renter_id !== $renter->renter_id) return response()->json(['message' => 'Forbidden'], 403);
        if (!in_array($rental->status, ['pending','approved'])) return response()->json(['message' => 'Cannot cancel at this stage'], 422);
        $rental->status = 'cancelled';
        $rental->save();
        // set vehicle available if previously reserved
        $vehicle = Vehicle::find($rental->vehicle_id);
        if ($vehicle && strtolower($vehicle->status) === 'reserved') {
            $vehicle->status = 'available';
            $vehicle->save();
        }
        return response()->json($rental, 200);
    }

    // Workflow: staff marks returned
    public function markReturned(Request $request, $id)
    {
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        // Allow marking returned if approved or paid or rented
        if (!in_array($rental->status, ['approved','paid','rented'])) return response()->json(['message' => 'Rental not in returnable state'], 422);
        $rental->status = 'returned';
        $rental->save();
        $vehicle = Vehicle::find($rental->vehicle_id);
        if ($vehicle) {
            $vehicle->status = 'available';
            $vehicle->save();
        }
        return response()->json($rental, 200);
    }
}

