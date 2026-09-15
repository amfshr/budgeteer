import { Route, Routes } from 'react-router'
import Landing from './pages/Landing'
import Home from './pages/Home'

export default function App() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Budgeteer
          </a>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Home />} />
      </Routes>
    </>
  )
}
