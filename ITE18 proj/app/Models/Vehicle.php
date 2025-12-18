<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Vehicle extends Model
{
    use HasFactory;

    protected $table = 'vehicles';
    protected $primaryKey = 'vehicle_id';
    public $timestamps = true;

    protected $fillable = [
        'type',
        'model',
        'plate_number',
        'price_per_day',
        'status',
        'image_url',
    ];

    // Relationships
    public function rentals()
    {
        return $this->hasMany(Rentals::class, 'vehicle_id', 'vehicle_id');
    }
}
