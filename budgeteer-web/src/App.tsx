import { Route, Routes } from 'react-router'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Landing from './pages/Landing'
import Home from './pages/Home'

export default function App() {
  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="/">Budgeteer</Navbar.Brand>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Home />} />
      </Routes>
    </>
  )
}
