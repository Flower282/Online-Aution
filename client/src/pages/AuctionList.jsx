import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router";

export const AuctionList = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showPriceMenu, setShowPriceMenu] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["allAuction"],
    queryFn: getAuctions,
    staleTime: 30 * 1000,
    refetchInterval: 10000, // Auto refresh every 10 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-red-100">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Auctions</h2>
              <p className="text-gray-600 mb-6">{error.message || "Failed to load auctions"}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors font-semibold"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Handle empty or undefined data
  const auctions = data || [];

  const categories = [
    "all",
    ...new Set(auctions.map((auction) => auction.itemCategory)),
  ];

  // Apply category filter
  let filteredAuctions =
    categoryFilter === "all"
      ? auctions
      : auctions.filter((auction) => auction.itemCategory === categoryFilter);

  // Apply sorting
  if (sortBy === "price-low") {
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      const priceA = a.currentPrice || a.startingPrice || 0;
      const priceB = b.currentPrice || b.startingPrice || 0;
      return priceA - priceB;
    });
  } else if (sortBy === "price-high") {
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      const priceA = a.currentPrice || a.startingPrice || 0;
      const priceB = b.currentPrice || b.startingPrice || 0;
      return priceB - priceA;
    });
  } else if (sortBy === "date-newest") {
    // Sort by auction ID (newer auctions have higher IDs)
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      return b._id.localeCompare(a._id);
    });
  } else if (sortBy === "date-oldest") {
    // Sort by auction ID (older auctions have lower IDs)
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      return a._id.localeCompare(b._id);
    });
  } else if (sortBy === "ending-soon") {
    // Sort by timeLeft (smallest timeLeft = ending soonest)
    filteredAuctions = [...filteredAuctions].sort((a, b) => {
      const timeA = a.timeLeft || 0;
      const timeB = b.timeLeft || 0;
      return timeA - timeB;
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="mb-12 text-center space-y-4 relative" data-aos="fade-down">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl animate-bounce">

          </div>
          <h1 className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent text-4xl font-bold mt-8" data-aos="zoom-in" data-aos-delay="100">
            Đấu Giá Giáng Sinh
          </h1>
          <p className="text-red-900 max-w-2xl mx-auto font-medium" data-aos="fade-up" data-aos-delay="200">
            Khám phá các sản phẩm độc đáo và đặt giá cho quà tặng yêu thích của bạn.
            Đấu giá mới mỗi ngày với sản phẩm được xác minh!
          </p>
          <div className="flex justify-center gap-4 text-3xl">
            <span className="animate-pulse">❤️</span>
            <span className="animate-pulse animation-delay-200">🎁</span>
            <span className="animate-pulse animation-delay-400">🎅</span>
            <span className="animate-pulse animation-delay-600">⭐</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-white rounded-2xl p-6 mb-8 border-2 border-red-200 shadow-lg relative z-20" data-aos="fade-up" data-aos-delay="300">
          <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
            🎯 Lọc và Sắp xếp
          </h3>
          
          <div className="flex flex-wrap gap-3 relative">
            {/* Tất cả */}
            <button
              onClick={() => {
                setActiveTab("all");
                setCategoryFilter("all");
                setSortBy("none");
                setShowCategoryMenu(false);
                setShowTimeMenu(false);
                setShowPriceMenu(false);
              }}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === "all" && categoryFilter === "all" && sortBy === "none"
                  ? "bg-red-600 text-white shadow-lg scale-105"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              ⭐ Tất cả
            </button>

            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCategoryMenu(!showCategoryMenu);
                  setShowTimeMenu(false);
                  setShowPriceMenu(false);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  categoryFilter !== "all"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                🎁 Danh mục {categoryFilter !== "all" && `(${categoryFilter})`}
                <svg className={`w-4 h-4 transition-transform ${showCategoryMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCategoryMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border-2 border-red-200 rounded-lg shadow-2xl z-[100] min-w-[200px] max-h-[300px] overflow-y-auto">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setCategoryFilter(category);
                        setActiveTab("category");
                        setSortBy("none");
                        setShowCategoryMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors capitalize ${
                        categoryFilter === category ? "bg-red-100 text-red-700 font-semibold" : "text-gray-700"
                      }`}
                    >
                      {category === "all" ? "Tất cả danh mục" : category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTimeMenu(!showTimeMenu);
                  setShowCategoryMenu(false);
                  setShowPriceMenu(false);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  sortBy === "date-newest" || sortBy === "date-oldest" || sortBy === "ending-soon"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                ⏰ Thời gian
                <svg className={`w-4 h-4 transition-transform ${showTimeMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showTimeMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border-2 border-red-200 rounded-lg shadow-2xl z-[100] min-w-[200px]">
                  <button
                    onClick={() => {
                      setSortBy("date-newest");
                      setActiveTab("time");
                      setShowTimeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors ${
                      sortBy === "date-newest" ? "bg-red-100 text-red-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    ✨ Mới nhất
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("date-oldest");
                      setActiveTab("time");
                      setShowTimeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors ${
                      sortBy === "date-oldest" ? "bg-red-100 text-red-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    📅 Cũ nhất
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("ending-soon");
                      setActiveTab("time");
                      setShowTimeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors ${
                      sortBy === "ending-soon" ? "bg-red-100 text-red-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    🔥 Sắp kết thúc
                  </button>
                </div>
              )}
            </div>

            {/* Price Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPriceMenu(!showPriceMenu);
                  setShowCategoryMenu(false);
                  setShowTimeMenu(false);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  sortBy === "price-low" || sortBy === "price-high"
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                💰 Giá
                <svg className={`w-4 h-4 transition-transform ${showPriceMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showPriceMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border-2 border-red-200 rounded-lg shadow-2xl z-[100] min-w-[200px]">
                  <button
                    onClick={() => {
                      setSortBy("price-low");
                      setActiveTab("price");
                      setShowPriceMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors ${
                      sortBy === "price-low" ? "bg-red-100 text-red-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    📉 Giá thấp đến cao
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("price-high");
                      setActiveTab("price");
                      setShowPriceMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors ${
                      sortBy === "price-high" ? "bg-red-100 text-red-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    📈 Giá cao đến thấp
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Display */}
          {(categoryFilter !== "all" || sortBy !== "none") && (
            <div className="mt-4 pt-4 border-t border-red-100">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-red-700 font-medium">Đang áp dụng:</span>
                {categoryFilter !== "all" && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Danh mục: {categoryFilter}
                    <button
                      onClick={() => {
                        setCategoryFilter("all");
                        if (sortBy === "none") setActiveTab("all");
                      }}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy === "price-low" && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Giá: Thấp → Cao
                    <button
                      onClick={() => {
                        setSortBy("none");
                        if (categoryFilter === "all") setActiveTab("all");
                      }}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy === "price-high" && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Giá: Cao → Thấp
                    <button
                      onClick={() => {
                        setSortBy("none");
                        if (categoryFilter === "all") setActiveTab("all");
                      }}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy === "date-newest" && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Thời gian: Mới nhất
                    <button
                      onClick={() => {
                        setSortBy("none");
                        if (categoryFilter === "all") setActiveTab("all");
                      }}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy === "date-oldest" && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Thời gian: Cũ nhất
                    <button
                      onClick={() => {
                        setSortBy("none");
                        if (categoryFilter === "all") setActiveTab("all");
                      }}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy === "ending-soon" && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-2">
                    Thời gian: Sắp kết thúc
                    <button
                      onClick={() => {
                        setSortBy("none");
                        if (categoryFilter === "all") setActiveTab("all");
                      }}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Christmas Red Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-100 to-red-200 text-center border-2 border-red-300 hover:shadow-xl transition-all hover:scale-105" data-aos="flip-left" data-aos-delay="100">
            <p className="text-3xl font-bold text-red-700"> {auctions.length}</p>
            <p className="text-sm text-red-800 font-medium">Đấu giá đang diễn ra</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 text-center border-2 border-red-200 hover:shadow-xl transition-all hover:scale-105" data-aos="flip-left" data-aos-delay="200">
            <p className="text-3xl font-bold text-red-600">
              ❤️ {auctions.reduce((sum, a) => sum + (a.bidsCount || 0), 0)}
            </p>
            <p className="text-sm text-red-700 font-medium">Tổng lượt đấu giá</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 text-center border-2 border-rose-200 hover:shadow-xl transition-all hover:scale-105" data-aos="flip-left" data-aos-delay="300">
            <p className="text-3xl font-bold text-rose-600"> 24/7</p>
            <p className="text-sm text-rose-700 font-medium">Luôn hoạt động</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 text-center border-2 border-pink-200 hover:shadow-xl transition-all hover:scale-105" data-aos="flip-left" data-aos-delay="400">
            <p className="text-3xl font-bold text-pink-600"> 100%</p>
            <p className="text-sm text-pink-700 font-medium">An toàn</p>
          </div>
        </div>

        {/* Christmas Auction grid */}
        {filteredAuctions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-red-200">
            <div className="text-6xl mb-4"></div>
            <p className="text-gray-700 font-medium">
              {auctions.length === 0 ? " Chưa có đấu giá nào" : " Không có đấu giá trong danh mục này"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction, index) => (
              <div key={auction._id} data-aos="fade-up" data-aos-delay={index * 50}>
                <AuctionCard
                  auction={auction}
                  onClick={() => navigate(`/auction/${auction._id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
