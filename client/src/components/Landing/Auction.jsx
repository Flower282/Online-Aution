import { FaClock, FaChevronRight, FaChevronLeft, FaPause, FaPlay } from "react-icons/fa";
import { Link } from "react-router";
import { useState, useEffect } from "react";
// import { AdsComponent } from "../AdsComponent";

export const Auction = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % auctions.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, [auctions.length, isPlaying]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % auctions.length);
      setIsTransitioning(false);
    }, 300);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + auctions.length) % auctions.length);
      setIsTransitioning(false);
    }, 300);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentAuction = auctions[currentSlide];

  return (
    <section className="py-20 bg-transparent">
      <div className="container mx-auto px-4 bg-transparent">
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
        <div className="relative bg-transparent-to-br from-sky-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
            {/* Left Side - Image */}
            <div className="relative flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-12">
              <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
                <div className={`w-full h-full flex items-center justify-center transition-all duration-700 ease-out ${
                  isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}>
                  <img
                    src={currentAuction.image}
                    alt={currentAuction.title}
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
                {/* Time Badge */}
                <div className={`absolute top-4 right-4 bg-gradient-to-r ${currentAuction.timeColor} text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 backdrop-blur-sm`}>
                  <FaClock className="h-4 w-4" />
                  {currentAuction.timeLeft}
                </div>
              </div>
            </div>

            {/* Right Side - Information */}
            <div className={`flex flex-col justify-center space-y-6 p-8 lg:p-12 transition-all duration-700 ease-out ${
              isTransitioning ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'
            }`}>
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
                <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                  View Items
                </button>
              </Link>

              {/* Slide Indicators & Play/Pause */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  {auctions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isTransitioning) {
                          setIsTransitioning(true);
                          setTimeout(() => {
                            setCurrentSlide(index);
                            setIsTransitioning(false);
                          }, 300);
                        }
                      }}
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        index === currentSlide 
                          ? 'w-12 bg-sky-600' 
                          : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={togglePlay}
                  className="bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <FaPause className="h-4 w-4 text-gray-800" />
                  ) : (
                    <FaPlay className="h-4 w-4 text-gray-800 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            disabled={isTransitioning}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10 group"
            aria-label="Previous slide"
          >
            <FaChevronLeft className="h-6 w-6 text-gray-800 group-hover:text-sky-600 transition-colors" />
          </button>
          <button
            onClick={nextSlide}
            disabled={isTransitioning}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10 group"
            aria-label="Next slide"
          >
            <FaChevronRight className="h-6 w-6 text-gray-800 group-hover:text-sky-600 transition-colors" />
          </button>
        </div>

        {/* <AdsComponent dataAdSlot="5537585913" /> */}
      </div>
    </section>
  );
};
