'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

export default function UserMenu() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt.verify(token, 'your-secret-key') as { username: string };
        setUser(decoded);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  return (
    <div className="flex items-center space-x-2">
      {user ? (
        <>
          <span className="text-gray-700">Welcome, {user.username}</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">
            Logout
          </button>
        </>
      ) : (
        <>
          <a href="/login" className="bg-blue-500 text-white px-3 py-1 rounded">
            Login
          </a>
          <a href="/register" className="bg-green-500 text-white px-3 py-1 rounded">
            Register
          </a>
        </>
      )}
    </div>
  );
}