<?php

namespace App\Http\Controllers;

use App\Models\Renter;
use Illuminate\Http\Request;

class RenterController extends Controller
{
    public function index() { return response()->json(Renter::all(), 200); }
    public function show($id) {
        $renter = Renter::find($id);
        if (!$renter) return response()->json(['message' => 'Renter not found'], 404);
        return response()->json($renter, 200);
    }
    public function store(Request $request) {
        $renter = Renter::create($request->all());
        return response()->json($renter, 201);
    }
    public function update(Request $request, $id) {
        $renter = Renter::find($id);
        if (!$renter) return response()->json(['message' => 'Renter not found'], 404);
        $renter->update($request->all());
        return response()->json($renter, 200);
    }
    public function destroy($id) {
        $renter = Renter::find($id);
        if (!$renter) return response()->json(['message' => 'Renter not found'], 404);
        $renter->delete();
        return response()->json(['message' => 'Renter deleted'], 200);
    }
//////////////////////////////////////////////////////////////////////////////////////
    public function getRenters() {
        $data = Renter::all();
        return response()->json($data);
    }

    public function getFirstRenter() {
        $data = Renter::first();
        return response()->json($data);
    }

    public function getSortedRenters() {
        $data = Renter::orderBy('full_name', 'asc')->get();
        return response()->json($data);
    }

    public function countRenters() {
        $data = Renter::count();
        return response()->json(['total_renters' => $data]);
    }

    // Utility: create a sample renter (for testing/demo)
    public function createSampleRenter() {
        $data = Renter::create([
            'full_name' => 'Sample Renter',
            'email' => 'sample.renter@example.com',
            'phone' => '0000000000',
            'username' => 'sample_renter',
            'password_hash' => bcrypt('password'),
            'created_at' => now()
        ]);
        return response()->json($data, 201);
    }

    // Utility: update only the full_name by id
    public function updateRenterName($id, Request $request) {
        $newName = $request->input('full_name');
        if (!$newName) {
            return response()->json(['message' => 'full_name is required'], 422);
        }
        $renter = Renter::find($id);
        if (!$renter) return response()->json(['message' => 'Renter not found'], 404);
        $renter->update(['full_name' => $newName]);
        return response()->json($renter);
    }

    // Utility: delete renter by id
    public function deleteRenterById($id) {
        $renter = Renter::find($id);
        if (!$renter) return response()->json(['message' => 'Renter not found'], 404);
        $renter->delete();
        return response()->json(['message' => 'Renter deleted']);
    }

}

