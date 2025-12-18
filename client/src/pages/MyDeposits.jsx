import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMyDeposits } from "../api/auction";
import { getBalance, topUp, getTransactionHistory } from "../api/wallet.js";
import LoadingScreen from "../components/LoadingScreen";
import { ArrowLeft, ExternalLink, X } from "lucide-react"; // Keep only control icons
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

    // Fetch transaction history
    const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
        queryKey: ["transactionHistory"],
        queryFn: getTransactionHistory,
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
            queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
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

        // Tạm thời: Luôn dùng 'wallet' để tiền tự động cộng vào ví (không qua cổng thanh toán)
        topUpMutation.mutate({
            amount: actualAmount,
            paymentMethod: 'wallet', // Tự động cộng tiền vào ví
        });
    };

    if (depositsLoading || balanceLoading || transactionsLoading) return <LoadingScreen />;

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

    const stats = depositsData?.stats || {
        total: 0,
        paid: 0,
        refunded: 0,
        deducted: 0,
        totalAmount: 0,
        walletMoneyIn: 0,
        walletMoneyOut: 0,
        walletNet: 0
    };
    const deposits = depositsData?.deposits || [];
    const transactions = transactionsData?.transactions || [];
    const balance = balanceData?.balance || 0;

    // Combine deposits and transactions, then sort by date (newest first)
    const allTransactions = [
        ...deposits.map(deposit => ({
            ...deposit,
            _type: 'deposit',
            _date: deposit.paidAt || deposit.createdAt || new Date()
        })),
        ...transactions.map(transaction => ({
            ...transaction,
            _type: 'transaction',
            _date: transaction.completedAt || transaction.createdAt || new Date()
        }))
    ].sort((a, b) => new Date(b._date) - new Date(a._date));

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6" data-aos="fade-down">
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

                {/* Transaction History Section Title */}
                <div className="flex items-center justify-between mb-3" data-aos="fade-up" data-aos-delay="300">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        Giao dịch gần đây
                    </h2>
                    {allTransactions.length > 0 && (
                        <Link
                            to="/transactions"
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                            Xem tất cả giao dịch
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                {/* Top 5 Transactions Table */}
                {allTransactions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center" data-aos="zoom-in" data-aos-delay="400">
                        <div className="text-5xl mb-3 animate-bounce">💳</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có giao dịch</h3>
                        <p className="text-gray-500 mb-6">
                            Bạn chưa có giao dịch nào. Hãy nạp tiền hoặc tham gia đấu giá ngay!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowTopUpModal(true)}
                                className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                            >
                                Nạp tiền
                            </button>
                            <Link
                                to="/auction"
                                className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                            >
                                Xem đấu giá
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden" data-aos="fade-up" data-aos-delay="400">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Loại</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mô tả</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Thời gian</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Số tiền</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allTransactions.slice(0, 5).map((item, index) => {
                                        const transactionTypeLabels = {
                                            topup: { label: 'Nạp tiền', emoji: '💰', sign: '+' },
                                            withdraw: { label: 'Rút tiền', emoji: '💸', sign: '-' },
                                            payment: { label: 'Thanh toán', emoji: '💳', sign: '-' },
                                            refund: { label: 'Hoàn tiền', emoji: '↩️', sign: '+' },
                                            deposit: { label: 'Đặt cọc', emoji: '🛡️', sign: '-' }
                                        };

                                        const statusLabels = {
                                            pending: { label: 'Chờ xử lý', color: 'amber' },
                                            processing: { label: 'Đang xử lý', color: 'blue' },
                                            completed: { label: 'Hoàn thành', color: 'green' },
                                            failed: { label: 'Thất bại', color: 'red' },
                                            cancelled: { label: 'Đã hủy', color: 'gray' },
                                            paid: { label: 'Đã đặt cọc', color: 'blue' },
                                            refunded: { label: 'Đã hoàn tiền', color: 'green' },
                                            deducted: { label: 'Đã trừ vào giá', color: 'purple' }
                                        };

                                        let typeLabel, emoji, sign, description, date, amount, statusLabel, statusColor;

                                        if (item._type === 'deposit') {
                                            const deposit = item;
                                            typeLabel = 'Đặt cọc';
                                            emoji = '🛡️';
                                            sign = '-';
                                            description = deposit.product ? deposit.product.itemName : 'Sản phẩm đã bị xóa';
                                            date = new Date(deposit.paidAt || deposit.createdAt).toLocaleString('vi-VN');
                                            amount = deposit.amount;
                                            const status = statusConfig[deposit.status] || statusConfig.pending;
                                            statusLabel = status.label;
                                            statusColor = status.color;
                                        } else {
                                            const transaction = item;
                                            const typeConfig = transactionTypeLabels[transaction.type] || { label: 'Giao dịch', emoji: '💼', sign: '' };
                                            typeLabel = typeConfig.label;
                                            emoji = typeConfig.emoji;
                                            sign = typeConfig.sign;
                                            description = transaction.notes || typeConfig.label;
                                            date = new Date(transaction.createdAt).toLocaleString('vi-VN');
                                            amount = transaction.amount;
                                            const status = statusLabels[transaction.status] || statusLabels.pending;
                                            statusLabel = status.label;
                                            statusColor = status.color;
                                        }

                                        return (
                                            <tr
                                                key={item._type === 'deposit' ? `deposit-${item.id}` : `transaction-${item._id}`}
                                                className="hover:bg-gray-50 transition-all duration-200"
                                                data-aos="fade-left"
                                                data-aos-delay={450 + index * 50}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
                                                        <span className="text-lg transform transition-transform duration-200 hover:scale-110">{emoji}</span>
                                                        <span className="text-sm font-medium text-gray-900">{typeLabel}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-gray-700 transition-colors duration-200">{description}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs text-gray-500">{date}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <p className={`text-sm font-bold transition-all duration-200 ${sign === '+' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {sign}{formatCurrency(amount)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-50 text-${statusColor}-700 transition-all duration-200 hover:shadow-md`}>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {allTransactions.length > 5 && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center" data-aos="fade-up" data-aos-delay="700">
                                <Link
                                    to="/transactions"
                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                                >
                                    Xem thêm {allTransactions.length - 5} giao dịch khác →
                                </Link>
                            </div>
                        )}
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
                                        <h3 className="text-lg font-bold"> Nạp tiền vào ví</h3>
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
                                    <p className="text-xs font-medium text-gray-700 mb-2">Chọn số tiền nạp </p>
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
