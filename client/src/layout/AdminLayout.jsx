import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import LoadingScreen from "../components/LoadingScreen";

export const AdminLayout = () => {
  const { user, loading, isManualLogout } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirect if user manually logged out - they're being redirected to /
    if (isManualLogout) {
      return;
    }
    
    // Only redirect to login if user is on an admin path
    // Don't redirect if on public homepage (allows logout to work correctly)
    if (!loading && !user && location.pathname.startsWith("/admin")) {
      navigate("/login");
    }
    // Redirect to dashboard if authenticated but not admin (only when user exists)
    if (!loading && user && user.user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [loading, user, isManualLogout, navigate, location.pathname]);

  if (loading) return <LoadingScreen />;

  if (!user || user.user.role !== "admin") return null;

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
