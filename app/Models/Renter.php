<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Renter extends Model
{
    use HasFactory; 

    protected $table = 'renters';
    protected $primaryKey = 'renter_id';
    public $timestamps = false; // you only have created_at, not updated_at

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'created_at',
        'username',
        'password_hash',
    ];

    // Relationships
    public function rentals()
    {
        return $this->hasMany(Rentals::class, 'renter_id', 'renter_id');
    }
}
