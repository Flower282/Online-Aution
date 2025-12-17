import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMyDeposits } from "../api/auction";
import { getBalance, topUp } from "../api/wallet.js";
import LoadingScreen from "../components/LoadingScreen";
import { Shield, ArrowLeft, RefreshCcw, CheckCircle, XCircle, Clock, Minus, ExternalLink, Wallet, Plus, CreditCard, Building2, DollarSign, X } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";
import Toast from "../components/Toast";

const statusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'amber', icon: Clock },
    paid: { label: 'Đã đặt cọc', color: 'blue', icon: Shield },
    refunded: { label: 'Đã hoàn tiền', color: 'green', icon: CheckCircle },
    deducted: { label: 'Đã trừ vào giá', color: 'purple', icon: Minus },
    cancelled: { label: 'Đã hủy', color: 'red', icon: XCircle },
};

const topUpAmounts = [50, 100, 200, 500, 1000, 5000];

const paymentMethods = [
    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', icon: Building2 },
    { id: 'credit_card', name: 'Thẻ tín dụng', icon: CreditCard },
    { id: 'paypal', name: 'PayPal', icon: DollarSign },
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
        const amount = parseFloat(customAmount || topUpAmount);
        if (!amount || amount <= 0) {
            setToast({ message: "Vui lòng nhập số tiền hợp lệ", type: "error" });
            return;
        }

        topUpMutation.mutate({
            amount,
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
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/auction"
                            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Wallet className="h-8 w-8 text-amber-600" />
                                Ví & Tiền Cọc
                            </h1>
                            <p className="text-gray-600 mt-1">Quản lý số dư và tiền cọc đấu giá</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-emerald-100 text-sm mb-1 flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Số dư tài khoản
                            </p>
                            <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
                            <p className="text-emerald-200 text-sm mt-2">
                                Dùng để đặt cọc tham gia đấu giá
                            </p>
                        </div>
                        <button
                            onClick={() => setShowTopUpModal(true)}
                            className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Nạp tiền
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Tổng cọc</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl shadow-md border border-blue-200">
                        <p className="text-sm text-blue-600 mb-1">Đang giữ</p>
                        <p className="text-2xl font-bold text-blue-800">{stats.paid || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl shadow-md border border-green-200">
                        <p className="text-sm text-green-600 mb-1">Đã hoàn trả</p>
                        <p className="text-2xl font-bold text-green-800">{stats.refunded || 0}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl shadow-md border border-amber-200">
                        <p className="text-sm text-amber-600 mb-1">Tổng tiền cọc</p>
                        <p className="text-2xl font-bold text-amber-800">{formatCurrency(stats.totalAmount || 0)}</p>
                    </div>
                </div>

                {/* Deposits Section Title */}
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-amber-600" />
                    Lịch sử đặt cọc
                </h2>

                {/* Deposits List */}
                {deposits.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có tiền cọc</h3>
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
                    <div className="grid gap-4">
                        {deposits.map((deposit) => {
                            const status = statusConfig[deposit.status] || statusConfig.pending;
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={deposit.id}
                                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Product Image */}
                                        {deposit.product && (
                                            <Link
                                                to={`/auction/${deposit.product.id}`}
                                                className="md:w-48 h-32 md:h-auto flex-shrink-0"
                                            >
                                                <img
                                                    src={deposit.product.itemPhoto || 'https://picsum.photos/200'}
                                                    alt={deposit.product.itemName}
                                                    className={`w-full h-full object-cover ${deposit.product.isEnded ? 'opacity-60 grayscale' : ''}`}
                                                />
                                            </Link>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 p-4">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="flex-1">
                                                    {deposit.product ? (
                                                        <Link
                                                            to={`/auction/${deposit.product.id}`}
                                                            className="text-lg font-semibold text-gray-900 hover:text-amber-600 transition-colors"
                                                        >
                                                            {deposit.product.itemName}
                                                        </Link>
                                                    ) : (
                                                        <p className="text-lg font-semibold text-gray-400">Sản phẩm đã bị xóa</p>
                                                    )}

                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(deposit.amount)}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {deposit.paymentMethod === 'bank_transfer' && 'Chuyển khoản'}
                                                            {deposit.paymentMethod === 'credit_card' && 'Thẻ tín dụng'}
                                                            {deposit.paymentMethod === 'wallet' && 'Từ ví'}
                                                        </p>
                                                    </div>

                                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${status.color}-50 border border-${status.color}-200`}>
                                                        <StatusIcon className={`h-5 w-5 text-${status.color}-600`} />
                                                        <span className={`text-sm font-medium text-${status.color}-700`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Additional Info */}
                                            {deposit.status === 'refunded' && deposit.refundedAt && (
                                                <p className="text-sm text-green-600 mt-2">
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
                    <h4 className="font-semibold text-blue-800 mb-2">📋 Thông tin về tiền cọc</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Đang giữ:</strong> Tiền cọc đang được giữ trong khi đấu giá diễn ra</li>
                        <li>• <strong>Đã hoàn trả:</strong> Bạn không thắng đấu giá, tiền cọc đã được hoàn lại vào ví</li>
                        <li>• <strong>Đã trừ vào giá:</strong> Bạn thắng đấu giá, tiền cọc đã được trừ vào giá cuối cùng</li>
                    </ul>
                </div>
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Plus className="h-8 w-8" />
                                    <h3 className="text-xl font-bold">Nạp tiền vào ví</h3>
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
                        <div className="p-6 space-y-6">
                            {/* Current Balance */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Số dư hiện tại</p>
                                <p className="text-2xl font-bold text-gray-800">{formatCurrency(balance)}</p>
                            </div>

                            {/* Quick Amount Selection */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Chọn số tiền nạp</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {topUpAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => {
                                                setTopUpAmount(amount);
                                                setCustomAmount('');
                                            }}
                                            className={`py-3 rounded-lg font-semibold transition-all ${topUpAmount === amount && !customAmount
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {formatCurrency(amount)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Amount */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Hoặc nhập số tiền khác</p>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setTopUpAmount('');
                                        }}
                                        placeholder="0.00"
                                        min="1"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
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
                                            <method.icon className={`h-5 w-5 ${selectedPaymentMethod === method.id ? 'text-emerald-600' : 'text-gray-500'
                                                }`} />
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
                                        <Plus className="h-5 w-5" />
                                        Nạp {formatCurrency(parseFloat(customAmount || topUpAmount) || 0)}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default MyDeposits;
