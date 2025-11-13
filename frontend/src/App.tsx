import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import DocumentUpload from './pages/DocumentUpload'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const initializeTheme = useThemeStore((state) => state.initialize)

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  return (
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

