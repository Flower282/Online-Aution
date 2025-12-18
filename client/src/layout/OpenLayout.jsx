import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import ScrollToTop from "../utils/ScrollToTop";
import { useSelector } from "react-redux";

export const OpenLayout = () => {
  const { user, loading, isManualLogout } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirect during manual logout - user should see public page
    if (isManualLogout) {
      return;
    }
    
    // If user is logged in and trying to access login/signup/landing, redirect appropriately
    if (!loading && user && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup")) {
      // Redirect admin to admin panel, regular users to dashboard
      const redirectPath = user.user.role === "admin" ? "/admin" : "/dashboard";
      navigate(redirectPath);
    }
  }, [loading, user, isManualLogout, navigate, location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
