import { Navigate, Route, Routes } from 'react-router'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import LoginPage from './features/auth/LoginPage'
import MagicLinkSentPage from './features/auth/MagicLinkSentPage'
import VerifyPage from './features/auth/VerifyPage'
import RequireAuth from './features/auth/RequireAuth'
import ConnectPage from './features/monzo/ConnectPage'
import TransactionsPage from './features/transactions/TransactionsPage'
import Home from './pages/Home'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/auth/sent" element={<MagicLinkSentPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Home />} />
          <Route path="/app/transactions" element={<TransactionsPage />} />
          <Route path="/app/connect" element={<ConnectPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
