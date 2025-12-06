import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import TenantDashboard from "./pages/TenantDashboard";
import GMDashboard from "./pages/GMDashboard";
import DeptDashboard from "./pages/DeptDashboard";
import StaffDashboard from "./pages/StaffDashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/tenant"
            element={
              <ProtectedRoute allowedRoles={["tenant"]}>
                <TenantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gm"
            element={
              <ProtectedRoute allowedRoles={["gm"]}>
                <GMDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dept"
            element={
              <ProtectedRoute allowedRoles={["dept"]}>
                <DeptDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
