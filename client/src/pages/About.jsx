// import { AdsComponent } from "../components/AdsComponent";
import { Features } from "../components/Landing/Features";

export const About = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-emerald-200" data-aos="fade-up">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-8" data-aos="zoom-in" data-aos-delay="100">
            🎅 About This Christmas Project ❤️
          </h1>


        </div>
      </div>
      
      {/* Features Section */}
      <Features />
    </div>
  );
};

