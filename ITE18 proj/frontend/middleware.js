import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect dashboard routes
  const protectedRoutes = ['/renter', '/staff', '/manager', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for token in cookies or headers (client-side check happens in component)
    // This is a basic check - full auth validation happens client-side
    const token = request.cookies.get('api_token')?.value;
    
    // Note: Since we're using localStorage (client-side), we can't check it here
    // The actual auth check happens in each page component
    // This middleware is mainly for future cookie-based auth
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/renter/:path*', '/staff/:path*', '/manager/:path*', '/profile/:path*'],
};

