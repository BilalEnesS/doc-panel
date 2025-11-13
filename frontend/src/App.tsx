import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import DocumentUpload from './pages/DocumentUpload'
import DocumentDetail from './pages/DocumentDetail'
import SemanticSearch from './pages/SemanticSearch'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    },
  },
})

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const initializeTheme = useThemeStore((state) => state.initialize)

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/upload"
            element={
              <ProtectedRoute>
                <DocumentUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SemanticSearch />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

