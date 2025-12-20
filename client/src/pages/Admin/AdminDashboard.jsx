import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import LoadingScreen from '../../components/LoadingScreen';
import Toast from '../../components/Toast';
import { getAdminDashboard, deleteUser, getPendingReactivationRequests } from '../../api/admin';
import { getPendingVerifications } from '../../api/verification';
import { ChevronLeft, ChevronRight, Play, Pause, Clock, Users, Tag, Eye, ShieldCheck, UserCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [pendingReactivations, setPendingReactivations] = useState(0);

  // Slider state for auctions
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch dashboard statistics
  const fetchDashboardData = async () => {
    try {
      const data = await getAdminDashboard();

      // Filter out inactive users
      const activeUsers = (data.recentUsersList || []).filter(user => user.isActive !== false);

      // Server already filtered auctions from inactive sellers, no need to filter again
      // Just use the data as-is
      setDashboardData({
        ...data,
        recentUsersList: activeUsers     // Only active users
      });
      setUsers(activeUsers);

      // Fetch pending verifications count
      try {
        const verifications = await getPendingVerifications();
        setPendingVerifications(verifications.count || 0);
      } catch (e) {
        setPendingVerifications(0);
      }

      // Fetch pending reactivation requests count
      try {
        const reactivations = await getPendingReactivationRequests();
        setPendingReactivations(reactivations.count || 0);
      } catch (e) {
        setPendingReactivations(0);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load dashboard data. You may not have admin permissions.';
      setError(errorMessage);
      setDashboardData({});
      setUsers([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchDashboardData(); // This now fetches both dashboard data and users
      } catch (error) {
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // No dependencies since we're not filtering or paginating

  // Auto-advance auction slider
  const auctionsCount = dashboardData?.recentAuctions?.length || 0;

  useEffect(() => {
    if (!isPlaying || auctionsCount === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % auctionsCount);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isPlaying, auctionsCount, currentSlide]);

  const handlePrevSlide = () => {
    if (isTransitioning || auctionsCount === 0) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + auctionsCount) % auctionsCount);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNextSlide = () => {
    if (isTransitioning || auctionsCount === 0) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % auctionsCount);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteUser(userToDelete._id);
      // Refresh the dashboard data and auction lists
      await fetchDashboardData();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setToast({ message: 'Vô hiệu hóa tài khoản thành công! Dữ liệu đã được cập nhật.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Không thể vô hiệu hóa tài khoản. Vui lòng thử lại.', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
              <p className="text-emerald-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage auctions, users, and monitor system activity</p>
        </div>

        {/* Statistics Cards - Row 1 */}
        {dashboardData && dashboardData.stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 max-w-6xl mx-auto">
              <div className="bg-emerald-50 rounded-xl shadow-sm border-2 border-emerald-300 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                      Active Auctions
                    </h3>
                    <p className="text-2xl font-bold text-emerald-900 mt-2">
                      {dashboardData.stats.activeAuctions || 0}
                    </p>

                  </div>
                  <div className="bg-emerald-200 p-3 rounded-full">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl shadow-sm border-2 border-emerald-300 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                      Total Auctions
                    </h3>
                    <p className="text-2xl font-bold text-emerald-900 mt-2">
                      {dashboardData.stats.totalAuctions || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-200 p-3 rounded-full">
                    <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl shadow-sm border-2 border-emerald-300 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                      Total Users
                    </h3>
                    <p className="text-2xl font-bold text-emerald-900 mt-2">
                      {dashboardData.stats.totalUsers || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-200 p-3 rounded-full">
                    <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Cards - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
              <Link to="/admin/auctions/pending" className="bg-orange-50 rounded-xl shadow-sm border-2 border-orange-300 p-6 hover:shadow-md transition-all block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-700 uppercase tracking-wide">
                      Pending Auctions
                    </h3>
                    <p className="text-2xl font-bold text-orange-900 mt-2">
                      {dashboardData.stats.pendingAuctions || 0}
                    </p>
                    {dashboardData.stats.pendingAuctions > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠️ Needs approval
                      </p>
                    )}
                  </div>
                  <div className="bg-orange-200 p-3 rounded-full">
                    <svg className="w-6 h-6 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link to="/admin/verifications" className="bg-orange-50 rounded-xl shadow-sm border-2 border-orange-300 p-6 hover:shadow-md transition-all block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-700 uppercase tracking-wide">
                      Pending Verifications
                    </h3>
                    <p className="text-2xl font-bold text-orange-900 mt-2">
                      {pendingVerifications}
                    </p>
                    {pendingVerifications > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        🆔 CCCD cần duyệt
                      </p>
                    )}
                  </div>
                  <div className="bg-orange-200 p-3 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </Link>

              <Link to="/admin/reactivation-requests" className="bg-orange-50 rounded-xl shadow-sm border-2 border-orange-300 p-6 hover:shadow-md transition-all block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-700 uppercase tracking-wide">
                      Pending Reactivations
                    </h3>
                    <p className="text-2xl font-bold text-orange-900 mt-2">
                      {pendingReactivations}
                    </p>
                    {pendingReactivations > 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        🔄 Requests to review
                      </p>
                    )}
                  </div>
                  <div className="bg-orange-200 p-3 rounded-full">
                    <UserCheck className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* Recent Active Auctions - Slider */}
        {dashboardData && (
          <div className="mb-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Active Auctions</h2>
                <p className="text-sm text-gray-500 mt-1">✅ Showing only approved auctions</p>
              </div>
              <Link
                to="/auction"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
              >
                View All Auctions
              </Link>
            </div>

            {!dashboardData.recentAuctions || dashboardData.recentAuctions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-sm shadow-sm border border-gray-200">
                <p className="text-gray-500 text-lg">No approved active auctions at the moment.</p>
                {dashboardData.stats?.pendingAuctions > 0 && (
                  <p className="text-yellow-600 text-sm mt-2">
                    You have {dashboardData.stats.pendingAuctions} pending auction{dashboardData.stats.pendingAuctions !== 1 ? 's' : ''} waiting for approval.
                  </p>
                )}
              </div>
            ) : (
              (() => {
                const currentAuction = dashboardData.recentAuctions[currentSlide];
                const isEnded = currentAuction?.itemEndDate ? new Date(currentAuction.itemEndDate) <= new Date() : false;

                return (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      {/* Image Section */}
                      <div className={`relative h-[280px] md:h-[380px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 ${isEnded ? 'opacity-60 grayscale' : ''}`}>
                        <div
                          className={`absolute inset-0 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                            }`}
                        >
                          <img
                            src={currentAuction?.itemPhoto || "https://picsum.photos/600"}
                            alt={currentAuction?.itemName}
                            className="w-full h-full object-contain p-6"
                          />
                        </div>

                        {/* Ended Overlay */}
                        {isEnded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <span className="bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                              ĐÃ KẾT THÚC
                            </span>
                          </div>
                        )}

                        {/* Navigation Arrows */}
                        <button
                          onClick={handlePrevSlide}
                          disabled={isTransitioning}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm disabled:opacity-50 z-10"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          onClick={handleNextSlide}
                          disabled={isTransitioning}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm disabled:opacity-50 z-10"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>

                        {/* Play/Pause Button */}
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="absolute bottom-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm z-10"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4 text-gray-700" />
                          ) : (
                            <Play className="h-4 w-4 text-gray-700" />
                          )}
                        </button>

                      </div>

                      {/* Info Section */}
                      <div
                        className={`p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 transition-all duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                          }`}
                      >
                        {/* Category Badge */}
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                            <Tag className="h-3 w-3" />
                            {currentAuction?.itemCategory || 'Uncategorized'}
                          </span>
                          {isEnded && (
                            <span className="ml-2 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Đã kết thúc
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 line-clamp-2">
                          {currentAuction?.itemName}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 mb-5 line-clamp-2 text-sm">
                          {currentAuction?.itemDescription || "Không có mô tả"}
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Giá hiện tại</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(currentAuction?.currentPrice || currentAuction?.startingPrice || 0)}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">Giá khởi điểm</p>
                            <p className="text-xl font-bold text-gray-700">
                              {formatCurrency(currentAuction?.startingPrice || 0)}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-500">Lượt bid</p>
                              <p className="text-lg font-bold text-gray-800">{currentAuction?.bidsCount || 0}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Kết thúc</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {currentAuction?.itemEndDate
                                  ? new Date(currentAuction.itemEndDate).toLocaleDateString('vi-VN')
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* View Button */}
                        <Link
                          to={`/auction/${currentAuction?._id}`}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          <Eye className="h-5 w-5" />
                          Xem chi tiết
                        </Link>

                        {/* Slide Indicators */}
                        <div className="flex justify-center gap-2 mt-5">
                          {dashboardData.recentAuctions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => goToSlide(index)}
                              disabled={isTransitioning}
                              className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-6 bg-blue-600'
                                : 'w-2 bg-gray-300 hover:bg-blue-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* User Management Section */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Users</h2>
            <Link
              to="/admin/users"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
            >
              View All Users
            </Link>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Latest 10 Users</h3>
            </div>

            {!users || users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Xác minh
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(users || []).map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.verification?.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {user.verification?.isVerified ? '✓ Đã xác minh' : '⚠ Chưa xác minh'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.role === 'admin'}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={user.role === 'admin' ? 'Cannot deactivate admin users' : 'Deactivate user'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-md w-full p-8 transform transition-all animate-slideUp border-2 border-emerald-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-2xl font-extrabold text-gray-900 text-center mb-3">
                Vô hiệu hóa tài khoản?
              </h3>

              <p className="text-gray-600 text-center mb-2 text-base">
                Bạn có chắc chắn muốn vô hiệu hóa
              </p>
              <p className="text-center mb-6">
                <span className="font-bold text-emerald-600 text-lg">{userToDelete?.name}</span>
              </p>
              <p className="text-gray-500 text-center text-sm mb-8">
                Tài khoản sẽ không thể đăng nhập và các auction của họ sẽ bị ẩn.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleteLoading}
                  className="flex-1 px-5 py-3 border-2 border-red-300 text-red-700 rounded-xl font-bold hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 shadow-md"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  {deleteLoading ? 'Đang xử lý...' : 'Vô hiệu hóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};
