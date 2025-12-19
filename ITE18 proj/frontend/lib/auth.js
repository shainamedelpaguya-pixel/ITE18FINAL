'use client';

import { useRouter } from 'next/navigation';

export function redirectByRole(role) {
  if (role === 'renter') return '/renter';
  if (role === 'staff') return '/staff';
  if (role === 'manager') return '/manager';
  return '/auth';
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('api_token');
  }
  return null;
}

export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('api_token', token);
  }
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('api_token');
  }
}

