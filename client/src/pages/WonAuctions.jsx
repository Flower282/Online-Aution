import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWonAuctions } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { Package, Clock, CheckCircle, AlertCircle, DollarSign, Trophy, Users, Eye, Store } from "lucide-react";
import Toast from "../components/Toast";
import { Link, useNavigate } from "react-router";
import { formatCurrency } from "../utils/formatCurrency";

export default function WonAuctions() {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('won'); // 'won', 'participated', 'myAuctions'

    const { data, isLoading, error } = useQuery({
        queryKey: ["wonAuctions"],
        queryFn: getWonAuctions,
        staleTime: 30 * 1000,
    });

    const getStatusBadge = (auction) => {
        // Thanh toán cho người thắng
        const status = auction.paymentStatus || 'pending';

        if (status === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Đã thanh toán
                </span>
            );
        }

        // Kiểm tra quá hạn
        if (status === 'expired' || (auction.paymentDeadline && new Date() > new Date(auction.paymentDeadline))) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Quá hạn thanh toán
                </span>
            );
        }

        // Mặc định: đang chờ thanh toán
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Chờ thanh toán
            </span>
        );
    };

    const getMyAuctionStatusBadge = (auction) => {
        // Góc nhìn người bán
        if (!auction.winner) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    Không có người thắng
                </span>
            );
        }

        const paymentStatus = auction.paymentStatus || (auction.auctionStatus === 'completed' ? 'paid' : 'pending');

        if (paymentStatus === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Người thắng đã thanh toán
                </span>
            );
        }

        // Quá hạn thanh toán (nhưng chưa thanh toán)
        if (auction.paymentDeadline && new Date() > new Date(auction.paymentDeadline)) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    Quá hạn thanh toán
                </span>
            );
        }

        // Mặc định: đang chờ người thắng thanh toán
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                <Clock className="h-4 w-4" />
                Chờ người thắng thanh toán
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
                <main className="max-w-7xl mx-auto px-4 py-10">
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-emerald-100">
                        <AlertCircle className="h-20 w-20 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-emerald-600 mb-4">Lỗi Tải Dữ Liệu</h2>
                        <p className="text-gray-600">{error.message}</p>
                    </div>
                </main>
            </div>
        );
    }

    const wonAuctions = data?.wonAuctions || [];
    const participatedAuctions = data?.participatedAuctions || [];
    const myAuctions = data?.myAuctions || [];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <main className="container mx-auto px-4 py-8">
                {/* Hero section */}
                <div className="mb-12 text-center space-y-4" data-aos="fade-down">
                    <div className="flex justify-center mb-4">
                        <Package className="h-16 w-16 text-red-600" />
                    </div>
                    <h1 className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent text-4xl font-bold" data-aos="zoom-in" data-aos-delay="100">
                        Lịch Sử Đấu Giá
                    </h1>
                    <p className="text-gray-700 max-w-2xl mx-auto font-medium">
                        Xem các phiên đấu giá bạn đã thắng, tham gia và tạo.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" data-aos="fade-up" data-aos-delay="200">
                    <div className="p-6 rounded-lg bg-emerald-50 border-2 border-emerald-300">
                        <p className="text-3xl font-bold text-emerald-700">{wonAuctions.length}</p>
                        <p className="text-sm text-emerald-800 font-medium">Đã thắng</p>
                    </div>
                    <div className="p-6 rounded-lg bg-emerald-50 border-2 border-emerald-300">
                        <p className="text-3xl font-bold text-emerald-700">{participatedAuctions.length}</p>
                        <p className="text-sm text-emerald-800 font-medium">Đã tham gia</p>
                    </div>
                    <div className="p-6 rounded-lg bg-emerald-50 border-2 border-emerald-300">
                        <p className="text-3xl font-bold text-emerald-700">{myAuctions.length}</p>
                        <p className="text-sm text-emerald-800 font-medium">Sản phẩm của tôi</p>
                    </div>
                    <div className="p-6 rounded-lg bg-emerald-50 border-2 border-emerald-300">
                        <p className="text-3xl font-bold text-emerald-700">
                            {wonAuctions.filter(a => (a.paymentStatus || 'pending') === 'pending').length}
                        </p>
                        <p className="text-sm text-emerald-800 font-medium">Chờ thanh toán</p>
                    </div>
                    <div className="p-6 rounded-lg bg-emerald-50 border-2 border-emerald-300">
                        <p className="text-3xl font-bold text-emerald-700">
                            {wonAuctions.filter(a => a.paymentStatus === 'paid').length}
                        </p>
                        <p className="text-sm text-emerald-800 font-medium">Đã thanh toán</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6" data-aos="fade-up" data-aos-delay="300">
                    <button
                        onClick={() => setActiveTab('won')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'won'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-emerald-50 border-2 border-gray-200'
                            }`}
                    >
                        <Trophy className="h-5 w-5" />
                        Đã Thắng ({wonAuctions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('participated')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'participated'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-green-50 border-2 border-gray-200'
                            }`}
                    >
                        <Users className="h-5 w-5" />
                        Đã Tham Gia ({participatedAuctions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('myAuctions')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'myAuctions'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-lime-50 border-2 border-gray-200'
                            }`}
                    >
                        <Store className="h-5 w-5" />
                        Sản Phẩm Của Tôi ({myAuctions.length})
                    </button>
                </div>

                {/* Won Auctions Tab */}
                {activeTab === 'won' && (
                    <>
                        {wonAuctions.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-emerald-100">
                                <Trophy className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-600 mb-2">Chưa thắng đấu giá nào</h3>
                                <p className="text-gray-500 mb-6">
                                    Tham gia đấu giá và trở thành người thắng cuộc!
                                </p>
                                <a
                                    href="/auction"
                                    className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
                                >
                                    Khám Phá Đấu Giá
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wonAuctions.map((auction, index) => (
                                    <div
                                        key={auction._id}
                                        className="bg-white rounded-xl shadow-lg border-2 border-emerald-100 hover:shadow-xl transition-all overflow-hidden"
                                        data-aos="fade-up"
                                        data-aos-delay={400 + index * 50}
                                    >
                                        <div className="grid md:grid-cols-4 gap-4 p-6">
                                            {/* Image */}
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={auction.itemPhoto || "https://picsum.photos/400"}
                                                    alt={auction.itemName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="md:col-span-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="h-5 w-5 text-emerald-500" />
                                                    <h3 className="text-xl font-bold text-gray-800">{auction.itemName}</h3>
                                                </div>
                                                <p className="text-gray-600 line-clamp-2">{auction.itemDescription}</p>

                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Giá thắng:</span>
                                                        <span className="ml-2 font-bold text-emerald-600 text-lg">
                                                            {formatCurrency(auction.finalPrice || auction.currentPrice)}
                                                        </span>
                                                    </div>
                                                    {auction.depositRequired && auction.depositAmount > 0 && (
                                                        <div>
                                                            <span className="text-gray-500">Đã đặt cọc:</span>
                                                            <span className="ml-2 font-bold text-orange-600">
                                                                {formatCurrency(auction.depositAmount)}
                                                            </span>
                                                            {auction.depositPercentage && (
                                                                <span className="ml-1 text-xs text-gray-500">
                                                                    ({auction.depositPercentage}% giá thắng)
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-gray-500">Số tiền cần thanh toán:</span>
                                                        <span className="ml-2 font-bold text-blue-600 text-lg">
                                                            {formatCurrency(
                                                                (auction.finalPrice || auction.currentPrice) -
                                                                (auction.depositRequired ? (auction.depositAmount || 0) : 0)
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {auction.paymentDeadline && (
                                                    <div className="text-sm font-semibold">
                                                        <AlertCircle className="inline h-4 w-4 mr-1 text-orange-500" />
                                                        Hạn thanh toán:{" "}
                                                        <span className="text-emerald-600">
                                                            {formatDate(auction.paymentDeadline)}
                                                        </span>
                                                    </div>
                                                )}

                                                {auction.seller && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        <Store className="inline h-4 w-4 mr-1 text-purple-500" />
                                                        Người bán:{" "}
                                                        <span className="font-semibold">
                                                            {auction.seller.name + " - " + auction.seller.email || "Người bán"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col justify-between">
                                                <div className="mb-4">
                                                    {getStatusBadge(auction)}
                                                </div>

                                                {/* Nút chuyển sang trang thanh toán cho người thắng */}
                                                {(auction.paymentStatus || "pending") === "pending" && (
                                                    <button
                                                        onClick={() => navigate(`/payment/${auction._id}`)}
                                                        className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold flex items-center justify-center gap-2"
                                                    >
                                                        <DollarSign className="h-5 w-5" />
                                                        Thanh Toán Ngay
                                                    </button>
                                                )}

                                                {auction.paymentStatus === 'paid' && auction.paymentCompletedAt && (
                                                    <div className="text-center text-sm text-gray-600">
                                                        <CheckCircle className="inline h-5 w-5 text-emerald-500 mr-1" />
                                                        Đã thanh toán: {formatDate(auction.paymentCompletedAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Participated Auctions Tab */}
                {activeTab === 'participated' && (
                    <>
                        {participatedAuctions.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-blue-100">
                                <Users className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-600 mb-2">Chưa tham gia đấu giá nào</h3>
                                <p className="text-gray-500 mb-6">
                                    Bạn chưa đặt giá trong bất kỳ phiên đấu giá nào đã kết thúc.
                                </p>
                                <a
                                    href="/auction"
                                    className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                                >
                                    Khám Phá Đấu Giá
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {participatedAuctions.map((auction, index) => (
                                    <div
                                        key={auction._id}
                                        className="bg-white rounded-xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition-all overflow-hidden"
                                        data-aos="fade-up"
                                        data-aos-delay={400 + index * 50}
                                    >
                                        <div className="grid md:grid-cols-4 gap-4 p-6">
                                            {/* Image */}
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={auction.itemPhoto || "https://picsum.photos/400"}
                                                    alt={auction.itemName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="md:col-span-2 space-y-2">
                                                <h3 className="text-xl font-bold text-gray-800">{auction.itemName}</h3>
                                                <p className="text-gray-600 line-clamp-2">{auction.itemDescription}</p>

                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Giá cuối:</span>
                                                        <span className="ml-2 font-bold text-emerald-600 text-lg">
                                                            {formatCurrency(auction.currentPrice)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Bid cao nhất của bạn:</span>
                                                        <span className="ml-2 font-bold text-blue-600">
                                                            {formatCurrency(auction.userHighestBid)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    <Clock className="inline h-4 w-4 mr-1" />
                                                    Kết thúc: {formatDate(auction.itemEndDate)}
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    <Users className="inline h-4 w-4 mr-1" />
                                                    Tổng lượt đấu giá: {auction.totalBids}
                                                </div>
                                            </div>

                                            {/* Winner Info & Actions */}
                                            <div className="flex flex-col justify-between">
                                                <div className="mb-4">
                                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-lg border-2 border-emerald-200">
                                                        <p className="text-xs text-gray-500 mb-1">Người thắng cuộc</p>
                                                        <div className="flex items-center gap-2">
                                                            <Trophy className="h-5 w-5 text-emerald-500" />
                                                            <span className="font-bold text-gray-800">
                                                                {auction.winner?.name || "Ẩn danh"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/auction/${auction._id}`}
                                                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                    Xem Chi Tiết
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* My Auctions Tab */}
                {activeTab === 'myAuctions' && (
                    <>
                        {myAuctions.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-purple-100">
                                <Store className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-600 mb-2">Chưa có sản phẩm đấu giá nào kết thúc</h3>
                                <p className="text-gray-500 mb-6">
                                    Các sản phẩm bạn đăng bán sẽ xuất hiện ở đây khi phiên đấu giá kết thúc.
                                </p>
                                <a
                                    href="/auction/create"
                                    className="inline-block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-lime-600 transition-colors font-semibold"
                                >
                                    Tạo Đấu Giá Mới
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myAuctions.map((auction, index) => (
                                    <div
                                        key={auction._id}
                                        className="bg-white rounded-xl shadow-lg border-2 border-purple-100 hover:shadow-xl transition-all overflow-hidden"
                                        data-aos="fade-up"
                                        data-aos-delay={400 + index * 50}
                                    >
                                        <div className="grid md:grid-cols-4 gap-4 p-6">
                                            {/* Image */}
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={auction.itemPhoto || "https://picsum.photos/400"}
                                                    alt={auction.itemName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="md:col-span-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-5 w-5 text-purple-500" />
                                                    <h3 className="text-xl font-bold text-gray-800">{auction.itemName}</h3>
                                                </div>
                                                <p className="text-gray-600 line-clamp-2">{auction.itemDescription}</p>

                                                <div className="flex items-baseline gap-6 text-sm flex-wrap md:flex-nowrap">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-gray-500">Giá khởi điểm:</span>
                                                        <span className="font-bold text-gray-600">
                                                            {formatCurrency(auction.startingPrice)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-gray-500">Giá cuối:</span>
                                                        <span className="font-bold text-emerald-600 text-lg">
                                                            {formatCurrency(auction.currentPrice)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    <Clock className="inline h-4 w-4 mr-1" />
                                                    Kết thúc: {formatDate(auction.itemEndDate)}
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    <Users className="inline h-4 w-4 mr-1" />
                                                    Tổng lượt đấu giá: {auction.totalBids}
                                                </div>
                                            </div>

                                            {/* Winner Info & Status */}
                                            <div className="flex flex-col justify-between">
                                                <div className="mb-4 space-y-2">
                                                    {getMyAuctionStatusBadge(auction)}

                                                    {auction.winner && (
                                                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-lg border-2 border-emerald-200">
                                                            <p className="text-xs text-gray-500 mb-1">Người thắng cuộc</p>
                                                            <div className="flex items-center gap-2">
                                                                <Trophy className="h-5 w-5 text-emerald-500" />
                                                                <span className="font-bold text-gray-800">
                                                                    {auction.winner?.name || "Ẩn danh"}
                                                                </span>
                                                            </div>
                                                            {auction.winner?.email && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {auction.winner.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Thông tin tiền người bán nhận được */}
                                                {auction.winner && (
                                                    <div className="text-sm">
                                                        <p className="text-gray-500">Tiền người bán nhận:</p>
                                                        <p className="font-bold text-emerald-600 text-lg">
                                                            {formatCurrency(auction.sellerAmount || 0)}
                                                        </p>
                                                        {auction.platformCommissionAmount != null && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                (Đã trừ phí sàn {auction.platformCommissionPercentage || 10}%:
                                                                {" "}{formatCurrency(auction.platformCommissionAmount)})
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <Link
                                                    to={`/auction/${auction._id}`}
                                                    className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-lime-600 transition-colors font-semibold flex items-center justify-center gap-2 mt-2"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                    Xem Chi Tiết
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

        </div>
    );
}
