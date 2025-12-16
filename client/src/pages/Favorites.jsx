import { useEffect } from "react";
import AuctionCard from "../components/AuctionCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavoriteAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { Heart } from "lucide-react";
import socket from "../utils/socket";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";

export default function Favorites() {
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["favoriteAuctions"],
        queryFn: getFavoriteAuctions,
        staleTime: 0, // Always consider data stale to ensure fresh data
        refetchInterval: 0.2 * 1000, // Auto-refresh every 15 seconds (fallback)
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        refetchOnMount: 'always', // Always refetch when component mounts
        refetchOnReconnect: true, // Refetch when network reconnects
    });

    // 🔄 Force refresh when navigating to this page
    useEffect(() => {
        console.log('✨ Favorites page mounted - Refreshing data');
        refetch();
    }, [refetch]); // Run only on mount

    // 🔥 Real-time updates via Socket.io
    useEffect(() => {
        console.log('🔵 Favorites: Listening for like updates');

        // Listen for like/unlike events
        socket.on('auction:like:updated', (update) => {
            console.log('📡 Favorites: Like update received:', update);

            // Invalidate favorites query to refresh the list
            queryClient.invalidateQueries({ queryKey: ["favoriteAuctions"] });

            // If current user unliked something, remove it from list immediately
            if (update.userId === user?.user?._id && !update.isLiked) {
                console.log('🗑️ Current user unliked, refreshing list');
                refetch();
            }
        });

        return () => {
            console.log('🔴 Favorites: Cleanup socket listeners');
            socket.off('auction:like:updated');
        };
    }, [queryClient, refetch, user?.user?._id]);

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
                            <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi Tải Danh Sách</h2>
                            <p className="text-gray-600 mb-6">{error.message || "Không thể tải danh sách yêu thích"}</p>
                            <button
                                onClick={() => refetch()}
                                className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 transition-colors font-semibold"
                            >
                                Thử Lại
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Handle empty or undefined data
    const auctions = data?.auctions || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-25 to-pink-50">
            <main className="container mx-auto px-4 py-8">
                {/* Hero section */}
                <div className="mb-12 text-center space-y-4 relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl animate-bounce">
                        <Heart className="h-16 w-16 text-red-500 fill-red-500" />
                    </div>
                    <h1 className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent text-4xl font-bold mt-20">
                        Đấu Giá Yêu Thích
                    </h1>
                    <p className="text-red-900 max-w-2xl mx-auto font-medium">
                        Những sản phẩm đấu giá bạn đã yêu thích. Theo dõi và đặt giá ngay!
                    </p>
                    <div className="flex justify-center gap-4 text-3xl">
                        <span className="animate-pulse">❤️</span>
                        <span className="animate-pulse animation-delay-200">💖</span>
                        <span className="animate-pulse animation-delay-400">💝</span>
                        <span className="animate-pulse animation-delay-600">💗</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-red-100 to-red-200 text-center border-2 border-red-300 hover:shadow-xl transition-all">
                        <p className="text-4xl font-bold text-red-700">{auctions.length}</p>
                        <p className="text-sm text-red-800 font-medium">Đấu giá yêu thích</p>
                    </div>
                </div>

                {/* Auctions grid */}
                {auctions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-red-100">
                        <Heart className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-600 mb-2">Chưa có yêu thích</h3>
                        <p className="text-gray-500 mb-6">
                            Bạn chưa yêu thích đấu giá nào. Hãy khám phá và thêm vào danh sách!
                        </p>
                        <a
                            href="/auctions"
                            className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                        >
                            Khám Phá Đấu Giá
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {auctions.map((auction) => (
                            <AuctionCard
                                key={auction._id}
                                auction={auction}
                                onClick={() => navigate(`/auction/${auction._id}`)}
                                onLikeUpdate={refetch}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

