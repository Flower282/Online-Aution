import { Link } from "react-router";

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-sky-600 to-cyan-600 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">
              Online Auction System
            </h3>
            <p className="text-sky-100 text-sm">
              Your trusted marketplace since 2025
            </p>
          </div>
          <div className="flex space-x-8">
            <Link
              to="/about"
              className="text-white hover:text-sky-100 text-sm font-medium transition-all hover:scale-105"
            >
              About
            </Link>
            {/* Temporarily hidden Legal link */}
            {/* <Link
                to="/legal"
                className="text-white hover:text-sky-100 text-sm font-medium transition-all hover:scale-105"
              >
                Legal
              </Link> */}
            <Link
              to="/contact"
              className="text-white hover:text-sky-100 text-sm font-medium transition-all hover:scale-105"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="border-t border-sky-400/30 mt-8 pt-6 text-center">
          <p className="text-sky-50 text-sm">
            © 2025 Online Auction System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
