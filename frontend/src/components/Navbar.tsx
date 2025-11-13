/**
 * Application navbar
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useMemo } from 'react';
import clsx from 'clsx';

const navigationItems = [
  { label: 'Overview', to: '/' },
  { label: 'Upload', to: '/documents/upload' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore((state) => ({
    user: state.user,
    clearAuth: state.clearAuth,
  }));
  const { theme, toggleTheme } = useThemeStore((state) => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
  }));

  const initials = useMemo(() => {
    if (!user) return '';
    const first = user.first_name?.[0] ?? '';
    const last = user.last_name?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="rounded-full bg-blue-600/10 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path d="M20 7H4m16 5H8m12 5h-8m-7.5 4.5v-15a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2v15l-4-2-4 2-4-2-4 2Z" />
              </svg>
            </span>
            <div className="hidden flex-col sm:flex">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                Doc Panel
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Intelligent Document Management
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navigationItems.map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={clsx(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Tema değiştir"
          >
            {theme === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.05 16.95l-1.42 1.42m12.73 0-1.42-1.42M7.05 7.05 5.63 5.63" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path d="M16.5 3.5A9 9 0 1 0 20.5 16 7 7 0 0 1 16.5 3.5Z" />
              </svg>
            )}
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            {user && (
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/30">
              {initials || 'DP'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-gray-900/40 transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>
  );
}


