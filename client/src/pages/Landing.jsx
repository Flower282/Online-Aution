import { useSelector } from "react-redux";
import { CTA } from "../components/Landing/CTA";
import { Hero } from "../components/Landing/Hero";
import Dashboard from "./Dashboard";
import LoadingScreen from "../components/LoadingScreen";
import { Auction } from "../components/Landing/Auction";

export const Landing = () => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) return <LoadingScreen />;
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      {!user && (
        <>
          <Hero />
          <Auction />
          <CTA />
        </>
      )}
      {user && <Dashboard />}
    </div>
  );
};
