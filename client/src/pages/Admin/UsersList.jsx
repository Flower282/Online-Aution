import { useState, useEffect, useCallback } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import Toast from '../../components/Toast';
import { getAllUsers, deleteUser, reactivateUser } from '../../api/admin';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [userToReactivate, setUserToReactivate] = useState(null);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter states
  const [accountStatusFilter, setAccountStatusFilter] = useState('all'); // all, active, inactive
  const [verificationFilter, setVerificationFilter] = useState('all'); // all, verified, not_verified
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom

  // Debounce search term - chỉ search sau 400ms ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (page = 1, search = '', sort = 'createdAt', order = 'desc') => {
    try {
      setError(null);
      const response = await getAllUsers(page, search, 'all', 100, sort, order); // Increased limit for client-side filtering
      // Show both active and inactive so admin can reactivate
      setUsers(response.data.users || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Apply filters to users
  const filteredUsers = users.filter(user => {
    // Account status filter
    if (accountStatusFilter === 'active' && user.isActive === false) return false;
    if (accountStatusFilter === 'inactive' && user.isActive !== false) return false;

    // Verification filter
    if (verificationFilter === 'verified' && !user.verification?.isVerified) return false;
    if (verificationFilter === 'not_verified' && user.verification?.isVerified) return false;

    // Date filter
    if (dateFilter !== 'all' && user.createdAt) {
      const createdDate = new Date(user.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      if (dateFilter === 'today' && daysDiff > 0) return false;
      if (dateFilter === 'week' && daysDiff > 7) return false;
      if (dateFilter === 'month' && daysDiff > 30) return false;
    }

    return true;
  });

  // Fetch users khi debounced search term thay đổi
  useEffect(() => {
    fetchUsers(currentPage, debouncedSearchTerm, sortBy, sortOrder);
  }, [currentPage, debouncedSearchTerm, sortBy, sortOrder, fetchUsers]);

  // Reset page về 1 khi search term thay đổi
  useEffect(() => {
    if (searchTerm !== '') {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLocation = (location) => {
    if (!location) return 'Unknown';
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.ward) parts.push(location.ward);
    if (location.country) parts.push(location.country);
    return parts.length > 0 ? parts.join(', ') : 'Unknown';
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
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
      // Refresh the users list - user will disappear from list
      await fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      setToast({ message: 'Vô hiệu hóa tài khoản thành công! User đã bị ẩn khỏi danh sách.', type: 'success' });
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

  const handleReactivateClick = (user) => {
    setUserToReactivate(user);
    setReactivateDialogOpen(true);
  };

  const handleReactivateConfirm = async () => {
    if (!userToReactivate) return;

    try {
      setReactivateLoading(true);
      await reactivateUser(userToReactivate._id);
      // Refresh the users list - user will appear in list again
      await fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
      setReactivateDialogOpen(false);
      setUserToReactivate(null);
      setToast({ message: 'Kích hoạt lại tài khoản thành công! User đã xuất hiện trở lại.', type: 'success' });
    } catch (error) {
      console.error('Error reactivating user:', error);
      setToast({ message: error.message || 'Không thể kích hoạt lại tài khoản. Vui lòng thử lại.', type: 'error' });
    } finally {
      setReactivateLoading(false);
    }
  };

  const handleReactivateCancel = () => {
    setReactivateDialogOpen(false);
    setUserToReactivate(null);
  };

  if (initialLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Users</h1>
            <p className="text-gray-600">Manage and monitor all registered users</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Account Status Filter */}
            <div>
              <label htmlFor="accountStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Account Status
              </label>
              <select
                id="accountStatus"
                value={accountStatusFilter}
                onChange={(e) => setAccountStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <label htmlFor="verification" className="block text-sm font-medium text-gray-700 mb-2">
                Verification
              </label>
              <select
                id="verification"
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="verified">Verified</option>
                <option value="not_verified">Not Verified</option>
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Created Date:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${dateFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${dateFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Last 30 Days
              </button>
            </div>
            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>User</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Role</span>
                      {getSortIcon('role')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date Created</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastLogin')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Login</span>
                      {getSortIcon('lastLogin')}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xác minh
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {user.avatar ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover"
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-cyan-100 text-cyan-800'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">
                        {formatLocation(user.location)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${user.verification?.isVerified
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {user.verification?.isVerified ? (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Đã xác minh
                            </>
                          ) : (
                            'Chưa xác minh'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-cyan-100 text-cyan-800'
                            }`}>
                            {user.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                          {user.reactivationRequest?.requested && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 animate-pulse">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              Pending Request
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {user.isActive === false ? (
                            <button
                              onClick={() => handleReactivateClick(user)}
                              className="text-cyan-600 hover:text-cyan-900 transition-colors"
                              title="Reactivate user"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              disabled={user.role === 'admin'}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title={user.role === 'admin' ? 'Cannot deactivate admin users' : 'Deactivate user'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={!pagination.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((currentPage - 1) * pagination.limit) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pagination.limit, pagination.totalUsers)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalUsers}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={!pagination.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
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
                Tài khoản sẽ không thể đăng nhập và các auction của họ sẽ bị ẩn. Bạn có thể kích hoạt lại sau.
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

        {/* Reactivate Confirmation Dialog */}
        {reactivateDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-md w-full p-8 transform transition-all animate-slideUp border-2 border-cyan-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-2xl font-extrabold text-gray-900 text-center mb-3">
                Kích hoạt lại tài khoản?
              </h3>

              <p className="text-gray-600 text-center mb-2 text-base">
                Bạn có chắc chắn muốn kích hoạt lại
              </p>
              <p className="text-center mb-6">
                <span className="font-bold text-cyan-600 text-lg">{userToReactivate?.name}</span>
              </p>
              <p className="text-gray-500 text-center text-sm mb-8">
                Tài khoản sẽ có thể đăng nhập và các auction của họ sẽ hiển thị trở lại.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleReactivateCancel}
                  disabled={reactivateLoading}
                  className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 shadow-md"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReactivateConfirm}
                  disabled={reactivateLoading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl font-bold hover:from-cyan-700 hover:to-cyan-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  {reactivateLoading ? 'Đang xử lý...' : 'Kích hoạt'}
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
