// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { AdminGuard } from "./components/AdminGuard";

import LogoutPage from "./pages/LogoutPage";
import LoginPage from "./pages/LoginPage";
import RefereePage from "./pages/RefereePage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route path="/" element={<RefereePage />} />
          </Route>
          <Route element={<AdminGuard />}>
            <Route path="/admin/*" element={<AdminPage />} />
          </Route>
          {/* Catch‑all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
