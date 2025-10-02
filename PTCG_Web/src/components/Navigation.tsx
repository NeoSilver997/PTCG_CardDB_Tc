'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Zap,
  Shield,
  Sword,
  Gamepad2
} from 'lucide-react';
import { useI18n } from '../i18n/context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'home',
    icon: Home,
    description: 'Search and browse Pokemon TCG cards'
  },
  {
    href: '/deck-studio',
    label: 'deckBuilder',
    icon: Gamepad2,
    description: 'Build and manage your decks'
  },
  {
    href: '/inventory',
    label: 'inventory',
    icon: Package,
    description: 'Manage your card collection'
  },
  {
    href: '/market',
    label: 'market',
    icon: BarChart3,
    description: 'View market prices and trends'
  }
];

export default function Navigation() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle SSR case where i18n context might not be available
  if (!t || !t.nav) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Zap className="h-8 w-8 text-yellow-500" />
                  <Shield className="h-6 w-6 text-blue-500" />
                  <Sword className="h-6 w-6 text-red-500" />
                </div>
                <span className="text-xl font-bold text-gray-900">PTCG Hub</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      active
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.nav[item.label] || item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                      active
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div>{t.nav[item.label] || item.label}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}