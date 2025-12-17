import AuctionCard from "../components/AuctionCard.jsx";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardStats } from "../api/auction.js";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => dashboardStats(),
    staleTime: 5 * 1000, // Consider data fresh for 5 seconds
    refetchInterval: 5000, // Auto refresh every 5 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get 3 most recent auctions for slideshow
  const recentAuctions = data?.latestAuctions?.slice(0, 3) || [];

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || recentAuctions.length === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, recentAuctions.length]);

  const handleNext = () => {
    if (isTransitioning || recentAuctions.length === 0) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % recentAuctions.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handlePrev = () => {
    if (isTransitioning || recentAuctions.length === 0) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + recentAuctions.length) % recentAuctions.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error.message || "Failed to load dashboard data"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle undefined or null data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-6">Unable to load dashboard statistics. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Christmas Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
              Total Auctions
            </h3>
            <p className="text-4xl font-extrabold text-red-600 mt-2">
              {data.totalAuctions}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-rose-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
              Active Auctions
            </h3>
            <p className="text-4xl font-extrabold text-rose-600 mt-2">
              {data.activeAuctions}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-pink-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Your Auctions</h3>
            <p className="text-4xl font-extrabold text-pink-600 mt-2">
              {data.userAuctionCount}
            </p>
          </div>
        </div>

        {/* New Auctions Slideshow */}
        {recentAuctions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">New Auctions</h2>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-br from-red-50 to-pink-50">
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                      }`}
                  >
                    <img
                      src={recentAuctions[currentSlide]?.itemPhoto || "https://picsum.photos/600"}
                      alt={recentAuctions[currentSlide]?.itemName}
                      className="w-full h-full object-contain p-8"
                    />
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                    disabled={isTransitioning}
                  >
                    <ChevronLeft className="h-6 w-6 text-red-600" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                    disabled={isTransitioning}
                  >
                    <ChevronRight className="h-6 w-6 text-red-600" />
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-red-600" />
                    ) : (
                      <Play className="h-5 w-5 text-red-600" />
                    )}
                  </button>
                </div>

                {/* Info Section */}
                <div
                  className={`p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-red-50 via-pink-50 to-white transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                  <div className="mb-4">
                    <span className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                      🎁 New Auction
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {recentAuctions[currentSlide]?.itemName}
                  </h3>

                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {recentAuctions[currentSlide]?.itemDescription || "Join the bidding now!"}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100">
                      <span className="text-gray-600 font-medium">Current Price:</span>
                      <span className="text-3xl font-bold text-red-600">
                        {formatCurrency(recentAuctions[currentSlide]?.currentPrice || recentAuctions[currentSlide]?.startingPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100">
                      <span className="text-gray-600 font-medium">🎁 Total Bids:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {recentAuctions[currentSlide]?.bidsCount || 0}
                      </span>
                    </div>
                  </div>

                  <Link to={`/auction/${recentAuctions[currentSlide]?._id}`}>
                    <button className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-4 rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                      🎄 View Auction
                    </button>
                  </Link>

                  {/* Slide Indicators */}
                  <div className="flex justify-center gap-2 mt-8">
                    {recentAuctions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                          ? 'w-8 bg-red-600'
                          : 'w-2 bg-gray-300 hover:bg-red-300'
                          }`}
                        disabled={isTransitioning}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Auctions Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">All Auctions</h2>
            <Link
              to="/auction"
              className="text-sky-600 hover:text-sky-700 font-bold text-sm hover:underline transition-colors"
            >
              View More →
            </Link>
          </div>

          {!data.latestAuctions || data.latestAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-sky-100">
              <p className="text-gray-600 text-xl font-medium">
                No auctions available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.latestAuctions.map((auction) => (
                <div key={auction._id} className="scale-95 hover:scale-100 transition-transform">
                  <AuctionCard auction={auction} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Auctions Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Your Christmas Auctions</h2>
            <Link
              to="/myauction"
              className="text-red-600 hover:text-red-700 font-bold text-sm hover:underline transition-colors"
            >
              View More →
            </Link>
          </div>

          {!data.latestUserAuctions || data.latestUserAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-red-200">
              <p className="text-gray-600 text-xl font-medium mb-6">
                You haven't created any auctions yet.
              </p>
              <Link to="/create">
                <button className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-8 py-4 rounded-xl hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                  Create Your First Auction
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.latestUserAuctions.map((auction) => {
                const endDateValue = auction.itemEndDate || auction.endDate || auction.itemEndTime;
                const isEnded = auction.timeLeft ? auction.timeLeft <= 0 : endDateValue ? new Date(endDateValue) <= new Date() : false;
                return (
                  <div
                    key={auction._id}
                    className={`w-full scale-95 hover:scale-100 transition-transform ${isEnded ? "opacity-40 grayscale blur-[1px]" : ""}`}
                  >
                    <AuctionCard auction={auction} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
