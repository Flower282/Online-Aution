import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getTransactionHistory } from "../api/wallet.js";
import { getMyDeposits } from "../api/auction";
import LoadingScreen from "../components/LoadingScreen";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

const statusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'amber' },
    paid: { label: 'Đã đặt cọc', color: 'blue' },
    refunded: { label: 'Đã hoàn tiền', color: 'green' },
    deducted: { label: 'Đã trừ vào giá', color: 'purple' },
    cancelled: { label: 'Đã hủy', color: 'red' },
};

export const TransactionHistory = () => {
    const [page, setPage] = useState(1);
    const [days, setDays] = useState(30);
    const [allLoadedTransactions, setAllLoadedTransactions] = useState([]);
    const limit = 20;

    // Fetch deposits
    const { data: depositsData, isLoading: depositsLoading, refetch: refetchDeposits } = useQuery({
        queryKey: ["myDeposits"],
        queryFn: getMyDeposits,
        staleTime: 30 * 1000,
    });

    // Fetch transactions
    const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
        queryKey: ["transactionHistory", page, days],
        queryFn: () => getTransactionHistory({ page, limit, days }),
        staleTime: 30 * 1000,
        onSuccess: (data) => {
            if (page === 1) {
                setAllLoadedTransactions(data.transactions || []);
            } else {
                setAllLoadedTransactions(prev => [...prev, ...(data.transactions || [])]);
            }
        },
    });

    const refetch = () => {
        refetchDeposits();
        refetchTransactions();
    };

    if (depositsLoading || transactionsLoading) return <LoadingScreen />;

    const deposits = depositsData?.deposits || [];
    const transactions = allLoadedTransactions.length > 0 ? allLoadedTransactions : (transactionsData?.transactions || []);
    const pagination = transactionsData?.pagination || {};

    // Filter deposits by days
    const filteredDeposits = deposits.filter(deposit => {
        if (days >= 9999) return true;
        const depositDate = new Date(deposit.paidAt || deposit.createdAt);
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        return depositDate >= daysAgo;
    });

    // Combine deposits and transactions, then sort by date (newest first)
    const allTransactions = [
        ...filteredDeposits.map(deposit => ({
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

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    const handleDaysChange = (newDays) => {
        setDays(newDays);
        setPage(1);
        setAllLoadedTransactions([]);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6" data-aos="fade-down" data-aos-duration="600">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/deposits"
                            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                Lịch sử giao dịch
                            </h1>
                            <p className="text-sm text-gray-600 mt-0.5">Xem tất cả giao dịch trong {days} ngày gần nhất</p>
                        </div>
                    </div>

                </div>

                {/* Filter */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6" data-aos="fade-up" data-aos-delay="200">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
                        <select
                            value={days}
                            onChange={(e) => handleDaysChange(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                        >
                            <option value={7}>7 ngày gần nhất</option>
                            <option value={30}>30 ngày gần nhất</option>
                            <option value={90}>90 ngày gần nhất</option>
                            <option value={365}>1 năm gần nhất</option>
                            <option value={9999}>Tất cả</option>
                        </select>
                    </div>
                </div>

                {/* Transactions Table */}
                {allTransactions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center" data-aos="zoom-in" data-aos-delay="300">
                        <div className="text-5xl mb-3 animate-bounce">💳</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có giao dịch</h3>
                        <p className="text-gray-500 mb-6">
                            Bạn chưa có giao dịch nào trong {days} ngày gần nhất.
                        </p>
                        <Link
                            to="/deposits"
                            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                        >
                            Quay lại
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden" data-aos="fade-up" data-aos-delay="300">
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
                                        {allTransactions.map((item, index) => {
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
                                                    data-aos-delay={350 + (index % 20) * 30}
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
                                                        <p className={`text-sm font-bold transition-all duration-200 ${sign === '+' ? 'text-emerald-600' : 'text-emerald-600'}`}>
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
                        </div>

                        {/* Load More Button */}
                        {pagination.hasMore && (
                            <div className="mt-6 text-center" data-aos="fade-up" data-aos-delay="400">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={transactionsLoading}
                                    className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                >
                                    {transactionsLoading ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            Đang tải...
                                        </>
                                    ) : (
                                        `Xem thêm (${pagination.total - (page * limit)} giao dịch còn lại)`
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;

