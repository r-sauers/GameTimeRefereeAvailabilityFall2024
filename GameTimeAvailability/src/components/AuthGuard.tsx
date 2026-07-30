// src/components/AuthGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const AuthGuard = () => {
  const { user, loading, signOutUser } = useAuth();

  const signOutWithRedirect = async () => {
    try {
      await signOutUser();
    } finally {
      window.location.href = window.location.href.replace("logout", "login");
    }
  };

  if (loading) return <div>Loading…
    <button className="btn mx-3" style={{maxHeight: "3rem"}} onClick={signOutWithRedirect}>Force Sign Out</button>
  </div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
