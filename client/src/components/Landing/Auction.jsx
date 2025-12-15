import { FaClock, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { Link } from "react-router";
import { useState, useEffect } from "react";
// import { AdsComponent } from "../AdsComponent";

export const Auction = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const auctions = [
    {
      id: 1,
      image: "https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644725/miekytfqgwnlj4jqai5k.png",
      title: "Vintage Film Camera - Excellent Condition",
      currentBid: "$245.00",
      bids: 12,
      timeLeft: "2h 15m",
      timeColor: "from-red-500 to-red-600"
    },
    {
      id: 2,
      image: "https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644637/lk7l3ar3sptniptieyo3.png",
      title: "Luxury Swiss Watch - Gold Plated",
      currentBid: "$1,250.00",
      bids: 28,
      timeLeft: "5h 42m",
      timeColor: "from-orange-500 to-orange-600"
    },
    {
      id: 3,
      image: "https://res.cloudinary.com/dhv8qx1qy/image/upload/v1750644675/tatznfsoekfp3vsoeswd.png",
      title: "Original Oil Painting - Abstract Art",
      currentBid: "$890.00",
      bids: 7,
      timeLeft: "1d 3h",
      timeColor: "from-green-500 to-green-600"
    }
  ];

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % auctions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [auctions.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % auctions.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + auctions.length) % auctions.length);
  };

  const currentAuction = auctions[currentSlide];

  return (
    <section className="py-20 bg-white">
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

        {/* Slideshow Container */}
        <div className="relative bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12">
            {/* Left Side - Image */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full h-96 bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center overflow-hidden">
                <img
                  src={currentAuction.image}
                  alt={currentAuction.title}
                  className="w-full h-full object-contain transition-all duration-700 transform hover:scale-110"
                  style={{ animation: 'fadeIn 0.7s ease-in-out' }}
                />
                {/* Time Badge */}
                <div className={`absolute top-4 right-4 bg-gradient-to-r ${currentAuction.timeColor} text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2`}>
                  <FaClock className="h-4 w-4" />
                  {currentAuction.timeLeft}
                </div>
              </div>
            </div>

            {/* Right Side - Information */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <span className="text-sky-600 font-semibold text-sm uppercase tracking-wide">Featured Auction</span>
                <h3 className="text-3xl lg:text-4xl font-black text-gray-900 mt-2 leading-tight">
                  {currentAuction.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <p className="text-sm text-gray-500 font-medium mb-2">Current Bid</p>
                  <p className="text-3xl font-black text-sky-600">{currentAuction.currentBid}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <p className="text-sm text-gray-500 font-medium mb-2">Total Bids</p>
                  <p className="text-3xl font-black text-gray-900">{currentAuction.bids}</p>
                </div>
              </div>

              <Link to='/signup' className="w-full">
                <button className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                  Place Your Bid Now
                </button>
              </Link>

              {/* Slide Indicators */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {auctions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 bg-sky-600' 
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
            aria-label="Previous slide"
          >
            <FaChevronLeft className="h-5 w-5 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
            aria-label="Next slide"
          >
            <FaChevronRight className="h-5 w-5 text-gray-800" />
          </button>
        </div>

        {/* <AdsComponent dataAdSlot="5537585913" /> */}
      </div>
    </section>
  );
};
