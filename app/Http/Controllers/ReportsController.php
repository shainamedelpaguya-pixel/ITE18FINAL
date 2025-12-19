<?php

namespace App\Http\Controllers;

use App\Models\Rentals;
use App\Models\Vehicle;
use App\Models\Payments;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    // Revenue by month for the last 12 months
    public function revenue(Request $request)
    {
        $rows = Payments::select(
            DB::raw('DATE_FORMAT(payment_date, "%Y-%m") as month'),
            DB::raw('SUM(amount) as total')
        )
        ->where('payment_date', '>=', now()->subMonths(12))
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        return response()->json($rows);
    }

    // Vehicle usage: number of rentals per vehicle in last 12 months
    public function usage(Request $request)
    {
        $rows = Rentals::select(
            'vehicle_id',
            DB::raw('COUNT(*) as rentals_count')
        )
        ->where('created_at', '>=', now()->subMonths(12))
        ->groupBy('vehicle_id')
        ->orderByDesc('rentals_count')
        ->get();

        return response()->json($rows);
    }

    // Active rentals (approved/paid/rented) with basic details
    public function activeRentals(Request $request)
    {
        $rows = Rentals::whereIn('status', ['approved','paid','rented'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($rows);
    }

    // Rental history (returned, rejected, cancelled)
    public function history(Request $request)
    {
        $rows = Rentals::whereIn('status', ['returned', 'rejected', 'cancelled'])
            ->with(['renter', 'vehicle', 'approvedBy'])
            ->orderByDesc('end_date')
            ->get();
        return response()->json($rows);
    }

    // Clear all rental history
    public function clearHistory(Request $request)
    {
        $count = Rentals::whereIn('status', ['returned', 'rejected', 'cancelled'])->delete();
        return response()->json(['message' => 'All rental history cleared', 'deleted_count' => $count], 200);
    }
}


