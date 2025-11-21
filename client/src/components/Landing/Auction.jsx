import { FaClock, FaArrowRight, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router";
// import { AdsComponent } from "../AdsComponent";

export const Auction = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-sky-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900">Live Auctions</h2>
          <Link
            to="/signup"
            className="text-sky-600 hover:text-sky-700 flex items-center font-semibold transition-colors group"
          >
            View all <FaChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-2">
          {/* Auction Item 1 */}
          <div className="border-2 border-sky-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white hover:scale-105 transform">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644725/miekytfqgwnlj4jqai5k.png"
                alt="Vintage Camera"
                className="w-full h-48 object-contain bg-gray-50"
              />
              <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
                <FaClock className="inline h-3 w-3 mr-1" />
                2h 15m
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg">
                Vintage Film Camera - Excellent Condition
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Current Bid</p>
                  <p className="text-xl font-bold text-sky-600">$245.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Bids</p>
                  <p className="text-lg font-bold text-gray-700">12</p>
                </div>
              </div>
              <Link to='/signup'>
                <div className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-center py-3 px-4 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg">
                  Place Bid
                </div>
              </Link>
            </div>
          </div>

          {/* Auction Item 2 */}
          <div className="border-2 border-sky-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white hover:scale-105 transform">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644637/lk7l3ar3sptniptieyo3.png"
                alt="Antique Watch"
                className="w-full h-48 object-contain bg-gray-50"
              />
              <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
                <FaClock className="inline h-3 w-3 mr-1" />
                5h 42m
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg">
                Luxury Swiss Watch - Gold Plated
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Current Bid</p>
                  <p className="text-xl font-bold text-sky-600">$1,250.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Bids</p>
                  <p className="text-lg font-bold text-gray-700">28</p>
                </div>
              </div>
              <Link to='/signup'>
                <div className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-center py-3 px-4 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg">
                  Place Bid
                </div>
              </Link>
            </div>
          </div>

          {/* Auction Item 3 */}
          <div className="border-2 border-sky-100 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white hover:scale-105 transform">
            <div className="relative">
              <img
                src="https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644675/tatznfsoekfp3vsoeswd.png"
                alt="Art Painting"
                className="w-full h-48 object-contain bg-gray-50"
              />
              <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
                <FaClock className="inline h-3 w-3 mr-1" />
                1d 3h
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg">
                Original Oil Painting - Abstract Art
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Current Bid</p>
                  <p className="text-xl font-bold text-sky-600">$890.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Bids</p>
                  <p className="text-lg font-bold text-gray-700">7</p>
                </div>
              </div>
              <Link to='/signup'>
                <div className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-center py-3 px-4 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg">
                  Place Bid
                </div>
              </Link>
            </div>
          </div>
        </div>
        {/* <AdsComponent dataAdSlot="5537585913" /> */}
      </div>
    </section>
  );
};
