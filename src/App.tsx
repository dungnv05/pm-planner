import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CadenceProvider } from './components/CadenceProvider'
import { HomePage } from './pages/HomePage'
import { PlannerPage } from './pages/PlannerPage'
import { RoadmapPage } from './pages/RoadmapPage'
import { CadencePage } from './pages/CadencePage'
import './styles/app.css'

export default function App() {
  return (
    <BrowserRouter>
      <CadenceProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/cadence" element={<CadencePage />} />
        </Routes>
      </CadenceProvider>
    </BrowserRouter>
  )
}
