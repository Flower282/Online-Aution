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
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [showStatusMenu, setShowStatusMenu] = useState(false); // dropdown for account status
  const [showVerificationMenu, setShowVerificationMenu] = useState(false); // dropdown for verification

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
      setError('Không thể tải danh sách người dùng');
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
    <div className="min-h-screen bg-transparent max-w-7xl mx-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-600 mb-2">Tất Cả Người Dùng</h1>
            <p className="text-gray-600">Quản lý và theo dõi tất cả người dùng đã đăng ký</p>
          </div>
        </div>

        {/* Search and Filters - giao diện giống thanh lọc AuctionList */}
        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-emerald-200 shadow-lg">
          {/* Search Users */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm người dùng
            </label>
            <input
              type="text"
              id="search"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              autoComplete="off"
              className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
            />
          </div>

          {/* Filter tabs style giống AuctionList */}
          <div className="border-t border-emerald-100 pt-4 mt-2">
            <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
              Lọc và sắp xếp người dùng
            </h3>

            <div className="flex flex-wrap gap-3 relative">
              {/* Tất cả */}
              <button
                onClick={() => {
                  setAccountStatusFilter('all');
                  setVerificationFilter('all');
                  setDateFilter('all');
                }}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${accountStatusFilter === 'all' && verificationFilter === 'all' && dateFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
              >
                Tất cả
              </button>

              {/* Account Status Filter - dropdown box (All / Active / Inactive) */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${accountStatusFilter !== 'all'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  Trạng thái tài khoản:{" "}
                  {accountStatusFilter === 'all' ? 'Tất cả' : accountStatusFilter === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  <svg className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white border-2 border-emerald-200 rounded-lg shadow-2xl z-[100] min-w-[220px]">
                    <button
                      onClick={() => {
                        setAccountStatusFilter('all');
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${accountStatusFilter === 'all' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => {
                        setAccountStatusFilter('active');
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${accountStatusFilter === 'active' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      Hoạt động
                    </button>
                    <button
                      onClick={() => {
                        setAccountStatusFilter('inactive');
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${accountStatusFilter === 'inactive' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      Không hoạt động
                    </button>
                  </div>
                )}
              </div>

              {/* Verification Filter - dropdown box (All / Verified / Not Verified) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowVerificationMenu(!showVerificationMenu);
                    setShowStatusMenu(false);
                  }}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${verificationFilter !== 'all'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  Xác minh:{" "}
                  {verificationFilter === 'all'
                    ? 'Tất cả'
                    : verificationFilter === 'verified'
                      ? 'Đã xác minh'
                      : 'Chưa xác minh'}
                  <svg className={`w-4 h-4 transition-transform ${showVerificationMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showVerificationMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white border-2 border-emerald-200 rounded-lg shadow-2xl z-[100] min-w-[220px]">
                    <button
                      onClick={() => {
                        setVerificationFilter('all');
                        setShowVerificationMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${verificationFilter === 'all' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => {
                        setVerificationFilter('verified');
                        setShowVerificationMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${verificationFilter === 'verified' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      Đã xác minh
                    </button>
                    <button
                      onClick={() => {
                        setVerificationFilter('not_verified');
                        setShowVerificationMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${verificationFilter === 'not_verified' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'text-gray-700'
                        }`}
                    >
                      Chưa xác minh
                    </button>
                  </div>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <span className="text-xs font-medium text-gray-600 mr-1">Ngày tạo:</span>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === 'today'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === 'week'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  7 ngày
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${dateFilter === 'month'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  30 ngày
                </button>
                <span className="text-xs text-gray-500 ml-2">
                  Đang hiển thị {filteredUsers.length} / {users.length} người dùng
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 mb-6">
            <p className="text-emerald-600">{error}</p>
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
                      <span>Người Dùng</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vai Trò</span>
                      {getSortIcon('role')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ngày Tạo</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastLogin')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Đăng Nhập Cuối</span>
                      {getSortIcon('lastLogin')}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vị Trí
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xác minh
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      Không tìm thấy người dùng phù hợp với tiêu chí của bạn.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    // Tạo màu nền gradient 5 cấp độ nhạt hơn (mức ~150): xanh lá cây, xanh ngọc, xanh dương nhạt, lặp lại
                    const bgColors = ['#e0fcec', '#dcfbee', '#dafdf6', '#e5fdf8', '#e0fcfe']; // emerald-150, emerald-150, teal-150, teal-150, cyan-150
                    const bgColor = bgColors[index % 5];

                    return (
                      <tr key={user._id} style={{ backgroundColor: bgColor }} className="hover:bg-emerald-300 hover:shadow-md transition-all duration-200">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-2 ${user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
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
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border-2 ${user.verification?.isVerified
                            ? 'bg-teal-100 text-teal-800 border-teal-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-2 ${user.isActive === false
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}>
                              {user.isActive === false ? 'Không Hoạt Động' : 'Hoạt Động'}
                            </span>
                            {user.reactivationRequest?.requested && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border-2 border-yellow-300 animate-pulse">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Yêu Cầu Chờ Duyệt
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {user.isActive === false ? (
                              <button
                                onClick={() => handleReactivateClick(user)}
                                className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                title="Kích hoạt lại người dùng"
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
                                title={user.role === 'admin' ? 'Không thể vô hiệu hóa người dùng admin' : 'Vô hiệu hóa người dùng'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                Tài khoản sẽ không thể đăng nhập và các auction của họ sẽ bị ẩn. Bạn có thể kích hoạt lại sau.
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

        {/* Reactivate Confirmation Dialog */}
        {reactivateDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-md w-full p-8 transform transition-all animate-slideUp border-2 border-emerald-100">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <span className="font-bold text-emerald-600 text-lg">{userToReactivate?.name}</span>
              </p>
              <p className="text-gray-500 text-center text-sm mb-8">
                Tài khoản sẽ có thể đăng nhập và các auction của họ sẽ hiển thị trở lại.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleReactivateCancel}
                  disabled={reactivateLoading}
                  className="flex-1 px-5 py-3 border-2 border-red-300 text-red-700 rounded-xl font-bold hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 shadow-md"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReactivateConfirm}
                  disabled={reactivateLoading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
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
