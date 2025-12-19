<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Rentals extends Model
{
    use HasFactory; 

    protected $table = 'rentals';
    protected $primaryKey = 'rental_id';
    public $timestamps = true;

    protected $fillable = [
        'renter_id',
        'vehicle_id',
        'approved_by_id',
        'start_date',
        'end_date',
        'total_cost',
        'status',
    ];

    // Relationships
    public function renter()
    {
        return $this->belongsTo(Renter::class, 'renter_id', 'renter_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function payments()
    {
        return $this->hasMany(Payments::class, 'rental_id', 'rental_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(Employees::class, 'approved_by_id', 'employee_id');
    }

}
