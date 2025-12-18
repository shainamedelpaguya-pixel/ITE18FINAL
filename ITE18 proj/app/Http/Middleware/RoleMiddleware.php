<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Expect route middleware parameter like 'role:manager' or 'role:staff,manager'
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (empty($roles)) {
            return $next($request);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json(['message' => 'Forbidden - insufficient role'], 403);
        }

        return $next($request);
    }
}
