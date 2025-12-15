import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router";

export const AuctionList = () => {
  const [filter, setFilter] = useState("all");
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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
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

  const filteredAuctions =
    filter === "all"
      ? auctions
      : auctions.filter((auction) => auction.itemCategory === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-25 to-pink-50">
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="mb-12 text-center space-y-4 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl animate-bounce">

          </div>
          <h1 className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent text-4xl font-bold mt-8">
            Đấu Giá Giáng Sinh
          </h1>
          <p className="text-red-900 max-w-2xl mx-auto font-medium">
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
        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === "all" ? "Tất cả" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Christmas Red Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-100 to-red-200 text-center border-2 border-red-300 hover:shadow-xl transition-all hover:scale-105">
            <p className="text-3xl font-bold text-red-700"> {auctions.length}</p>
            <p className="text-sm text-red-800 font-medium">Đấu giá đang diễn ra</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 text-center border-2 border-red-200 hover:shadow-xl transition-all hover:scale-105">
            <p className="text-3xl font-bold text-red-600">
              ❤️ {auctions.reduce((sum, a) => sum + (a.bidsCount || 0), 0)}
            </p>
            <p className="text-sm text-red-700 font-medium">Tổng lượt đấu giá</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 text-center border-2 border-rose-200 hover:shadow-xl transition-all hover:scale-105">
            <p className="text-3xl font-bold text-rose-600"> 24/7</p>
            <p className="text-sm text-rose-700 font-medium">Luôn hoạt động</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 text-center border-2 border-pink-200 hover:shadow-xl transition-all hover:scale-105">
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
            {filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction._id}
                auction={auction}
                onClick={() => navigate(`/auction/${auction._id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
