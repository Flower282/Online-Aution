import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import ScrollToTop from "../utils/ScrollToTop";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export const MainLayout = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    // Redirect admin from index route to admin panel
    if (!loading && user && user.user.role === "admin" && location.pathname === "/") {
      navigate("/admin");
    }
  }, [loading, user, navigate, location.pathname]);

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
