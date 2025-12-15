import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import AuctionCard from '../../components/AuctionCard';
import LoadingScreen from '../../components/LoadingScreen';
import Toast from '../../components/Toast';
import { getAdminDashboard, getAllUsers, deleteUser } from '../../api/admin';

export const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch dashboard statistics
  const fetchDashboardData = async () => {
    try {
      const data = await getAdminDashboard();
      console.log('Admin Dashboard Data:', data); // Debug log

      // Filter out inactive users
      const activeUsers = (data.recentUsersList || []).filter(user => user.isActive !== false);

      // Server already filtered auctions from inactive sellers, no need to filter again
      // Just use the data as-is
      setDashboardData({
        ...data,
        recentUsersList: activeUsers     // Only active users
      });
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data); // More detailed error
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
        console.error('Error loading admin data:', error);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // No dependencies since we're not filtering or paginating

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
      console.error('Error deleting user:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
              <p className="text-red-600 mb-6">{error}</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage auctions, users, and monitor system activity</p>
        </div>

        {/* Statistics Cards */}
        {dashboardData && dashboardData.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Active Auctions
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {dashboardData.stats.activeAuctions || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Approved only
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Auctions
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {dashboardData.stats.totalAuctions || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Users
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {dashboardData.stats.totalUsers || 0}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <Link to="/admin/auctions/pending" className="bg-white rounded-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Pending Auctions
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {dashboardData.stats.pendingAuctions || 0}
                  </p>
                  {dashboardData.stats.pendingAuctions > 0 && (
                    <p className="text-xs text-yellow-600 mt-1 font-medium">
                      ⚠️ Needs approval
                    </p>
                  )}
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent Active Auctions */}
        {dashboardData && (
          <div className="mb-8">
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
                {dashboardData.stats.pendingAuctions > 0 && (
                  <p className="text-yellow-600 text-sm mt-2">
                    You have {dashboardData.stats.pendingAuctions} pending auction{dashboardData.stats.pendingAuctions !== 1 ? 's' : ''} waiting for approval.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-4">
                {dashboardData.recentAuctions.map((auction) => (
                  <AuctionCard key={auction._id} auction={auction} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Management Section */}
        <div>
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
                        Status
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {user.isActive === false ? 'Inactive' : 'Active'}
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
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-md w-full p-8 transform transition-all animate-slideUp border-2 border-red-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="font-bold text-red-600 text-lg">{userToDelete?.name}</span>
              </p>
              <p className="text-gray-500 text-center text-sm mb-8">
                Tài khoản sẽ không thể đăng nhập và các auction của họ sẽ bị ẩn.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleteLoading}
                  className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 shadow-md"
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