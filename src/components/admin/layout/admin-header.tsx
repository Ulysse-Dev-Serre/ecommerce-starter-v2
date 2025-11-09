'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Menu } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* User menu */}
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
