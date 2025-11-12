/**
 * Home page component
 */

import { useAuthStore } from '../store/authStore'

export default function Home() {
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = async () => {
    clearAuth()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Intelligent Document Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-gray-700 dark:text-gray-300">
                  {user.first_name} {user.last_name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Hoş geldiniz!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Belge yönetim sistemine başarıyla giriş yaptınız.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

