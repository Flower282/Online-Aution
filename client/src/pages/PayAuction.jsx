import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { viewAuction } from "../api/auction";
import { payForWonAuction } from "../api/auction";
import { getBalance } from "../api/wallet";
import LoadingScreen from "../components/LoadingScreen";
import Toast from "../components/Toast";
import { formatCurrency } from "../utils/formatCurrency";
import { AlertCircle, CheckCircle, Clock, DollarSign, Store, Trophy, Wallet } from "lucide-react";

export default function PayAuction() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);

    const { data: auction, isLoading, error } = useQuery({
        queryKey: ["payAuction", id],
        queryFn: () => viewAuction(id),
        staleTime: 30 * 1000,
    });

    // Fetch user balance to check if sufficient
    const { data: balanceData } = useQuery({
        queryKey: ["walletBalance"],
        queryFn: getBalance,
        staleTime: 10 * 1000,
    });

    const payMutation = useMutation({
        mutationFn: () => payForWonAuction(id),
        onSuccess: (data) => {
            console.log('✅ Payment success:', data);
            // Invalidate all related queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["wonAuctions"] });
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
            queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
            queryClient.invalidateQueries({ queryKey: ["payAuction", id] });

            const paymentInfo = data?.payment;
            const amountPaid = paymentInfo?.amountPaid || amountToPay;
            const newBalance = paymentInfo?.newBalance;

            const message = newBalance !== undefined
                ? `Thanh toán thành công ${formatCurrency(amountPaid)}! Số dư mới: ${formatCurrency(newBalance)} 🎉`
                : `Thanh toán thành công ${formatCurrency(amountPaid)}! 🎉`;

            setToast({ message, type: "success" });
            // Sau một lúc quay lại trang lịch sử thắng đấu giá
            setTimeout(() => {
                navigate("/won");
            }, 2000);
        },
        onError: (err) => {
            const errorData = err.response?.data || {};
            const errorCode = errorData.code;

            // Kiểm tra nếu lỗi là do không đủ tiền trong ví
            if (errorCode === 'INSUFFICIENT_WALLET_BALANCE') {
                const currentBalance = errorData.currentBalance || 0;
                const requiredAmount = errorData.requiredAmount || 0;
                const missingAmount = requiredAmount - currentBalance;
                setToast({
                    message: `Số dư ví không đủ! Bạn cần ${formatCurrency(requiredAmount)} nhưng chỉ có ${formatCurrency(currentBalance)}. Vui lòng nạp thêm ${formatCurrency(missingAmount)}.`,
                    type: "error"
                });
            } else {
                setToast({ message: err.message || errorData.error || "Không thể thanh toán. Vui lòng thử lại.", type: "error" });
            }
        },
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: "#f5f1e8" }}>
                <main className="max-w-3xl mx-auto px-4 py-10">
                    <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-red-100">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Không thể tải thông tin phiên đấu giá</h2>
                        <p className="text-gray-600">{error.message}</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!auction) {
        return null;
    }

    const finalPrice = auction.finalPrice || auction.currentPrice || 0;
    const depositAmount = auction.depositAmount || 0;
    const amountToPay = finalPrice - depositAmount;
    const currentBalance = balanceData?.balance || 0;
    const hasSufficientBalance = currentBalance >= amountToPay;

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f5f1e8" }}>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <main className="max-w-3xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                        ← Quay lại
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border-2 border-cyan-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-cyan-50 flex items-center gap-3">
                        <Trophy className="h-7 w-7 text-yellow-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Xác Nhận Thanh Toán
                            </h1>
                            <p className="text-sm text-gray-600">
                                Kiểm tra lại thông tin trước khi xác nhận thanh toán phiên đấu giá đã thắng.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Auction summary */}
                        <div className="flex gap-4">
                            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                    src={auction.itemPhoto || "https://picsum.photos/300"}
                                    alt={auction.itemName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {auction.itemName}
                                </h2>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {auction.itemDescription}
                                </p>
                                {auction.seller && (
                                    <p className="text-sm text-gray-600">
                                        <Store className="inline h-4 w-4 mr-1 text-purple-500" />
                                        Người bán:{" "}
                                        <span className="font-semibold">
                                            {auction.seller.name} - {auction.seller.email}
                                        </span>
                                    </p>
                                )}
                                {auction.paymentDeadline && (
                                    <p className="text-xs text-gray-500">
                                        <Clock className="inline h-3 w-3 mr-1" />
                                        Hạn thanh toán:{" "}
                                        <span className="font-semibold text-red-600">
                                            {formatDate(auction.paymentDeadline)}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Giá thắng phiên</span>
                                <span className="font-semibold text-gray-900">
                                    {formatCurrency(finalPrice)}
                                </span>
                            </div>

                            {depositAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Đã đặt cọc</span>
                                    <span className="font-semibold text-orange-600">
                                        - {formatCurrency(depositAmount)}
                                    </span>
                                </div>
                            )}

                            <div className="border-t border-dashed border-gray-300 my-2" />

                            <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-semibold">
                                    Số tiền cần thanh toán
                                </span>
                                <span className="text-2xl font-extrabold text-cyan-600">
                                    {formatCurrency(amountToPay)}
                                </span>
                            </div>
                        </div>

                        {/* Balance info */}
                        <div className={`p-4 rounded-xl border-2 ${hasSufficientBalance ? 'bg-cyan-50 border-cyan-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Wallet className="h-4 w-4" />
                                    Số dư ví hiện tại:
                                </span>
                                <span className={`text-lg font-bold ${hasSufficientBalance ? 'text-cyan-700' : 'text-red-700'}`}>
                                    {formatCurrency(currentBalance)}
                                </span>
                            </div>
                            {!hasSufficientBalance && (
                                <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-300">
                                    <p className="text-sm text-red-800 font-semibold mb-1">
                                        ⚠️ Số dư không đủ!
                                    </p>
                                    <p className="text-xs text-red-700 mb-2">
                                        Bạn cần {formatCurrency(amountToPay)} nhưng chỉ có {formatCurrency(currentBalance)}.
                                        Còn thiếu {formatCurrency(amountToPay - currentBalance)}.
                                    </p>
                                    <Link
                                        to="/deposits"
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        Nạp tiền ngay
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Info note */}
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 flex gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p>
                                Bằng việc xác nhận thanh toán, bạn đồng ý thanh toán số tiền còn lại cho phiên đấu giá này.
                                Tiền sẽ được trừ trực tiếp từ ví của bạn.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                disabled={payMutation.isPending}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => payMutation.mutate()}
                                disabled={payMutation.isPending || amountToPay <= 0 || !hasSufficientBalance}
                                className="px-6 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DollarSign className="h-5 w-5" />
                                {payMutation.isPending ? "Đang thanh toán..." : "Xác Nhận Thanh Toán"}
                            </button>
                        </div>

                        {auction.paymentStatus === "paid" && auction.paymentCompletedAt && (
                            <div className="mt-2 text-xs text-cyan-700 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Đã thanh toán lúc {formatDate(auction.paymentCompletedAt)}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}


