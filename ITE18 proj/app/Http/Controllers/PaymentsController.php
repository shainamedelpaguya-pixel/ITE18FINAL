<?php

namespace App\Http\Controllers;

use App\Models\Payments;
use App\Models\Rentals;
use App\Models\Renter;
use Illuminate\Http\Request;

class PaymentsController extends Controller
{
    public function index() { return response()->json(Payments::all(), 200); }
    public function show($id) {
        $payment = Payments::find($id);
        if (!$payment) return response()->json(['message' => 'Payment not found'], 404);
        return response()->json($payment, 200);
    }
    public function store(Request $request) {
        $payment = Payments::create($request->all());
        return response()->json($payment, 201);
    }
    public function update(Request $request, $id) {
        $payment = Payments::find($id);
        if (!$payment) return response()->json(['message' => 'Payment not found'], 404);
        $payment->update($request->all());
        return response()->json($payment, 200);
    }
    public function destroy($id) {
        $payment = Payments::find($id);
        if (!$payment) return response()->json(['message' => 'Payment not found'], 404);
        $payment->delete();
        return response()->json(['message' => 'Payment deleted'], 200);
    }

    // Renter pays for their own approved rental
    public function payForRental(Request $request, $id)
    {
        $user = $request->user();
        $renter = Renter::where('email', $user->email)->first();
        if (!$renter) return response()->json(['message' => 'Renter profile not found'], 404);
        $rental = Rentals::find($id);
        if (!$rental) return response()->json(['message' => 'Rental not found'], 404);
        if ($rental->renter_id !== $renter->renter_id) return response()->json(['message' => 'Forbidden'], 403);
        if ($rental->status !== 'approved') return response()->json(['message' => 'Rental must be approved before payment'], 422);

        $amount = $request->input('amount', $rental->total_cost);
        if (!$amount || $amount <= 0) return response()->json(['message' => 'Invalid amount'], 422);

        $payment = Payments::create([
            'rental_id' => $rental->rental_id,
            'amount' => $amount,
            'payment_date' => now(),
            'method' => $request->input('method', 'online'),
        ]);

        // mark rental as paid
        $rental->status = 'paid';
        $rental->save();

        return response()->json(['payment' => $payment, 'rental' => $rental], 201);
    }
}

