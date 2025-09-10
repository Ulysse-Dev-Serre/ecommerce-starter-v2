"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="bg-background border-b border-border theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold theme-primary">
              Votre Boutique
            </h1>
          </div>

          {/* Navigation Links - placeholder for future menu */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Add navigation items here when needed */}
          </nav>

          {/* Right side - Auth & Cart */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <div className="flex items-center space-x-2">
                <SignInButton />
                <SignUpButton>
                  <button className="bg-primary text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-primary-hover transition-colors">
                    S'inscrire
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-2">
                {/* Cart button - placeholder */}
                <button className="text-foreground hover:text-muted-foreground p-2">
                  🛒
                </button>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
