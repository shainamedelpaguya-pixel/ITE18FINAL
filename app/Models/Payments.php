<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payments extends Model
{
    use HasFactory; 

    protected $table = 'payments';
    protected $primaryKey = 'payment_id';
    public $timestamps = true;

    protected $fillable = [
        'rental_id',
        'amount',
        'payment_date',
        'method',
    ];

    // Relationships
    public function rental()
    {
        return $this->belongsTo(Rentals::class, 'rental_id', 'rental_id');
    }
}
