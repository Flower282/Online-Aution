import { FaClock, FaChevronRight, FaChevronLeft, FaPause, FaPlay } from "react-icons/fa";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicAuctions } from "../../api/auction";
import { formatCurrency } from "../../utils/formatCurrency";
import { useSelector } from "react-redux";

export const Auction = () => {
  const { user } = useSelector((state) => state.auth);
  const isLoggedIn = !!user?.user;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [treeRotation, setTreeRotation] = useState(0);

  // Fetch real auction data from database
  const { data: auctionData, isLoading } = useQuery({
    queryKey: ["publicAuctions"],
    queryFn: getPublicAuctions,
    staleTime: 30 * 1000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Format auction data for carousel
  const auctions = auctionData?.slice(0, 5).map(auction => {
    const timeLeft = auction.timeLeft;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    let timeString;
    let timeColor;

    if (auction.isEnded) {
      timeString = "Ended";
      timeColor = "from-gray-500 to-gray-600";
    } else if (days > 0) {
      timeString = `${days}d ${hours % 24}h`;
      timeColor = "from-emerald-500 to-emerald-600";
    } else if (hours > 5) {
      timeString = `${hours}h ${minutes}m`;
      timeColor = "from-orange-500 to-orange-600";
    } else {
      timeString = `${hours}h ${minutes}m`;
      timeColor = "from-emerald-500 to-emerald-600";
    }

    // Ensure we always have a price to display
    const startingPrice = auction.startingPrice ?? 0;
    const currentPrice = auction.currentPrice ?? startingPrice;

    return {
      id: auction._id,
      image: auction.itemPhoto || "https://via.placeholder.com/500",
      title: auction.itemName,
      // When logged in, use currentPrice; when not logged in, use startingPrice directly from database
      currentBid: formatCurrency(isLoggedIn ? currentPrice : startingPrice),
      startingPrice: startingPrice,
      bids: auction.bidsCount ?? 0,
      timeLeft: timeString,
      timeColor: timeColor
    };
  }) || [];

  // Fallback to empty array if no data
  const displayAuctions = auctions.length > 0 ? auctions : [];

  // Auto slide every 5 seconds
  useEffect(() => {
    if (!isPlaying || displayAuctions.length === 0) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTreeRotation(prev => prev - 360);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % displayAuctions.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayAuctions.length, isPlaying]);

  const nextSlide = () => {
    if (isTransitioning || displayAuctions.length === 0) return;
    setIsTransitioning(true);
    setTreeRotation(prev => prev - 360);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % displayAuctions.length);
      setIsTransitioning(false);
    }, 300);
  };

  const prevSlide = () => {
    if (isTransitioning || displayAuctions.length === 0) return;
    setIsTransitioning(true);
    setTreeRotation(prev => prev - 360);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + displayAuctions.length) % displayAuctions.length);
      setIsTransitioning(false);
    }, 300);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Show loading or empty state
  if (isLoading) {
    return (
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4 bg-transparent">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading live auctions...</p>
          </div>
        </div>
      </section>
    );
  }

  if (displayAuctions.length === 0) {
    return (
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4 bg-transparent">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-12">Live Auctions</h2>
          <div className="text-center py-12 bg-gradient-to-br from-lime-50 to-blue-50 rounded-3xl">
            <p className="text-gray-600 text-lg">No active auctions at the moment. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  const leftAuction = displayAuctions[currentSlide];
  const rightAuction = displayAuctions[(currentSlide + 1) % displayAuctions.length];

  const renderAuctionCard = (auction, position) => (
    <div className={`flex-shrink-0 w-full lg:w-1/2 p-4 transition-all duration-700 ease-out ${isTransitioning
      ? 'opacity-0'
      : 'opacity-100 translate-x-0'
      }`}>
      <div className="bg-white rounded-xl shadow-xl overflow-hidden h-full">
        {/* Image Section */}
        <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={auction.image}
            alt={auction.title}
            className="w-full h-full object-contain p-4"
          />
          {/* Live Auction Badge - Top Right */}
          <div className="absolute top-3 right-3 bg-lime-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
            Live Auction
          </div>
          {/* Time Badge */}
          <div className={`absolute top-3 left-3 bg-gradient-to-r ${auction.timeColor} text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5`}>
            <FaClock className="h-3 w-3" />
            {auction.timeLeft}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 line-clamp-2">
              {auction.title}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-0.5">{isLoggedIn ? "Current Bid" : "Starting Price"}</p>
              <p className="text-base font-black text-lime-600">{auction.currentBid}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-0.5">Total Bids</p>
              <p className="text-base font-black text-emerald-600">{auction.bids}</p>
            </div>
          </div>

          <Link to='/login' className="block">
            <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              Place Bid Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-transparent">
      <div className="container mx-auto px-4 bg-transparent">
        <div className="flex justify-between items-center mb-12" data-aos="fade-up">
          <h2 className="text-4xl font-extrabold text-gray-900">Live Auctions</h2>
          <Link
            to="/auction"
            className="text-lime-600 hover:text-lime-700 flex items-center font-semibold transition-colors group"
          >
            View all <FaChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Slideshow Container */}
        <div className="relative rounded-2xl shadow-2xl overflow-visible p-6 pt-16 pb-16 max-w-5xl mx-auto border-4 border-emerald-600" data-aos="zoom-in" data-aos-delay="100" style={{ background: `linear-gradient(to bottom right, rgb(240 253 244), rgb(209 250 229)), url('/transparent-christmas-tree.png')`, backgroundRepeat: 'repeat', backgroundSize: 'auto, 120px', backgroundPosition: 'center, center', backgroundBlendMode: 'normal, soft-light' }}>
          {/* Christmas Lights Decoration - Top */}
          <div className="absolute -top-8 left-0 right-0 h-24 z-40 pointer-events-none" style={{ backgroundImage: 'url(/christmas-lights.gif)', backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%', backgroundPosition: 'center' }}>
          </div>

          {/* Christmas Lights Decoration - Bottom */}
          <div className="absolute -bottom-8 left-0 right-0 h-24 z-40 pointer-events-none" style={{ backgroundImage: 'url(/christmas-lights.gif)', backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%', backgroundPosition: 'center', transform: 'scaleY(-1)' }}>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 items-center">
            {/* Left Product */}
            {renderAuctionCard(leftAuction, 'left')}

            {/* Right Product */}
            {renderAuctionCard(rightAuction, 'right')}
          </div>

          {/* Christmas Tree Divider - Floating on top */}
          <div className="hidden lg:block absolute left-1/2 -top-16 z-50 pointer-events-none" style={{ transform: `translate(-50%, 0) rotate(${treeRotation}deg)`, transition: 'transform 0.7s ease-out' }}>
            <img
              src="/transparent-christmas-tree.png"
              alt="Christmas Tree"
              className="w-32 h-40 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Controls - Bottom Center */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-2xl z-10">
            <button
              onClick={prevSlide}
              disabled={isTransitioning}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Previous slide"
            >
              <FaChevronLeft className="h-5 w-5 text-gray-800 group-hover:text-lime-600 transition-colors" />
            </button>

            <div className="flex items-center gap-2">
              {displayAuctions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true);
                      setTreeRotation(prev => prev - 360);
                      setTimeout(() => {
                        setCurrentSlide(index);
                        setIsTransitioning(false);
                      }, 300);
                    }
                  }}
                  className={`h-2 rounded-full transition-all duration-500 ${index === currentSlide
                    ? 'w-8 bg-lime-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              disabled={isTransitioning}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Next slide"
            >
              <FaChevronRight className="h-5 w-5 text-gray-800 group-hover:text-lime-600 transition-colors" />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1"></div>

            <button
              onClick={togglePlay}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
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

        {/* <AdsComponent dataAdSlot="5537585913" /> */}
      </div>
    </section>
  );
};
