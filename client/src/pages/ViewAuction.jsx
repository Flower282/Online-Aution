import { useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeBid, viewAuction, deleteAuction, toggleLikeAuction, checkDeposit, createDeposit } from "../api/auction.js";
import { useSelector } from "react-redux";
import LoadingScreen from "../components/LoadingScreen.jsx";
import socket, { ensureSocketConnected } from "../utils/socket.js";
import { TrendingUp, Package, Heart, Shield, CreditCard, Wallet, Building2, X } from "lucide-react";
import Toast from "../components/Toast.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";

export const ViewAuction = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const inputRef = useRef();
  const _isMountedRef = useRef(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [_topBids, setTopBids] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [_totalBids, setTotalBids] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Deposit states
  const [depositStatus, setDepositStatus] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer');

  const { data, isLoading, error } = useQuery({
    queryKey: ["viewAuctions", id],
    queryFn: () => viewAuction(id),
    staleTime: 30 * 1000,
    placeholderData: () => undefined,
    retry: 1,
    retryDelay: 1000,
    // Don't throw errors that would cause navigation
    throwOnError: false,
    // Keep previous data when refetching to avoid showing "not found" state
    keepPreviousData: true,
  });

  // Initialize currentPrice and likes from data when available
  useEffect(() => {
    if (data) {
      if (data.currentPrice && currentPrice === null) {
        setCurrentPrice(data.currentPrice);
      }

      // Initialize likes
      if (data.likesCount !== undefined) {
        setLikesCount(data.likesCount);
      }

      // Check if current user has liked this auction
      if (data.likes && user?.user?._id) {
        setIsLiked(data.likes.includes(user.user._id));
      }
    }
  }, [data, currentPrice, user?.user?._id]);

  // Check deposit status when page loads
  useEffect(() => {
    const fetchDepositStatus = async () => {
      if (!id || !user?.user?._id) return;

      // Wait for data to load
      if (!data?.seller?._id) return;

      // Don't check deposit for own auctions
      if (data.seller._id === user.user._id) return;

      // Don't check if auction ended
      const isAuctionActive = new Date(data.itemEndDate) > new Date();
      if (!isAuctionActive) return;

      try {
        console.log('💰 Checking deposit for auction:', id);
        const status = await checkDeposit(id);
        setDepositStatus(status);
        console.log('💰 Deposit status:', status);
      } catch (error) {
        console.error('Error checking deposit:', error);
        // Set default deposit status so UI still shows
        if (data?.startingPrice) {
          const defaultPercentage = 10;
          setDepositStatus({
            hasDeposit: false,
            depositRequired: true,
            depositPercentage: defaultPercentage,
            depositAmount: Math.round(data.startingPrice * defaultPercentage / 100),
            startingPrice: data.startingPrice
          });
        }
      }
    };

    fetchDepositStatus();
  }, [id, user?.user?._id, data]);

  // Countdown timer effect
  useEffect(() => {
    if (!data?.itemEndDate) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = new Date(data.itemEndDate).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, ended: false });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [data?.itemEndDate]);

  // Socket.io integration
  useEffect(() => {
    if (!id) return;

    let cleanedUp = false;

    // Connect socket and join auction room
    const initSocket = async () => {
      try {
        await ensureSocketConnected();

        if (cleanedUp) return; // Component unmounted during connection

        console.log('🔵 Joining auction room:', id);

        // Join auction room
        socket.emit('auction:join', { auctionId: id });

        // Get initial state
        socket.emit('auction:get-state', { auctionId: id });
      } catch (error) {
        console.error('Failed to connect socket:', error);
        setToast({ message: "Không thể kết nối real-time. Vui lòng tải lại trang.", type: "error" });
      }
    };

    initSocket();

    // Listen for join confirmation
    socket.on('auction:joined', (data) => {
      console.log('✅ Joined auction:', data);
    });

    // Listen for auction state
    socket.on('auction:state', (state) => {
      console.log('📊 Auction state received:', state);
      setTopBids(state.topBids || []);
      setTotalBids(state.totalBids || 0);
      if (state.highestBid) {
        setCurrentPrice(state.highestBid.amount);
      }
    });

    // Listen for bid updates from other users
    socket.on('auction:bid:updated', (update) => {
      console.log('📡 Bid updated:', update);
      setTopBids(update.topBids || []);
      setTotalBids(update.totalBids || 0);
      if (update.topBids && update.topBids.length > 0) {
        setCurrentPrice(update.topBids[0].amount);
      }
      // Refresh query to update UI
      queryClient.invalidateQueries({ queryKey: ["viewAuctions", id] });

      // Show notification if bid is from another user
      if (update.userId !== user?.user?._id) {
        setToast({
          message: `Có người vừa đặt giá: ${formatCurrency(update.amount)}`,
          type: "info"
        });
      }
    });

    // Listen for bid success
    socket.on('auction:bid:success', (result) => {
      console.log('✅ Bid success:', result);

      // Clear input field
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      // Update local state with new bid
      if (result.bid) {
        setCurrentPrice(result.bid.amount);
      }

      // Refresh auction data from server
      queryClient.invalidateQueries({ queryKey: ["viewAuctions", id] });

      // Request updated state from socket
      socket.emit('auction:get-state', { auctionId: id });

      // Show success toast
      setToast({
        message: "Đặt giá thành công! 🎉",
        type: "success"
      });
    });

    // Listen for bid errors
    socket.on('auction:bid:error', (error) => {
      console.error('❌ Bid error:', error);
      let errorMessage = error.message;

      if (error.code === 'PRICE_EXISTS') {
        errorMessage = `Giá ${formatCurrency(error.existingAmount)} đã có người đặt. Vui lòng chọn giá khác!`;
      } else if (error.code === 'DEPOSIT_REQUIRED') {
        // Show deposit modal instead of error toast
        setDepositStatus({
          hasDeposit: false,
          depositRequired: true,
          depositAmount: error.depositAmount,
          depositPercentage: error.depositPercentage
        });
        setShowDepositModal(true);
        return; // Don't show error toast
      }

      // Refresh data to show latest price
      queryClient.invalidateQueries({ queryKey: ["viewAuctions", id] });
      socket.emit('auction:get-state', { auctionId: id });

      setToast({ message: errorMessage, type: "error" });
    });

    // Listen for general errors
    socket.on('auction:error', (error) => {
      console.error('❌ Auction error:', error);
      setToast({ message: error.message, type: "error" });
    });

    // Listen for like/unlike updates
    socket.on('auction:like:updated', (update) => {
      console.log('📡 ViewAuction: Like update received:', update);

      // Update likes count
      setLikesCount(update.likesCount);

      // Update isLiked if it's current user's action
      if (update.userId === user?.user?._id) {
        setIsLiked(update.isLiked);
      }

      // Refresh query data
      queryClient.invalidateQueries({ queryKey: ["viewAuctions", id] });
    });

    // Cleanup on unmount
    return () => {
      cleanedUp = true;
      console.log('🔴 Leaving auction room:', id);
      if (socket.connected) {
        socket.emit('auction:leave', { auctionId: id });
      }
      socket.off('auction:joined');
      socket.off('auction:state');
      socket.off('auction:bid:updated');
      socket.off('auction:bid:success');
      socket.off('auction:bid:error');
      socket.off('auction:error');
      socket.off('auction:like:updated');
    };
  }, [id, user?.user?._id, queryClient]);

  const _placeBidMutate = useMutation({
    mutationFn: ({ bidAmount, id }) => placeBid({ bidAmount, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      if (inputRef.current) inputRef.current.value = "";
      setToast({ message: "Đặt giá thành công!", type: "success" });
    },
    onError: (error) => {
      setToast({ message: error.message || "Không thể đặt giá. Vui lòng thử lại.", type: "error" });
    },
  });

  const deleteAuctionMutate = useMutation({
    mutationFn: (id) => deleteAuction(id),
    onSuccess: () => {
      // Invalidate all auction-related queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["allAuction"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllAuctions"] }); // ✅ Added for admin test page
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["myauctions"] });
      queryClient.invalidateQueries({ queryKey: ["viewAuctions"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });

      setToast({ message: "Xóa auction thành công!", type: "success" });
      // Navigate after a short delay to show the toast
      setTimeout(() => navigate("/auction"), 1000);
    },
    onError: (error) => {
      setToast({ message: error.message || "Không thể xóa auction. Vui lòng thử lại.", type: "error" });
    },
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteAuctionMutate.mutate(id);
    setShowDeleteConfirm(false);
  };

  if (isLoading) return <LoadingScreen />;

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error Loading Auction</h2>
          <p className="text-gray-700 mb-6">{error.message || "Failed to load auction details"}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/auction" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold">
              Back to Auctions
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle undefined data
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f1e8' }}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-green-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Auction Not Found</h2>
          <p className="text-gray-700 mb-6">This auction may have been removed or doesn't exist.</p>
          <Link to="/auction" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Check if seller is inactive
  const isSellerInactive = data.seller?.isActive === false;

  const handleBidSubmit = (e) => {
    e.preventDefault();
    const bidAmountInput = e.target.bidAmount.value.trim();
    const bidAmount = parseFloat(bidAmountInput);

    console.log('🔍 Bid Submit Debug:', {
      input: bidAmountInput,
      parsed: bidAmount,
      isValid: !isNaN(bidAmount) && bidAmount > 0,
      currentPrice: currentPrice || data.currentPrice,
      socketConnected: socket.connected,
      socketId: socket.id
    });

    if (!bidAmountInput || isNaN(bidAmount) || bidAmount <= 0) {
      setToast({ message: "Vui lòng nhập giá hợp lệ", type: "error" });
      return;
    }

    const minBid = (currentPrice || data.currentPrice) + 1;
    const maxBid = (currentPrice || data.currentPrice) + 10;

    if (bidAmount < minBid) {
      setToast({ message: `Giá đặt phải từ ${formatCurrency(minBid)} trở lên`, type: "error" });
      return;
    }

    if (bidAmount > maxBid) {
      setToast({ message: `Giá đặt không được vượt quá ${formatCurrency(maxBid)}`, type: "error" });
      return;
    }

    // user.user._id vì Redux state có cấu trúc { user: { user: { _id, name, ... } } }
    const userId = user?.user?._id;

    if (!userId) {
      setToast({ message: "Vui lòng đăng nhập để đặt giá", type: "error" });
      return;
    }

    // Check socket connection
    if (!socket.connected) {
      console.error('❌ Socket not connected!');
      setToast({ message: "Kết nối thất bại. Vui lòng tải lại trang.", type: "error" });
      return;
    }

    console.log('🟢 Placing bid via socket:', {
      auctionId: id,
      userId,
      amount: bidAmount,
      socketId: socket.id,
      connected: socket.connected
    });

    // Send bid via socket instead of HTTP
    socket.emit('auction:bid', {
      auctionId: id,
      userId: userId,
      amount: bidAmount
    });

    console.log('📤 Bid emitted to socket');
  };

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const result = await toggleLikeAuction(id);
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
      setToast({
        message: result.isLiked ? "Đã thêm vào yêu thích ❤️" : "Đã bỏ yêu thích",
        type: "success"
      });
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      setToast({ message: error.message, type: "error" });
    } finally {
      setIsLiking(false);
    }
  };

  const _daysLeft = Math.ceil(
    Math.max(0, new Date(data.itemEndDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const isActive = Math.max(0, new Date(data.itemEndDate) - new Date()) > 0;
  const topTenBids = [...(data.bids || [])]
    .sort((a, b) => b.bidAmount - a.bidAmount)
    .slice(0, 10);

  // Check auction status
  const isApproved = data?.status === 'approved';
  const isPending = data?.status === 'pending';
  const isRejected = data?.status === 'rejected';

  // Handle deposit submission
  const handleDepositSubmit = async () => {
    if (isSubmittingDeposit) return;

    setIsSubmittingDeposit(true);
    try {
      const result = await createDeposit(id, {
        paymentMethod: selectedPaymentMethod,
        transactionId: `TXN_${Date.now()}` // Generate a mock transaction ID
      });

      setDepositStatus({
        ...depositStatus,
        hasDeposit: true,
        deposit: result.deposit
      });
      setShowDepositModal(false);
      setToast({ message: result.message || "Đặt cọc thành công! Bạn có thể đấu giá ngay.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể đặt cọc. Vui lòng thử lại.", type: "error" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const paymentMethods = [
    { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', icon: Building2 },
    { id: 'credit_card', name: 'Thẻ tín dụng', icon: CreditCard },
    { id: 'wallet', name: 'Ví điện tử', icon: Wallet },
  ];

  // Debug info - after all variables are declared
  console.log('🔍 Debug Place Bid Visibility:', {
    userId: user?.user?._id,
    sellerId: data?.seller?._id,
    isUserSeller: data?.seller?._id === user?.user?._id,
    isActive,
    isSellerInactive,
    status: data?.status,
    isApproved,
    showBidForm: data?.seller?._id !== user?.user?._id && isActive && !isSellerInactive && isApproved
  });

  return (
    <div className="min-h-screen mx-auto container" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className={`w-full aspect-square bg-white rounded-md shadow-lg border-2 overflow-hidden flex items-center justify-center relative ${!isActive ? 'border-gray-300' : 'border-red-200'
              }`}>
              <img
                src={data.itemPhoto || "https://picsum.photos/601"}
                alt={data.itemName}
                className={`h-full w-full object-cover transition-all duration-300 ${!isActive ? 'opacity-60 grayscale' : ''
                  }`}
              />
              {/* Overlay for ended auctions */}
              {!isActive && (
                <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                    ĐÃ KẾT THÚC
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className={`space-y-4 transition-all duration-300 ${!isActive ? 'opacity-75' : ''}`}>
            {/* Title & Description */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs font-medium">
                    {data.itemCategory}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {isActive ? "Active" : "Ended"}
                  </span>
                </div>
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center gap-2 px-4 py-2 rounded-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isLiked ? '#fee2e2' : '#f9fafb',
                    border: isLiked ? '2px solid #ef4444' : '2px solid #e5e7eb'
                  }}
                >
                  <Heart
                    className={`h-5 w-5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                  />
                  <span className={`font-semibold text-sm ${isLiked ? 'text-red-600' : 'text-gray-700'}`}>
                    {likesCount}
                  </span>
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {data.itemName}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {data.itemDescription}
              </p>
            </div>

            {/* Grid Layout for Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pricing Info */}
              <div className="bg-white p-4 rounded-md shadow-md border border-red-200 md:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Starting Price */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                    <p className="text-[10px] text-amber-700 font-medium mb-0.5 flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5" />
                      Starting
                    </p>
                    <p className="text-lg font-bold text-amber-800">
                      {formatCurrency(data.startingPrice)}
                    </p>
                  </div>

                  {/* Current Price */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border-2 border-emerald-300">
                    <p className="text-[10px] text-emerald-700 font-medium mb-0.5 flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5" />
                      Current
                    </p>
                    <p className="text-xl font-bold text-emerald-800">
                      {formatCurrency(currentPrice ?? data.currentPrice)}
                    </p>
                  </div>

                  {/* Total Bids */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                    <p className="text-[10px] text-red-700 font-medium mb-0.5 flex items-center gap-1">
                      <Package className="h-2.5 w-2.5" />
                      Bids
                    </p>
                    <p className="text-lg font-bold text-red-800">
                      {data.bids.length}
                    </p>
                  </div>

                  {/* Likes */}
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-3 rounded-lg border border-rose-200">
                    <p className="text-[10px] text-rose-700 font-medium mb-0.5 flex items-center gap-1">
                      <Heart className="h-2.5 w-2.5 fill-rose-500" />
                      Likes
                    </p>
                    <p className="text-lg font-bold text-rose-800">
                      {likesCount}
                    </p>
                  </div>
                </div>

                {/* Time Left - Full width bar with countdown */}
                <div className={`mt-3 p-3 rounded-lg border ${isActive
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                  }`}>
                  <p className={`text-[10px] font-medium mb-1 ${isActive ? 'text-green-700' : 'text-gray-600'
                    }`}>
                    ⏰ Time Remaining
                  </p>
                  {timeRemaining ? (
                    timeRemaining.ended ? (
                      <p className="text-lg font-bold text-gray-500">Ended</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        {timeRemaining.days > 0 && (
                          <div className="flex flex-col items-center bg-green-100 px-2 py-1 rounded">
                            <span className="text-xl font-bold text-green-800">{timeRemaining.days}</span>
                            <span className="text-[8px] text-green-600">days</span>
                          </div>
                        )}
                        <div className="flex flex-col items-center bg-green-100 px-2 py-1 rounded">
                          <span className="text-xl font-bold text-green-800">{String(timeRemaining.hours).padStart(2, '0')}</span>
                          <span className="text-[8px] text-green-600">hrs</span>
                        </div>
                        <span className="text-green-800 font-bold">:</span>
                        <div className="flex flex-col items-center bg-green-100 px-2 py-1 rounded">
                          <span className="text-xl font-bold text-green-800">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                          <span className="text-[8px] text-green-600">min</span>
                        </div>
                        <span className="text-green-800 font-bold">:</span>
                        <div className="flex flex-col items-center bg-green-100 px-2 py-1 rounded">
                          <span className="text-xl font-bold text-green-800">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                          <span className="text-[8px] text-green-600">sec</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-lg font-bold text-green-800">Loading...</p>
                  )}
                </div>
              </div>

              {/* Warning if auction ended */}
              {!isActive && (
                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Đấu giá đã kết thúc</h3>
                      <p className="text-red-700 text-sm">
                        Phiên đấu giá này đã kết thúc. Không thể đặt giá thêm.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if seller is inactive */}
              {isSellerInactive && isActive && (
                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">Không thể đấu giá</h3>
                      <p className="text-red-700 text-sm">
                        Tài khoản người bán đã bị vô hiệu hóa. Bạn có thể xem thông tin nhưng không thể đặt giá cho phiên đấu giá này.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if auction is pending approval */}
              {isActive && isPending && !isSellerInactive && (
                <div className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">⏳ Đang chờ phê duyệt</h3>
                      <p className="text-yellow-700 text-sm">
                        Đấu giá này đang chờ admin phê duyệt. Bạn có thể xem thông tin nhưng chưa thể đặt giá cho đến khi được phê duyệt.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if auction is rejected */}
              {isActive && isRejected && !isSellerInactive && (
                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Đấu giá bị từ chối</h3>
                      <p className="text-red-700 text-sm mb-2">
                        Đấu giá này đã bị admin từ chối và không thể nhận đặt giá.
                      </p>
                      {data.rejectionReason && (
                        <div className="mt-2 bg-red-100 p-3 rounded">
                          <p className="text-xs font-semibold text-red-800">Lý do:</p>
                          <p className="text-sm text-red-700">{data.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit Status & Bid Form - Only show if approved */}
              {data.seller._id != user.user._id && isActive && !isSellerInactive && isApproved && (
                <div className="bg-white p-6 rounded-md shadow-md border border-green-200 md:col-span-2">
                  {/* Deposit Status - Loading */}
                  {!depositStatus && (
                    <div className="mb-4 p-4 rounded-lg border-2 bg-gray-50 border-gray-200 animate-pulse">
                      <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-gray-400" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deposit Status - Loaded */}
                  {depositStatus && (
                    <div className={`mb-4 p-4 rounded-lg border-2 ${depositStatus.hasDeposit
                      ? 'bg-green-50 border-green-300'
                      : 'bg-amber-50 border-amber-300'
                      }`}>
                      <div className="flex items-center gap-3">
                        <Shield className={`h-6 w-6 ${depositStatus.hasDeposit ? 'text-green-600' : 'text-amber-600'}`} />
                        <div className="flex-1">
                          <h4 className={`font-semibold ${depositStatus.hasDeposit ? 'text-green-800' : 'text-amber-800'}`}>
                            {depositStatus.hasDeposit ? '✓ Đã đặt cọc' : 'Cần đặt cọc trước khi đấu giá'}
                          </h4>

                        </div>

                      </div>
                      {depositStatus.hasDeposit && depositStatus.deposit && (
                        <p className="text-xs text-green-600 mt-2">
                          Đã cọc lúc: {new Date(depositStatus.deposit.paidAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Show bid form only if deposited */}
                  {depositStatus?.hasDeposit ? (
                    <>
                      <h3 className="text-lg font-semibold mb-4">Place Your Bid</h3>
                      <form onSubmit={handleBidSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="bidAmount"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Bid Amount (minimum: {formatCurrency((currentPrice || data.currentPrice) + 1)} maximum: {formatCurrency((currentPrice || data.currentPrice) + 10)})
                          </label>
                          <input
                            type="number"
                            name="bidAmount"
                            id="bidAmount"
                            ref={inputRef}
                            min={(currentPrice || data.currentPrice) + 1}
                            max={(currentPrice || data.currentPrice) + 10}
                            step="0.01"
                            className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Enter your bid amount"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-semibold shadow-md"
                        >
                          Place Bid
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">
                        Bạn cần đặt cọc <span className="font-bold text-amber-600">{formatCurrency(depositStatus?.depositAmount || Math.round((data?.startingPrice || 0) * (depositStatus?.depositPercentage || 10) / 100))}</span> để tham gia đấu giá
                      </p>
                      <button
                        onClick={() => setShowDepositModal(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                      >
                        <Shield className="h-5 w-5" />
                        Đặt cọc ngay
                      </button>
                      <p className="text-xs text-gray-500 mt-3">
                        💡 Tiền cọc sẽ được hoàn trả nếu bạn không thắng đấu giá
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Seller Info */}
              <div className={`p-6 rounded-md shadow-md border md:col-span-2 ${isSellerInactive
                ? 'bg-red-50 border-red-200'
                : 'bg-gradient-to-r from-emerald-50 to-green-50 border-green-200'
                }`}>
                <h3 className="text-lg font-semibold mb-3 text-red-700">Seller Information</h3>
                <p className={`font-medium ${isSellerInactive ? 'text-red-700' : 'text-emerald-800'
                  }`}>
                  {isSellerInactive ? 'Tài khoản bị vô hiệu hóa' : data.seller.name}
                </p>
                {isSellerInactive && (
                  <p className="text-xs text-red-600 mt-2">
                    Tài khoản này đã bị vô hiệu hóa bởi quản trị viên
                  </p>
                )}
              </div>

              {/* Admin Delete Button */}
              {user?.user?.role === "admin" && (
                <div className="bg-white p-6 rounded-md shadow-md border border-red-200 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 text-red-600">Admin Actions</h3>
                  <button
                    onClick={handleDelete}
                    disabled={deleteAuctionMutate.isPending}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteAuctionMutate.isPending ? "Deleting..." : "Delete Auction"}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    ⚠️ This action cannot be undone. All bids will be permanently deleted.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-red-700 mb-6">Bid History</h2>
          <div className="bg-white rounded-md shadow-md border border-red-200 overflow-hidden">
            {topTenBids.length === 0 ? (
              <div className="p-8 text-center text-amber-700">
                No bids yet. Be the first to bid!
              </div>
            ) : (
              <div className="divide-y divide-red-50">
                {topTenBids.map((bid, index) => (
                  <div
                    key={index}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-emerald-800">
                        {bid.bidder?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(bid.bidTime).toLocaleDateString()} at{" "}
                        {new Date(bid.bidTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-700">
                        {formatCurrency(bid.bidAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this auction? This action cannot be undone and all bids will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  <h3 className="text-xl font-bold">Đặt cọc tham gia đấu giá</h3>
                </div>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Deposit Amount */}
              {(() => {
                const percentage = depositStatus?.depositPercentage || 10;
                const startPrice = data?.startingPrice || 0;
                const depositAmt = depositStatus?.depositAmount || Math.round(startPrice * percentage / 100);
                return (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200">
                    <p className="text-sm text-amber-700 mb-1">Số tiền cọc</p>
                    <p className="text-3xl font-bold text-amber-800">
                      {formatCurrency(depositAmt)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      = {percentage}% của giá khởi điểm ({formatCurrency(startPrice)})
                    </p>
                  </div>
                );
              })()}

              {/* Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Lưu ý:</strong> Tiền cọc sẽ được hoàn trả đầy đủ nếu bạn không thắng đấu giá.
                  Nếu thắng, tiền cọc sẽ được trừ vào giá cuối cùng.
                </p>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</p>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedPaymentMethod === method.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <method.icon className={`h-5 w-5 ${selectedPaymentMethod === method.id ? 'text-amber-600' : 'text-gray-500'
                        }`} />
                      <span className={`font-medium ${selectedPaymentMethod === method.id ? 'text-amber-800' : 'text-gray-700'
                        }`}>
                        {method.name}
                      </span>
                      {selectedPaymentMethod === method.id && (
                        <span className="ml-auto text-amber-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleDepositSubmit}
                disabled={isSubmittingDeposit}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingDeposit ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Xác nhận đặt cọc {formatCurrency(depositStatus?.depositAmount || Math.round((data?.startingPrice || 0) * (depositStatus?.depositPercentage || 10) / 100))}
                  </>
                )}
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
  );
};