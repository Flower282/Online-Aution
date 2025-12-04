import { Link } from "react-router";
// import { AdsComponent } from "../components/AdsComponent";
import { useSelector } from "react-redux";

export const About = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-sky-100">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-500 mb-8">
            About This Project
          </h1>


        </div>
      </div>
    </div>
  );
};