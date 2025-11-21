import AuctionCard from "../components/AuctionCard.jsx";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardStats } from "../api/auction.js";
import LoadingScreen from "../components/LoadingScreen.jsx";

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => dashboardStats(),
    staleTime: 30 * 1000,
    refetchInterval: 10000, // Auto refresh every 10 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-sky-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
              Total Auctions
            </h3>
            <p className="text-4xl font-extrabold text-sky-600 mt-2">
              {data.totalAuctions}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-cyan-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
              Active Auctions
            </h3>
            <p className="text-4xl font-extrabold text-cyan-600 mt-2">
              {data.activeAuctions}
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Your Auctions</h3>
            <p className="text-4xl font-extrabold text-blue-600 mt-2">
              {data.userAuctionCount}
            </p>
          </div>
        </div>

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

          {data.latestAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-sky-100">
              <p className="text-gray-600 text-xl font-medium">
                No auctions available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-6">
              {data.latestAuctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          )}
        </div>

        {/* Your Auctions Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Your Auctions</h2>
            <Link
              to="/myauction"
              className="text-sky-600 hover:text-sky-700 font-bold text-sm hover:underline transition-colors"
            >
              View More →
            </Link>
          </div>

          {data.latestUserAuctions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-sky-100">
              <p className="text-gray-600 text-xl font-medium mb-6">
                You haven't created any auctions yet.
              </p>
              <Link to="/create">
                <button className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-8 py-4 rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                  Create Your First Auction
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-6">
              {data.latestUserAuctions.map((auction) => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
