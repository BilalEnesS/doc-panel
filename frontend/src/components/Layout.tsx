/**
 * Protected layout component
 */

import Navbar from './Navbar';

interface LayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Layout({ title, description, actions, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 transition dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            )}
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}


