import { useState } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery } from "@tanstack/react-query";
import { getAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";

export const AuctionList = () => {
  const [filter, setFilter] = useState("all");
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-500 mb-2">
            Auction Marketplace
          </h1>
          <p className="text-gray-600">Browse and bid on amazing items</p>
        </div>

        {/* Filters */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${filter === category
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-white text-gray-700 border-2 border-sky-200 hover:bg-sky-50 hover:border-sky-300 shadow-md"
                  }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {filter === "all" ? "All Auctions" : `${filter} Auctions`}
            <span className="text-base font-normal text-gray-500 ml-3">
              ({filteredAuctions.length} items)
            </span>
          </h2>
        </div>

        {filteredAuctions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-sky-100">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-2">
                {auctions.length === 0 ? "No Auctions Available" : "No auctions found in this category"}
              </p>
              <p className="text-gray-500 text-base">
                {auctions.length === 0 ? "Check back later for new auctions!" : "Try selecting a different category"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 place-items-center gap-8">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
