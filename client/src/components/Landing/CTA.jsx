import { Link } from "react-router";

export const CTA = () => {
  return (
    <section className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 py-20 md:py-24 overflow-hidden">
      {/* Christmas Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"></div>

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          🎅 Ready to Start Your Christmas Auction Journey? 🎁
        </h2>
        <p className="text-xl text-red-50 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join our community today and discover amazing Christmas deals or turn your items
          into cash. Getting started is quick and easy! ❄️
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link to="/signup">
            <div className="bg-white cursor-pointer text-red-600 px-10 py-4 rounded-xl hover:bg-red-50 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transform">
              🎄 Join Now
            </div>
          </Link>
          <Link to="/auction">
            <div className="bg-transparent border-2 border-white cursor-pointer text-white px-10 py-4 rounded-xl hover:bg-white/10 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform">
              ❤️ Explore Auctions
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
