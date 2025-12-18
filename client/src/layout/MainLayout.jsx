import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import ScrollToTop from "../utils/ScrollToTop";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export const MainLayout = () => {
  const { user, loading, isManualLogout } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirect if user manually logged out - they're being redirected to /
    if (isManualLogout) {
      return;
    }
    
    // Only redirect to login if user is trying to access a protected route
    // Don't redirect if on public homepage (allows logout to work correctly)
    if (!loading && !user && location.pathname !== "/") {
      navigate("/login");
    }
  }, [loading, user, isManualLogout, navigate, location.pathname]);

  if (loading) return <LoadingScreen />;

  if (!user) return null; // Prevents flashing protected content before redirect

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
