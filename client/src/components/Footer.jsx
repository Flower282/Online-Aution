import { Link } from "react-router";
import { Gift, Heart, Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 py-10 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-10 text-4xl">❄️</div>
        <div className="absolute top-5 right-20 text-3xl"></div>
        <div className="absolute bottom-5 left-1/4 text-3xl"></div>
        <div className="absolute bottom-10 right-1/3 text-4xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
              <Gift className="h-6 w-6 christmas-sparkle" />
              Online Auction System
            </h3>
            <p className="text-emerald-100 text-sm flex items-center justify-center md:justify-start gap-1">
              <Heart className="h-4 w-4 inline" />
              Your trusted Christmas marketplace since 2025
            </p>
          </div>
          <div className="flex space-x-8">
            <Link
              to="/about"
              className="text-white hover:text-emerald-100 text-sm font-medium transition-all hover:scale-105 flex items-center gap-1"
            >
              About
            </Link>
            {/* Temporarily hidden Legal link */}
            {/* <Link
                to="/legal"
                className="text-white hover:text-emerald-100 text-sm font-medium transition-all hover:scale-105"
              >
                Legal
              </Link> */}
            <Link
              to="/contact"
              className="text-white hover:text-emerald-100 text-sm font-medium transition-all hover:scale-105 flex items-center gap-1"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="border-t border-emerald-400/30 mt-8 pt-6 text-center">
          <p className="text-emerald-50 text-sm flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            © 2025 Online Auction System. All rights reserved. Made with
            <Sparkles className="h-4 w-4" />
          </p>
        </div>
      </div>
    </footer>
  );
};
