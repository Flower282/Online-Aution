import AuctionCard from "../components/AuctionCard.jsx";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardStats, getAuctions } from "../api/auction.js";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Search } from "lucide-react"; // Keep navigation/control icons only
import { formatCurrency } from "../utils/formatCurrency";
import { useSelector } from "react-redux";
import VerificationModal from "../components/VerificationModal";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Lazy loading refs and states
  const newAuctionsRef = useRef(null);
  const allAuctionsRef = useRef(null);
  const yourAuctionsRef = useRef(null);
  const [newAuctionsVisible, setNewAuctionsVisible] = useState(false);
  const [allAuctionsVisible, setAllAuctionsVisible] = useState(false);
  const [yourAuctionsVisible, setYourAuctionsVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => dashboardStats(),
    staleTime: 5 * 1000, // Consider data fresh for 5 seconds
    refetchInterval: 5000, // Auto refresh every 5 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Fetch all auctions for search
  const { data: auctionsData } = useQuery({
    queryKey: ["allAuctionsForDashboardSearch"],
    queryFn: getAuctions,
    staleTime: 60 * 1000,
  });

  // Get unique categories from auctions
  const categories = useMemo(() => {
    if (!auctionsData) return [];
    const cats = [...new Set(auctionsData.map(a => a.itemCategory).filter(Boolean))];
    return cats;
  }, [auctionsData]);

  // Search results computation
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return { auctions: [], categories: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    const auctions = auctionsData || [];

    // Filter auctions by name, description, category
    let filteredAuctions = auctions
      .filter(auction =>
        auction.itemName?.toLowerCase().includes(query) ||
        auction.itemDescription?.toLowerCase().includes(query) ||
        auction.itemCategory?.toLowerCase().includes(query)
      );

    // Sort: active auctions first, then ended auctions
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      const aEnded = a.isEnded || (a.timeLeft !== undefined && a.timeLeft <= 0);
      const bEnded = b.isEnded || (b.timeLeft !== undefined && b.timeLeft <= 0);
      if (aEnded && !bEnded) return 1; // a ended, b active -> b first
      if (!aEnded && bEnded) return -1; // a active, b ended -> a first
      return 0; // Keep original order for same status
    }).slice(0, 6);

    // Filter categories
    const filteredCategories = categories
      .filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 4);

    return { auctions: filteredAuctions, categories: filteredCategories };
  }, [searchQuery, auctionsData, categories]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search submit
  const handleSearchSubmit = () => {
    if (searchTerm.trim().length >= 2) {
      setSearchQuery(searchTerm);
      setShowSearchResults(true);
    }
  };

  // Handle search result click
  const handleResultClick = (link) => {
    setSearchTerm("");
    setSearchQuery("");
    setShowSearchResults(false);
    navigate(link);
  };

  // Check verification status
  const isVerified = user?.user?.verification?.isVerified;

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get 4 most recent auctions for slideshow
  const recentAuctions = data?.latestAuctions?.slice(0, 4) || [];

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

  // Lazy loading with IntersectionObserver (re-trigger on enter/exit)
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.target === newAuctionsRef.current) {
          setNewAuctionsVisible(entry.isIntersecting);
        } else if (entry.target === allAuctionsRef.current) {
          setAllAuctionsVisible(entry.isIntersecting);
        } else if (entry.target === yourAuctionsRef.current) {
          setYourAuctionsVisible(entry.isIntersecting);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    if (newAuctionsRef.current) observer.observe(newAuctionsRef.current);
    if (allAuctionsRef.current) observer.observe(allAuctionsRef.current);
    if (yourAuctionsRef.current) observer.observe(yourAuctionsRef.current);

    return () => {
      if (newAuctionsRef.current) observer.unobserve(newAuctionsRef.current);
      if (allAuctionsRef.current) observer.unobserve(allAuctionsRef.current);
      if (yourAuctionsRef.current) observer.unobserve(yourAuctionsRef.current);
    };
  }, [recentAuctions.length, data]);

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md">
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">Lỗi Tải Trang Chủ</h2>
          <p className="text-gray-600 mb-6">{error.message || "Không thể tải dữ liệu trang chủ"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Handle undefined or null data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md">
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">Lỗi Tải Trang Chủ</h2>
          <p className="text-gray-600 mb-6">Không thể tải dữ liệu trang chủ. Vui lòng thử lại.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-700 transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#f5f1e8' }}>
      {/* Verification Warning Banner - fixed top-right, offset to avoid navbar/profile */}
      {!isVerified && showVerificationBanner && (
        <div className="fixed top-24 sm:top-28 right-4 sm:right-6 z-40 w-[280px] sm:w-[320px]">
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl shadow-xl relative">
            {/* Close button */}
            <button
              onClick={() => setShowVerificationBanner(false)}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-2 pr-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-red-800">⚠️ Chưa xác minh</h3>
                <p className="text-xs text-red-700 mt-1">
                  Xác minh để nạp tiền & đấu giá
                </p>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5 w-full justify-center"
                >
                  Xác minh ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* Hero Search Section */}
        <div className="min-h-[70vh] flex flex-col items-center justify-center mb-16" ref={searchRef}>
          <div className="text-center mb-8" data-aos="fade-down">
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-red-500 mb-4" data-aos="zoom-in" data-aos-delay="100">
              🎄 Online Auction
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
              Khám phá hàng ngàn sản phẩm đấu giá hấp dẫn. Tìm kiếm ngay!
            </p>
          </div>

          <div className="w-full max-w-4xl mx-auto" ref={searchRef} data-aos="fade-up" data-aos-delay="300">
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-8 w-8 text-red-500" />
                </div>
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm, danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchResults(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearchResults(false);
                    }
                  }}
                  autoComplete="off"
                  className="w-full pl-16 pr-6 py-6 text-xl bg-white border-2 border-red-300 rounded-2xl shadow-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all placeholder:text-gray-400"
                />
              </div>

              <button
                onClick={handleSearchSubmit}
                className="px-8 py-6 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold text-xl rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                <Search className="h-6 w-6 text-white" />
                Tìm kiếm
              </button>
            </div>

            <div className="relative">

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="mt-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-20 max-h-[450px] overflow-y-auto w-full">
                  {searchResults.auctions.length === 0 && searchResults.categories.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg">Không tìm thấy kết quả cho "{searchQuery}"</p>
                    </div>
                  ) : (
                    <>
                      {/* Categories Results */}
                      {searchResults.categories.length > 0 && (
                        <div>
                          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
                              📁 Danh mục ({searchResults.categories.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 p-4">
                            {searchResults.categories.map((category) => (
                              <button
                                key={category}
                                onClick={() => handleResultClick(`/auction?category=${encodeURIComponent(category)}`)}
                                className="px-4 py-2 bg-blue-100 hover:bg-green-200 text-blue-700 rounded-full font-medium transition-colors"
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Auctions Results */}
                      {searchResults.auctions.length > 0 && (
                        <div>
                          <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-orange-50 border-b border-t border-gray-100">
                            <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
                              🏷️ Sản phẩm ({searchResults.auctions.length})
                            </span>
                          </div>
                          {searchResults.auctions.map((auction) => {
                            const timeRemaining = auction.timeLeft || 0;
                            const isEnded = auction.isEnded || timeRemaining <= 0;
                            const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
                            const daysLeft = Math.floor(hoursLeft / 24);

                            return (
                              <button
                                key={auction._id}
                                onClick={() => handleResultClick(`/auction/${auction._id}`)}
                                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-emerald-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                              >
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow">
                                  {auction.itemPhoto ? (
                                    <img
                                      src={auction.itemPhoto}
                                      alt={auction.itemName}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                      <span className="text-4xl">📦</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate text-lg">{auction.itemName}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                      {auction.itemCategory}
                                    </span>
                                    {!isEnded ? (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                        {daysLeft > 0 ? `${daysLeft} ngày` : `${hoursLeft}h còn lại`}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        Đã kết thúc
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-emerald-600 font-bold mt-1">
                                    {new Intl.NumberFormat('vi-VN').format(
                                      user?.user
                                        ? (auction.currentPrice ?? auction.startingPrice ?? 0)
                                        : (auction.startingPrice ?? 0)
                                    )}đ
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Scroll Down Indicator */}
          {!showSearchResults && (
            <div className="mt-12 animate-bounce">
              <div className="flex flex-col items-center text-gray-400">
                <span className="text-sm mb-2">Kéo xuống để xem đấu giá</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* New Auctions Slideshow */}
        {recentAuctions.length > 0 && (
          <div
            ref={newAuctionsRef}
            className={`mt-28 mb-16 transition-all duration-1000 ease-out ${newAuctionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Đấu Giá Mới</h2>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-200">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-br from-emerald-50 to-pink-50">
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                      }`}
                  >
                    <img
                      src={recentAuctions[currentSlide]?.itemPhoto || "https://picsum.photos/600"}
                      alt={recentAuctions[currentSlide]?.itemName}
                      loading="lazy"
                      className="w-full h-full object-contain p-8"
                    />
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                    disabled={isTransitioning}
                  >
                    <ChevronLeft className="h-6 w-6 text-emerald-600" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                    disabled={isTransitioning}
                  >
                    <ChevronRight className="h-6 w-6 text-emerald-600" />
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Play className="h-5 w-5 text-emerald-600" />
                    )}
                  </button>
                </div>

                {/* Info Section */}
                <div
                  className={`p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-emerald-50 via-pink-50 to-white transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                  <div className="mb-4">
                    <span className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                      🎁 Đấu Giá Mới
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {recentAuctions[currentSlide]?.itemName}
                  </h3>

                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {recentAuctions[currentSlide]?.itemDescription || "Tham gia đấu giá ngay!"}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
                      <span className="text-gray-600 font-medium">{user?.user ? "Giá hiện tại:" : "Giá khởi điểm:"}</span>
                      <span className="text-3xl font-bold text-emerald-600">
                        {formatCurrency(
                          user?.user
                            ? (recentAuctions[currentSlide]?.currentPrice ?? recentAuctions[currentSlide]?.startingPrice ?? 0)
                            : (recentAuctions[currentSlide]?.startingPrice ?? 0)
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100">
                      <span className="text-gray-600 font-medium">🎁 Tổng lượt đấu giá:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {recentAuctions[currentSlide]?.bidsCount || 0}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/auction/${recentAuctions[currentSlide]?._id}`)}
                    className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white py-4 rounded-xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🎄 Xem đấu giá
                  </button>

                  {/* Slide Indicators */}
                  <div className="flex justify-center gap-2 mt-8">
                    {recentAuctions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                          ? 'w-8 bg-emerald-600'
                          : 'w-2 bg-gray-300 hover:bg-emerald-300'
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
        <div
          ref={allAuctionsRef}
          className={`mb-12 transition-all duration-1000 ease-out ${allAuctionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900" data-aos="fade-right" data-aos-delay="450">Tất Cả Đấu Giá</h2>
            <Link
              to="/auction"
              className="text-lime-600 hover:text-lime-700 font-bold text-sm hover:underline transition-colors"
            >
              Xem thêm →
            </Link>
          </div>

          {!data.latestAuctions || data.latestAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-lime-100">
              <p className="text-gray-600 text-xl font-medium">
                Hiện chưa có đấu giá nào.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.latestAuctions.map((auction, index) => (
                <div key={auction._id} className="scale-95 hover:scale-100 transition-transform" data-aos="fade-up" data-aos-delay={500 + index * 50}>
                  <AuctionCard auction={auction} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Auctions Section - Only show if user is logged in */}
        {user && (
          <div
            ref={yourAuctionsRef}
            className={`transition-all duration-1000 ease-out ${yourAuctionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent" data-aos="fade-right" data-aos-delay="650">Đấu Giá Của Bạn</h2>
              <Link
                to="/myauction"
                className="text-emerald-600 hover:text-emerald-700 font-bold text-sm hover:underline transition-colors"
              >
                Xem thêm →
              </Link>
            </div>

            {!data.latestUserAuctions || data.latestUserAuctions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-emerald-200">
                <p className="text-gray-600 text-xl font-medium mb-6">
                  Bạn chưa tạo đấu giá nào.
                </p>
                <Link to="/create">
                  <button className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                    Tạo Đấu Giá Đầu Tiên
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(() => {
                  // Sắp xếp: các phiên đang diễn ra lên trước, đã kết thúc xuống sau
                  const sortedUserAuctions = [...data.latestUserAuctions].sort((a, b) => {
                    const aEndValue = a.itemEndDate || a.endDate || a.itemEndTime;
                    const bEndValue = b.itemEndDate || b.endDate || b.itemEndTime;

                    const aEnded = a.timeLeft ? a.timeLeft <= 0 : aEndValue ? new Date(aEndValue) <= new Date() : false;
                    const bEnded = b.timeLeft ? b.timeLeft <= 0 : bEndValue ? new Date(bEndValue) <= new Date() : false;

                    if (aEnded && !bEnded) return 1;   // a ended, b active -> b trước
                    if (!aEnded && bEnded) return -1;  // a active, b ended -> a trước
                    return 0;
                  });

                  return sortedUserAuctions.map((auction, index) => {
                    const endDateValue = auction.itemEndDate || auction.endDate || auction.itemEndTime;
                    const isEnded = auction.timeLeft ? auction.timeLeft <= 0 : endDateValue ? new Date(endDateValue) <= new Date() : false;

                    return (
                      <div
                        key={auction._id}
                        className={`w-full scale-95 hover:scale-100 transition-transform ${isEnded ? "opacity-40 grayscale blur-[1px]" : ""}`}
                        data-aos="fade-up"
                        data-aos-delay={700 + index * 50}
                      >
                        <AuctionCard auction={auction} />
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={() => {
          setShowVerificationModal(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
