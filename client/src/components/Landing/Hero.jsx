import React from "react";
import { Link } from "react-router";

export const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-sky-50 via-white to-cyan-50 pt-16 pb-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            The Future of
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-500">
              Online Auction
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Discover unique items, place competitive bids, and sell your
            treasures to a global audience. Join thousands of buyers and sellers
            in our trusted marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link to="/signup">
              <button className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-10 py-4 rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform">
                Get Started
              </button>
            </Link>
            <Link to="/login">
              <button className="bg-white text-sky-600 border-2 border-sky-500 px-10 py-4 rounded-xl hover:bg-sky-50 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
