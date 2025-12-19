<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employees extends Model
{
    use HasFactory;

    protected $table = 'employees';
    protected $primaryKey = 'employee_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'full_name',
        'position',
        'role',
        'username',
        'password_hash',
        'last_login',
    ];

    /**
     * The attributes that should be hidden for arrays (like password).
     */
    protected $hidden = [
        'password_hash',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'last_login' => 'datetime',
    ];
}
