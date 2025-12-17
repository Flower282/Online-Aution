import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWonAuctions, getDepositInfo, submitDeposit } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { Package, Clock, CheckCircle, AlertCircle, DollarSign, Trophy, Users, Eye, Store } from "lucide-react";
import Toast from "../components/Toast";
import { Link } from "react-router";
import { formatCurrency } from "../utils/formatCurrency";

export default function WonAuctions() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [activeTab, setActiveTab] = useState('won'); // 'won', 'participated', 'myAuctions'
    const [depositForm, setDepositForm] = useState({
        paymentMethod: '',
        transactionId: '',
        amount: 0
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ["wonAuctions"],
        queryFn: getWonAuctions,
        staleTime: 30 * 1000,
    });

    const submitDepositMutation = useMutation({
        mutationFn: ({ auctionId, depositData }) => submitDeposit(auctionId, depositData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wonAuctions"] });
            setShowDepositModal(false);
            setToast({ message: "Đặt cọc thành công! 🎉", type: "success" });
            setDepositForm({ paymentMethod: '', transactionId: '', amount: 0 });
        },
        onError: (error) => {
            setToast({ message: error.message || "Không thể đặt cọc. Vui lòng thử lại.", type: "error" });
        },
    });

    const handleOpenDepositModal = async (auction) => {
        try {
            const depositInfo = await getDepositInfo(auction._id);
            setSelectedAuction(depositInfo.auction);
            setDepositForm({
                ...depositForm,
                amount: depositInfo.auction.depositAmount
            });
            setShowDepositModal(true);
        } catch (_error) {
            setToast({ message: "Không thể tải thông tin đặt cọc", type: "error" });
        }
    };

    const handleSubmitDeposit = (e) => {
        e.preventDefault();

        if (!depositForm.paymentMethod) {
            setToast({ message: "Vui lòng chọn phương thức thanh toán", type: "error" });
            return;
        }

        submitDepositMutation.mutate({
            auctionId: selectedAuction.id,
            depositData: depositForm
        });
    };

    const getStatusBadge = (auction) => {
        if (auction.depositPaid) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Đã đặt cọc
                </span>
            );
        }

        if (auction.depositDeadline) {
            const deadline = new Date(auction.depositDeadline);
            const now = new Date();
            const isExpired = now > deadline;

            if (isExpired) {
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        Quá hạn
                    </span>
                );
            }

            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                    <Clock className="h-4 w-4" />
                    Chờ đặt cọc
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                Chờ xử lý
            </span>
        );
    };

    const getMyAuctionStatusBadge = (auction) => {
        if (!auction.winner) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    Không có người thắng
                </span>
            );
        }

        if (auction.depositPaid) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Đã nhận cọc
                </span>
            );
        }

        if (auction.depositRequired) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                    <Clock className="h-4 w-4" />
                    Chờ đặt cọc
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                <CheckCircle className="h-4 w-4" />
                Đã bán
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
                    <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-red-100">
                        <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi Tải Dữ Liệu</h2>
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
                        <Package className="h-16 w-16 text-green-600" />
                    </div>
                    <h1 className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-700 bg-clip-text text-transparent text-4xl font-bold" data-aos="zoom-in" data-aos-delay="100">
                        Lịch Sử Đấu Giá
                    </h1>
                    <p className="text-gray-700 max-w-2xl mx-auto font-medium">
                        Xem các phiên đấu giá bạn đã thắng, tham gia và tạo.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" data-aos="fade-up" data-aos-delay="200">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300">
                        <p className="text-3xl font-bold text-green-700">{wonAuctions.length}</p>
                        <p className="text-sm text-green-800 font-medium">Đã thắng</p>
                    </div>
                    <div className="p-6 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300">
                        <p className="text-3xl font-bold text-blue-700">{participatedAuctions.length}</p>
                        <p className="text-sm text-blue-800 font-medium">Đã tham gia</p>
                    </div>
                    <div className="p-6 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300">
                        <p className="text-3xl font-bold text-purple-700">{myAuctions.length}</p>
                        <p className="text-sm text-purple-800 font-medium">Sản phẩm của tôi</p>
                    </div>
                    <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300">
                        <p className="text-3xl font-bold text-yellow-700">
                            {wonAuctions.filter(a => !a.depositPaid && a.depositRequired).length}
                        </p>
                        <p className="text-sm text-yellow-800 font-medium">Chờ đặt cọc</p>
                    </div>
                    <div className="p-6 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-300">
                        <p className="text-3xl font-bold text-emerald-700">
                            {wonAuctions.filter(a => a.depositPaid).length}
                        </p>
                        <p className="text-sm text-emerald-800 font-medium">Đã hoàn tất</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6" data-aos="fade-up" data-aos-delay="300">
                    <button
                        onClick={() => setActiveTab('won')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'won'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-green-50 border-2 border-gray-200'
                            }`}
                    >
                        <Trophy className="h-5 w-5" />
                        Đã Thắng ({wonAuctions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('participated')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'participated'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-blue-50 border-2 border-gray-200'
                            }`}
                    >
                        <Users className="h-5 w-5" />
                        Đã Tham Gia ({participatedAuctions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('myAuctions')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'myAuctions'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-purple-50 border-2 border-gray-200'
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
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-green-100">
                                <Trophy className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-600 mb-2">Chưa thắng đấu giá nào</h3>
                                <p className="text-gray-500 mb-6">
                                    Tham gia đấu giá và trở thành người thắng cuộc!
                                </p>
                                <a
                                    href="/auction"
                                    className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                                >
                                    Khám Phá Đấu Giá
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wonAuctions.map((auction, index) => (
                                    <div
                                        key={auction._id}
                                        className="bg-white rounded-xl shadow-lg border-2 border-green-100 hover:shadow-xl transition-all overflow-hidden"
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
                                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                                    <h3 className="text-xl font-bold text-gray-800">{auction.itemName}</h3>
                                                </div>
                                                <p className="text-gray-600 line-clamp-2">{auction.itemDescription}</p>

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Giá thắng:</span>
                                                        <span className="ml-2 font-bold text-green-600 text-lg">
                                                            {formatCurrency(auction.currentPrice)}
                                                        </span>
                                                    </div>
                                                    {auction.depositRequired && (
                                                        <div>
                                                            <span className="text-gray-500">Tiền cọc:</span>
                                                            <span className="ml-2 font-bold text-orange-600">
                                                                {formatCurrency(auction.depositAmount)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-sm text-gray-500">
                                                    <Clock className="inline h-4 w-4 mr-1" />
                                                    Kết thúc: {formatDate(auction.itemEndDate)}
                                                </div>

                                                {auction.depositDeadline && !auction.depositPaid && (
                                                    <div className="text-sm text-red-600 font-semibold">
                                                        <AlertCircle className="inline h-4 w-4 mr-1" />
                                                        Hạn đặt cọc: {formatDate(auction.depositDeadline)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col justify-between">
                                                <div className="mb-4">
                                                    {getStatusBadge(auction)}
                                                </div>

                                                {auction.depositRequired && !auction.depositPaid && (
                                                    <button
                                                        onClick={() => handleOpenDepositModal(auction)}
                                                        className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2"
                                                    >
                                                        <DollarSign className="h-5 w-5" />
                                                        Đặt Cọc Ngay
                                                    </button>
                                                )}

                                                {auction.depositPaid && (
                                                    <div className="text-center text-sm text-gray-600">
                                                        <CheckCircle className="inline h-5 w-5 text-green-500 mr-1" />
                                                        Đã đặt cọc: {formatDate(auction.depositPaidAt)}
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
                                    className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
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

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Giá cuối:</span>
                                                        <span className="ml-2 font-bold text-green-600 text-lg">
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
                                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                                                        <p className="text-xs text-gray-500 mb-1">Người thắng cuộc</p>
                                                        <div className="flex items-center gap-2">
                                                            <Trophy className="h-5 w-5 text-yellow-500" />
                                                            <span className="font-bold text-gray-800">
                                                                {auction.winner?.name || "Ẩn danh"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/auction/${auction._id}`}
                                                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2"
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
                                    className="inline-block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold"
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

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Giá khởi điểm:</span>
                                                        <span className="ml-2 font-bold text-gray-600">
                                                            {formatCurrency(auction.startingPrice)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Giá cuối:</span>
                                                        <span className="ml-2 font-bold text-green-600 text-lg">
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
                                                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                                                            <p className="text-xs text-gray-500 mb-1">Người thắng cuộc</p>
                                                            <div className="flex items-center gap-2">
                                                                <Trophy className="h-5 w-5 text-yellow-500" />
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

                                                {auction.depositRequired && auction.winner && (
                                                    <div className="text-sm">
                                                        <p className="text-gray-500">Tiền cọc cần nhận:</p>
                                                        <p className="font-bold text-orange-600 text-lg">
                                                            {formatCurrency(auction.depositAmount)}
                                                        </p>
                                                        {auction.depositPaid && (
                                                            <p className="text-green-600 text-xs mt-1">
                                                                <CheckCircle className="inline h-4 w-4 mr-1" />
                                                                Đã nhận: {formatDate(auction.depositPaidAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <Link
                                                    to={`/auction/${auction._id}`}
                                                    className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors font-semibold flex items-center justify-center gap-2 mt-2"
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

            {/* Deposit Modal */}
            {showDepositModal && selectedAuction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Đặt Cọc</h2>

                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="font-semibold text-gray-700">{selectedAuction.itemName}</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatCurrency(selectedAuction.depositAmount)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                ({selectedAuction.depositPercentage}% của giá thắng)
                            </p>
                        </div>

                        <form onSubmit={handleSubmitDeposit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phương thức thanh toán *
                                </label>
                                <select
                                    value={depositForm.paymentMethod}
                                    onChange={(e) => setDepositForm({ ...depositForm, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                >
                                    <option value="">Chọn phương thức</option>
                                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                                    <option value="credit_card">Thẻ tín dụng</option>
                                    <option value="cash">Tiền mặt</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mã giao dịch (nếu có)
                                </label>
                                <input
                                    type="text"
                                    value={depositForm.transactionId}
                                    onChange={(e) => setDepositForm({ ...depositForm, transactionId: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Nhập mã giao dịch"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDepositModal(false)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitDepositMutation.isPending}
                                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50"
                                >
                                    {submitDepositMutation.isPending ? "Đang xử lý..." : "Xác Nhận"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
