import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-8"><h1 className="text-2xl font-bold">Intelligent Document Management System</h1></div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

