<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Vehicle;

$vehicles = Vehicle::whereNull('image_url')->get();
foreach ($vehicles as $v) {
    $v->image_url = 'https://picsum.photos/seed/vehicle' . $v->vehicle_id . '/640/360';
    $v->save();
}

echo "Updated " . $vehicles->count() . " vehicles\n";
