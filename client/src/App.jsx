import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import PatientView from './pages/PatientView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient/:id" element={<PatientView />} />
      </Routes>
    </BrowserRouter>
  )
}