import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMyDeposits } from "../api/auction";
import { getBalance, topUp } from "../api/wallet.js";
import LoadingScreen from "../components/LoadingScreen";
import { ArrowLeft, RefreshCcw, ExternalLink, X } from "lucide-react"; // Keep only control icons
import { formatCurrency } from "../utils/formatCurrency";
import Toast from "../components/Toast";

const statusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'amber', emoji: '⏱' },
    paid: { label: 'Đã đặt cọc', color: 'blue', emoji: '' },
    refunded: { label: 'Đã hoàn tiền', color: 'green', emoji: '' },
    deducted: { label: 'Đã trừ vào giá', color: 'purple', emoji: '' },
    cancelled: { label: 'Đã hủy', color: 'red', emoji: '' },
};

// Top-up amounts in thousands VND (x1,000)
const topUpAmounts = [50, 100, 200, 500, 1000, 5000]; // 50k, 100k, 200k, 500k, 1M, 5M VND

const paymentMethods = [
    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', emoji: '' },
    { id: 'credit_card', name: 'Thẻ tín dụng', emoji: '' },
    { id: 'paypal', name: 'PayPal', emoji: '' },
];

export const MyDeposits = () => {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer');

    // Fetch deposits
    const { data: depositsData, isLoading: depositsLoading, error: depositsError, refetch, isFetching } = useQuery({
        queryKey: ["myDeposits"],
        queryFn: getMyDeposits,
        staleTime: 30 * 1000,
    });

    // Fetch balance
    const { data: balanceData, isLoading: balanceLoading } = useQuery({
        queryKey: ["walletBalance"],
        queryFn: getBalance,
        staleTime: 10 * 1000,
    });

    // Top up mutation
    const topUpMutation = useMutation({
        mutationFn: topUp,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
            setShowTopUpModal(false);
            setTopUpAmount('');
            setCustomAmount('');
            setToast({
                message: `Nạp tiền thành công! Số dư mới: ${formatCurrency(data.newBalance)}`,
                type: "success"
            });
        },
        onError: (error) => {
            setToast({ message: error.message || "Nạp tiền thất bại", type: "error" });
        },
    });

    const handleTopUp = () => {
        const amountInThousands = parseFloat(customAmount || topUpAmount);
        if (!amountInThousands || amountInThousands <= 0) {
            setToast({ message: "Vui lòng nhập số tiền hợp lệ", type: "error" });
            return;
        }

        if (amountInThousands < 1) {
            setToast({ message: "Số tiền nạp tối thiểu là 1 (1,000 VNĐ)", type: "error" });
            return;
        }

        // Multiply by 1000 to get actual VND amount
        const actualAmount = amountInThousands * 1000;

        topUpMutation.mutate({
            amount: actualAmount,
            paymentMethod: selectedPaymentMethod,
        });
    };

    if (depositsLoading || balanceLoading) return <LoadingScreen />;

    if (depositsError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-200 max-w-md">
                    <h2 className="text-2xl font-bold text-red-700 mb-4">Lỗi</h2>
                    <p className="text-gray-700 mb-6">{depositsError.message}</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const stats = depositsData?.stats || { total: 0, paid: 0, refunded: 0, deducted: 0, totalAmount: 0 };
    const deposits = depositsData?.deposits || [];
    const balance = balanceData?.balance || 0;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6" data-aos="fade-down">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/auction"
                            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                Ví & Tiền Cọc
                            </h1>
                            <p className="text-sm text-gray-600 mt-0.5">Quản lý số dư và tiền cọc đấu giá</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-4 mb-6 text-white" data-aos="zoom-in" data-aos-delay="100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className="text-emerald-100 text-xs mb-1 flex items-center gap-1">
                                Số dư tài khoản
                            </p>
                            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
                            <p className="text-emerald-200 text-xs mt-1">
                                Dùng để đặt cọc tham gia đấu giá
                            </p>
                        </div>
                        <button
                            onClick={() => setShowTopUpModal(true)}
                            className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors shadow-md flex items-center gap-2 text-sm"
                        >
                            ➕ Nạp tiền
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-aos="fade-up" data-aos-delay="200">
                    <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
                        <p className="text-xs text-gray-500 mb-0.5">Tổng cọc</p>
                        <p className="text-xl font-bold text-gray-800">{stats.total || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg shadow-md border border-blue-200">
                        <p className="text-xs text-blue-600 mb-0.5">Đang giữ</p>
                        <p className="text-xl font-bold text-blue-800">{stats.paid || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg shadow-md border border-green-200">
                        <p className="text-xs text-green-600 mb-0.5">Đã hoàn trả</p>
                        <p className="text-xl font-bold text-green-800">{stats.refunded || 0}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg shadow-md border border-amber-200">
                        <p className="text-xs text-amber-600 mb-0.5">Tổng tiền cọc</p>
                        <p className="text-xl font-bold text-amber-800">{formatCurrency(stats.totalAmount || 0)}</p>
                    </div>
                </div>

                {/* Deposits Section Title */}
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2" data-aos="fade-up" data-aos-delay="300">
                    Lịch sử đặt cọc
                </h2>

                {/* Deposits List */}
                {deposits.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="text-5xl mb-3">🛡️</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có tiền cọc</h3>
                        <p className="text-gray-500 mb-6">
                            Bạn chưa đặt cọc cho sản phẩm nào. Hãy tham gia đấu giá ngay!
                        </p>
                        <Link
                            to="/auction"
                            className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-semibold"
                        >
                            Xem đấu giá
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {deposits.map((deposit) => {
                            const status = statusConfig[deposit.status] || statusConfig.pending;

                            return (
                                <div
                                    key={deposit.id}
                                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Product Image */}
                                        {deposit.product && (
                                            <Link
                                                to={`/auction/${deposit.product.id}`}
                                                className="md:w-40 h-28 md:h-auto flex-shrink-0"
                                            >
                                                <img
                                                    src={deposit.product.itemPhoto || 'https://picsum.photos/200'}
                                                    alt={deposit.product.itemName}
                                                    className={`w-full h-full object-cover ${deposit.product.isEnded ? 'opacity-60 grayscale' : ''}`}
                                                />
                                            </Link>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 p-3">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                <div className="flex-1">
                                                    {deposit.product ? (
                                                        <Link
                                                            to={`/auction/${deposit.product.id}`}
                                                            className="text-base font-semibold text-gray-900 hover:text-amber-600 transition-colors"
                                                        >
                                                            {deposit.product.itemName}
                                                        </Link>
                                                    ) : (
                                                        <p className="text-base font-semibold text-gray-400">Sản phẩm đã bị xóa</p>
                                                    )}

                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                        <span>Đặt cọc: {new Date(deposit.paidAt).toLocaleDateString('vi-VN')}</span>
                                                        {deposit.product && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Giá hiện tại: {formatCurrency(deposit.product.currentPrice)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Amount & Status */}
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-amber-600">{formatCurrency(deposit.amount)}</p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {deposit.paymentMethod === 'bank_transfer' && 'Chuyển khoản'}
                                                            {deposit.paymentMethod === 'credit_card' && 'Thẻ tín dụng'}
                                                            {deposit.paymentMethod === 'wallet' && 'Từ ví'}
                                                        </p>
                                                    </div>

                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-${status.color}-50 border border-${status.color}-200`}>
                                                        <span className="text-base">{status.emoji}</span>
                                                        <span className={`text-xs font-medium text-${status.color}-700`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Additional Info */}
                                            {deposit.status === 'refunded' && deposit.refundedAt && (
                                                <p className="text-xs text-green-600 mt-1.5">
                                                    ✓ Hoàn tiền lúc: {new Date(deposit.refundedAt).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                            {deposit.status === 'deducted' && deposit.deductedAt && (
                                                <p className="text-sm text-purple-600 mt-2">
                                                    ✓ Đã trừ vào giá cuối lúc: {new Date(deposit.deductedAt).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-800 mb-2"> Thông tin về tiền cọc</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Đang giữ:</strong> Tiền cọc đang được giữ trong khi đấu giá diễn ra</li>
                        <li>• <strong>Đã hoàn trả:</strong> Bạn không thắng đấu giá, tiền cọc đã được hoàn lại vào ví</li>
                        <li>• <strong>Đã trừ vào giá:</strong> Bạn thắng đấu giá, tiền cọc đã được trừ vào giá cuối cùng</li>
                    </ul>
                </div>
            </div>

            {/* Top Up Modal */}
            {
                showTopUpModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold">💰 Nạp tiền vào ví</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowTopUpModal(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                {/* Current Balance */}
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-0.5">Số dư hiện tại</p>
                                    <p className="text-xl font-bold text-gray-800">{formatCurrency(balance)}</p>
                                </div>

                                {/* Quick Amount Selection */}
                                <div>
                                    <p className="text-xs font-medium text-gray-700 mb-2">Chọn số tiền nạp (x1,000 VNĐ)</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {topUpAmounts.map((amount) => (
                                            <button
                                                key={amount}
                                                onClick={() => {
                                                    setTopUpAmount(amount);
                                                    setCustomAmount('');
                                                }}
                                                className={`py-2 rounded-lg font-semibold text-sm transition-all ${topUpAmount === amount && !customAmount
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {formatCurrency(amount * 1000)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Amount */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Hoặc nhập số tiền khác</p>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={customAmount}
                                                onChange={(e) => {
                                                    setCustomAmount(e.target.value);
                                                    setTopUpAmount('');
                                                }}
                                                placeholder="VD: 50"
                                                min="1"
                                                step="1"
                                                className="w-full pl-4 pr-24 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                                x1,000 VNĐ
                                            </span>
                                        </div>
                                        {customAmount && parseFloat(customAmount) > 0 && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                                                <p className="text-sm text-emerald-700">
                                                    = <span className="font-bold text-lg text-emerald-800">
                                                        {(parseFloat(customAmount) * 1000).toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</p>
                                    <div className="space-y-2">
                                        {paymentMethods.map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedPaymentMethod(method.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedPaymentMethod === method.id
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className="text-2xl">{method.emoji}</span>
                                                <span className={`font-medium ${selectedPaymentMethod === method.id ? 'text-emerald-800' : 'text-gray-700'
                                                    }`}>
                                                    {method.name}
                                                </span>
                                                {selectedPaymentMethod === method.id && (
                                                    <span className="ml-auto text-emerald-600">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleTopUp}
                                    disabled={topUpMutation.isPending || (!topUpAmount && !customAmount)}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {topUpMutation.isPending ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            Nạp {formatCurrency((parseFloat(customAmount || topUpAmount) || 0) * 1000)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Toast */}
            {
                toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )
            }
        </div >
    );
};

export default MyDeposits;
