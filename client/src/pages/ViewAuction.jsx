import { useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placeBid, viewAuction, deleteAuction, toggleLikeAuction, checkDeposit, createDeposit } from "../api/auction.js";
import { useSelector } from "react-redux";
import LoadingScreen from "../components/LoadingScreen.jsx";
import socket, { ensureSocketConnected } from "../utils/socket.js";
import { X, Heart } from "lucide-react"; // Keep X icon for modal close button
import Toast from "../components/Toast.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";
import VerificationModal from "../components/VerificationModal.jsx";
import ProfileCompletionModal from "../components/ProfileCompletionModal.jsx";

export const ViewAuction = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.user?.role === "admin";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const inputRef = useRef();
  const _isMountedRef = useRef(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [bidInputValue, setBidInputValue] = useState('');
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

  // Verification states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const isVerified = user?.user?.verification?.isVerified;

  // Profile completion states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState({});

  // Requires authentication (protected route)
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
      setBidInputValue('');

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
      } else if (error.code === 'VERIFICATION_REQUIRED') {
        // Show verification modal
        setShowVerificationModal(true);
        return; // Don't show error toast
      } else if (error.code === 'PROFILE_INCOMPLETE') {
        // Show profile completion modal
        setMissingFields(error.missingFields || {});
        setShowProfileModal(true);
        return; // Don't show error toast
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
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md">
          <h2 className="text-2xl font-bold text-emerald-700 mb-4">Error Loading Auction</h2>
          <p className="text-gray-700 mb-6">{error.message || "Failed to load auction details"}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/auction" className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
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
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md">
          <h2 className="text-2xl font-bold text-emerald-700 mb-4">Auction Not Found</h2>
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

  // Calculate isActive BEFORE using it in getAuctionStatusInfo
  const isActive = Math.max(0, new Date(data.itemEndDate) - new Date()) > 0;

  // Product / auction status label for detail page
  const getAuctionStatusInfo = () => {
    const auctionStatus = data.auctionStatus; // active, ended, completed, cancelled, expired
    const paymentStatus = data.paymentStatus; // pending, paid, expired (nếu có)

    // Ưu tiên kiểm tra thời gian: nếu còn thời gian thì luôn là "Đang diễn ra"
    if (isActive) {
      // Kiểm tra các trạng thái đặc biệt trước
      if (auctionStatus === 'cancelled') {
        return { label: 'Đã hủy', className: 'bg-emerald-100 text-emerald-800' };
      }

      // Nếu còn thời gian và không bị hủy, luôn hiển thị "Đang diễn ra"
      return { label: 'Đang diễn ra', className: 'bg-emerald-100 text-emerald-800' };
    }

    // Nếu đã hết thời gian, kiểm tra các trạng thái khác
    if (auctionStatus === 'cancelled') {
      return { label: 'Đã hủy', className: 'bg-emerald-100 text-emerald-800' };
    }

    if (auctionStatus === 'expired') {
      return { label: 'Hết hạn (không có người tham gia)', className: 'bg-gray-100 text-gray-800' };
    }

    if (auctionStatus === 'completed' || paymentStatus === 'paid') {
      return { label: 'Đã thanh toán / Hoàn tất', className: 'bg-emerald-100 text-emerald-800' };
    }

    // Đã kết thúc nhưng chưa hoàn tất thanh toán
    if (auctionStatus === 'ended' || !isActive) {
      return { label: 'Đã kết thúc, chờ thanh toán', className: 'bg-yellow-100 text-yellow-800' };
    }

    // Mặc định: đang diễn ra (fallback)
    return { label: 'Đang diễn ra', className: 'bg-emerald-100 text-emerald-800' };
  };

  const auctionStatusInfo = getAuctionStatusInfo();

  const handleBidSubmit = (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user) {
      navigate("/login", { state: { from: `/auction/${id}` } });
      return;
    }

    const bidAmountInThousands = parseFloat(bidInputValue);

    if (!bidInputValue || isNaN(bidAmountInThousands) || bidAmountInThousands <= 0) {
      setToast({ message: "Vui lòng nhập giá hợp lệ", type: "error" });
      return;
    }

    // Multiply by 1000 to get actual VND amount
    const bidAmount = bidAmountInThousands * 1000;
    const basePrice = currentPrice || data.currentPrice;

    // Dynamic bid limits based on current price
    let minBid, maxBid;
    if (basePrice < 100000) {
      // Giá dưới 100k: tối thiểu tăng 10k, range 50k
      minBid = basePrice + 10000;
      maxBid = minBid + 50000;
    } else if (basePrice < 1000000) {
      // Giá từ 100k đến 1tr: tối thiểu tăng 100k, range 500k
      minBid = basePrice + 100000;
      maxBid = minBid + 500000;
    } else if (basePrice < 10000000) {
      // Giá từ 1tr đến 10tr: tối thiểu tăng 200k, range 1tr
      minBid = basePrice + 200000;
      maxBid = minBid + 1000000;
    } else {
      // Giá từ 10tr trở lên: tối thiểu tăng 1tr, range 10tr
      minBid = basePrice + 1000000;
      maxBid = minBid + 10000000;
    }

    console.log('🔍 Bid Submit Debug:', {
      input: bidInputValue,
      parsedInThousands: bidAmountInThousands,
      actualAmount: bidAmount,
      isValid: !isNaN(bidAmount) && bidAmount > 0,
      currentPrice: currentPrice || data.currentPrice,
      minBid,
      maxBid,
      socketConnected: socket.connected,
      socketId: socket.id
    });

    if (bidAmount < minBid) {
      setToast({ message: `Giá đặt phải từ ${minBid.toLocaleString('vi-VN')} VNĐ trở lên`, type: "error" });
      return;
    }

    if (bidAmount > maxBid) {
      setToast({ message: `Giá đặt không được vượt quá ${maxBid.toLocaleString('vi-VN')} VNĐ`, type: "error" });
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
        message: result.isLiked ? "Đã thêm vào yêu thích " : "Đã bỏ yêu thích",
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
  // isActive is already declared above, before getAuctionStatusInfo()
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

    // Kiểm tra xác minh tài khoản
    if (!isVerified) {
      setShowDepositModal(false);
      setShowVerificationModal(true);
      return;
    }

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
      const errorData = error.response?.data || {};
      const errorCode = errorData.code;

      // Kiểm tra nếu lỗi là do chưa xác minh
      if (error.message?.includes('xác minh') || errorCode === 'VERIFICATION_REQUIRED') {
        setShowDepositModal(false);
        setShowVerificationModal(true);
        return;
      }

      // Kiểm tra nếu lỗi là do không đủ tiền trong ví
      if (errorCode === 'INSUFFICIENT_WALLET_BALANCE') {
        const currentBalance = errorData.currentBalance || 0;
        const requiredAmount = errorData.requiredAmount || 0;
        const missingAmount = errorData.missingAmount || (requiredAmount - currentBalance);
        setToast({
          message: `Số dư ví không đủ! Bạn cần ${formatCurrency(requiredAmount)} nhưng chỉ có ${formatCurrency(currentBalance)}. Vui lòng nạp thêm ${formatCurrency(missingAmount)}.`,
          type: "error"
        });
        return;
      }

      // Kiểm tra nếu chỉ hỗ trợ ví
      if (errorCode === 'WALLET_ONLY') {
        setToast({
          message: errorData.error || "Hiện tại chỉ hỗ trợ thanh toán bằng ví. Vui lòng nạp tiền vào ví trước khi đặt cọc.",
          type: "error"
        });
        return;
      }

      setToast({ message: error.message || errorData.error || "Không thể đặt cọc. Vui lòng thử lại.", type: "error" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Check if user profile is complete
  const checkProfileCompleteness = () => {
    const userData = user?.user;

    // Get phone number from verification.phone.number (if verified) or fallback to user.phone
    const phoneNumber = userData?.verification?.phone?.number || userData?.phone || null;
    // Get region from location.ward or location.region (backend stores ward in region field)
    const ward = userData?.location?.ward || userData?.location?.region || null;

    const missing = {
      phone: !phoneNumber,
      address: !userData?.address,
      city: !userData?.location?.city,
      ward: !ward
    };

    const isComplete = !missing.phone && !missing.address && !missing.city && !missing.ward;
    return { isComplete, missingFields: missing };
  };

  // Handle clicking deposit button - kiểm tra verification và profile trước
  const handleDepositClick = () => {
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }

    // Check profile completeness
    const { isComplete, missingFields: missing } = checkProfileCompleteness();
    if (!isComplete) {
      setMissingFields(missing);
      setShowProfileModal(true);
      return;
    }

    setShowDepositModal(true);
  };

  // Chỉ hỗ trợ thanh toán bằng ví
  const paymentMethods = [
    { id: 'wallet', name: 'Ví điện tử', emoji: '💳' },
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
    isAdmin,
    depositStatus,
    hasDeposit: depositStatus?.hasDeposit,
    showBidFormSection: data?.seller?._id !== user?.user?._id && isActive && !isSellerInactive && isApproved && !isAdmin && user?.user?._id,
    showBidForm: depositStatus?.hasDeposit === true
  });

  return (
    <div className="min-h-screen mx-auto container" style={{ backgroundColor: '#f5f1e8' }}>
      <main className="max-w-6xl mx-auto px-3 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section - Left Column, Aligned to Bottom */}
          <div className="flex flex-col justify-end" data-aos="fade-right">
            <div className={`w-full aspect-square bg-white rounded-md shadow-lg border-2 overflow-hidden flex items-center justify-center relative ${!isActive ? 'border-gray-300' : 'border-emerald-200'
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
                  <span className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                    ĐÃ KẾT THÚC
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details Section - Right Column */}
          <div className={`space-y-3 transition-all duration-300 ${!isActive ? 'opacity-75' : ''}`} data-aos="fade-left" data-aos-delay="100">
            {/* Title & Description */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-xs font-medium">
                    {data.itemCategory}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${auctionStatusInfo.className}`}
                  >
                    {auctionStatusInfo.label}
                  </span>
                </div>
                {/* Like Button - Hidden for admin */}
                {!isAdmin && (
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
                      className={`w-4 h-5 transition-all ${isLiked ? 'fill-emerald-600 text-emerald-600' : 'text-gray-700'}`}
                    />
                    <span className={`font-semibold text-sm ${isLiked ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {likesCount}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">
                  {data.itemName}
                </h1>
                {/* Seller Info - Compact */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${isSellerInactive
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-emerald-50 border-emerald-200'
                  }`}>
                  <span className={`text-xs font-medium ${isSellerInactive ? 'text-emerald-700' : 'text-emerald-700'}`}>
                    {isSellerInactive ? 'Bị vô hiệu hóa' : data.seller.name}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {data.itemDescription}
              </p>
            </div>

            {/* Grid Layout for Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Pricing Info */}
              <div className="bg-white p-3 rounded-md shadow-md border border-emerald-200 md:col-span-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Starting Price */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-2 rounded-lg border border-emerald-200">
                    <p className="text-[9px] text-emerald-700 font-medium mb-0.5">
                      Starting
                    </p>
                    <p className="text-base font-bold text-emerald-800">
                      {formatCurrency(data.startingPrice)}
                    </p>
                  </div>

                  {/* Current Price */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-2 rounded-lg border-2 border-emerald-300">
                    <p className="text-[9px] text-emerald-700 font-medium mb-0.5">
                      Current
                    </p>
                    <p className="text-lg font-bold text-emerald-800">
                      {formatCurrency(currentPrice ?? data.currentPrice)}
                    </p>
                  </div>

                  {/* Total Bids */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-2 rounded-lg border border-emerald-200">
                    <p className="text-[9px] text-emerald-700 font-medium mb-0.5">
                      Bids
                    </p>
                    <p className="text-base font-bold text-emerald-800">
                      {data.bids.length}
                    </p>
                  </div>

                  {/* Likes */}
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-2 rounded-lg border border-rose-200">
                    <p className="text-[9px] text-rose-700 font-medium mb-0.5">
                      Likes
                    </p>
                    <p className="text-base font-bold text-rose-800">
                      {likesCount}
                    </p>
                  </div>
                </div>

                {/* Time Left - Full width bar with countdown */}
                <div className={`mt-2 p-2 rounded-lg border ${isActive
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300'
                  }`}>
                  <p className={`text-[9px] font-medium mb-1 ${isActive ? 'text-emerald-700' : 'text-gray-600'
                    }`}>
                    Time Remaining
                  </p>
                  {timeRemaining ? (
                    timeRemaining.ended ? (
                      <p className="text-base font-bold text-gray-500">Ended</p>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {timeRemaining.days > 0 && (
                          <div className="flex flex-col items-center bg-emerald-100 px-1.5 py-0.5 rounded">
                            <span className="text-lg font-bold text-emerald-800">{timeRemaining.days}</span>
                            <span className="text-[7px] text-emerald-600">days</span>
                          </div>
                        )}
                        <div className="flex flex-col items-center bg-emerald-100 px-1.5 py-0.5 rounded">
                          <span className="text-lg font-bold text-emerald-800">{String(timeRemaining.hours).padStart(2, '0')}</span>
                          <span className="text-[7px] text-emerald-600">hrs</span>
                        </div>
                        <span className="text-emerald-800 font-bold text-sm">:</span>
                        <div className="flex flex-col items-center bg-emerald-100 px-1.5 py-0.5 rounded">
                          <span className="text-lg font-bold text-emerald-800">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                          <span className="text-[7px] text-emerald-600">min</span>
                        </div>
                        <span className="text-emerald-800 font-bold text-sm">:</span>
                        <div className="flex flex-col items-center bg-emerald-100 px-1.5 py-0.5 rounded">
                          <span className="text-lg font-bold text-emerald-800">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                          <span className="text-[7px] text-emerald-600">sec</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-base font-bold text-emerald-800">Loading...</p>
                  )}
                </div>
              </div>

              {/* Warning if auction ended */}
              {!isActive && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800 mb-2">Đấu giá đã kết thúc</h3>
                      <p className="text-emerald-700 text-sm">
                        Phiên đấu giá này đã kết thúc. Không thể đặt giá thêm.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if seller is inactive */}
              {isSellerInactive && isActive && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800 mb-2">Không thể đấu giá</h3>
                      <p className="text-emerald-700 text-sm">
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
                <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-md shadow-md md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800 mb-2"> Đấu giá bị từ chối</h3>
                      <p className="text-emerald-700 text-sm mb-2">
                        Đấu giá này đã bị admin từ chối và không thể nhận đặt giá.
                      </p>
                      {data.rejectionReason && (
                        <div className="mt-2 bg-emerald-100 p-3 rounded">
                          <p className="text-xs font-semibold text-emerald-800">Lý do:</p>
                          <p className="text-sm text-emerald-700">{data.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit Status & Bid Form - Show when auction is active and user is not seller */}
              {isActive && data?.seller?._id !== user?.user?._id && !isSellerInactive && isApproved && !isAdmin && (
                <div className="bg-white p-6 rounded-md shadow-md border border-emerald-200 md:col-span-2">
                  {/* Show only if user is logged in */}
                  {user?.user?._id ? (
                    <>
                      {/* Deposit Status - Loading */}
                      {!depositStatus && (
                        <div className="mb-4 p-4 rounded-lg border-2 bg-gray-50 border-gray-200 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deposit Status - Loaded */}
                      {depositStatus && (
                        <div className={`mb-3 p-3 rounded-lg border-2 ${depositStatus.hasDeposit
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-emerald-50 border-emerald-300'
                          }`}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <h4 className={`font-semibold text-sm ${depositStatus.hasDeposit ? 'text-emerald-800' : 'text-emerald-800'}`}>
                                {depositStatus.hasDeposit ? '✓ Đã đặt cọc' : 'Cần đặt cọc trước khi đấu giá'}
                              </h4>

                            </div>

                          </div>
                          {depositStatus.hasDeposit && depositStatus.deposit && (
                            <p className="text-xs text-emerald-600 mt-2">
                              Đã cọc lúc: {new Date(depositStatus.deposit.paidAt).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show bid form only if deposited */}
                      {depositStatus?.hasDeposit ? (
                        <>
                          <h3 className="text-base font-semibold mb-3">Place Your Bid</h3>
                          <form onSubmit={handleBidSubmit} className="space-y-3">
                            {/* Bid Range Info */}
                            <div className="bg-gradient-to-r from-green-50 to-lime-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-gray-600">Tối thiểu: </span>
                                  <span className="font-bold text-green-600">
                                    {(() => {
                                      const basePrice = currentPrice || data.currentPrice;
                                      if (basePrice < 100000) return (basePrice + 10000).toLocaleString('vi-VN');
                                      if (basePrice < 1000000) return (basePrice + 100000).toLocaleString('vi-VN');
                                      if (basePrice < 10000000) return (basePrice + 200000).toLocaleString('vi-VN');
                                      return (basePrice + 1000000).toLocaleString('vi-VN');
                                    })()} VNĐ
                                  </span>
                                </div>
                                <div className="w-px h-4 bg-green-300"></div>
                                <div>
                                  <span className="text-gray-600">Tối đa: </span>
                                  <span className="font-bold text-green-600">
                                    {(() => {
                                      const basePrice = currentPrice || data.currentPrice;
                                      if (basePrice < 100000) return (basePrice + 60000).toLocaleString('vi-VN');
                                      if (basePrice < 1000000) return (basePrice + 600000).toLocaleString('vi-VN');
                                      if (basePrice < 10000000) return (basePrice + 1200000).toLocaleString('vi-VN');
                                      return (basePrice + 11000000).toLocaleString('vi-VN');
                                    })()} VNĐ
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="bidAmount"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Số tiền đặt giá
                              </label>
                              <div className="space-y-2">
                                <div className="relative">
                                  <input
                                    type="number"
                                    name="bidAmount"
                                    id="bidAmount"
                                    ref={inputRef}
                                    value={bidInputValue}
                                    onChange={(e) => setBidInputValue(e.target.value)}
                                    min={(() => {
                                      const basePrice = currentPrice || data.currentPrice;
                                      if (basePrice < 100000) return Math.ceil((basePrice + 10000) / 1000);
                                      if (basePrice < 1000000) return Math.ceil((basePrice + 100000) / 1000);
                                      if (basePrice < 10000000) return Math.ceil((basePrice + 200000) / 1000);
                                      return Math.ceil((basePrice + 1000000) / 1000);
                                    })()}
                                    max={(() => {
                                      const basePrice = currentPrice || data.currentPrice;
                                      if (basePrice < 100000) return Math.ceil((basePrice + 60000) / 1000);
                                      if (basePrice < 1000000) return Math.ceil((basePrice + 600000) / 1000);
                                      if (basePrice < 10000000) return Math.ceil((basePrice + 1200000) / 1000);
                                      return Math.ceil((basePrice + 11000000) / 1000);
                                    })()}
                                    step="1"
                                    className="w-full px-3 py-2 pr-24 border border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="VD: 50"
                                    required
                                  />

                                </div>
                                {bidInputValue && parseFloat(bidInputValue) > 0 && (
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                                    <p className="text-sm text-emerald-700">
                                      = <span className="font-bold text-lg text-emerald-800">
                                        {(parseFloat(bidInputValue) * 1000).toLocaleString('vi-VN')} VNĐ
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-md hover:bg-emerald-700 transition-colors font-semibold shadow-md text-sm"
                            >
                              Đặt giá
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="text-center py-3">
                          {/* Cảnh báo cần xác minh tài khoản */}
                          {!isVerified && (
                            <div className="mb-3 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg text-left">
                              <div>
                                <h4 className="font-semibold text-sm text-emerald-800 mb-1"> Tài khoản chưa xác minh</h4>
                                <p className="text-xs text-emerald-700">
                                  Bạn cần xác minh tài khoản (số điện thoại, email, CCCD) trước khi đặt cọc và tham gia đấu giá.
                                </p>
                              </div>
                            </div>
                          )}
                          <p className="text-gray-600 mb-4">
                            Bạn cần đặt cọc <span className="font-bold text-emerald-600">{formatCurrency(depositStatus?.depositAmount || Math.round((data?.startingPrice || 0) * (depositStatus?.depositPercentage || 10) / 100))}</span> để tham gia đấu giá
                          </p>
                          <button
                            onClick={handleDepositClick}
                            className="bg-gradient-to-r from-emerald-500 to-orange-500 hover:from-emerald-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                          >
                            {isVerified ? 'Đặt cọc ngay' : 'Xác minh & Đặt cọc'}
                          </button>
                          <p className="text-xs text-gray-500 mt-3">
                            Tiền cọc sẽ được hoàn trả nếu bạn không thắng đấu giá
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">
                        Vui lòng đăng nhập để tham gia đấu giá
                      </p>
                      <Link
                        to="/login"
                        state={{ from: `/auction/${id}` }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-orange-500 hover:from-emerald-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        Đăng nhập
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Delete Button */}
              {user?.user?.role === "admin" && (
                <div className="bg-white p-6 rounded-md shadow-md border border-emerald-200 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3 text-emerald-600">Admin Actions</h3>
                  <button
                    onClick={handleDelete}
                    disabled={deleteAuctionMutate.isPending}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteAuctionMutate.isPending ? "Deleting..." : "Delete Auction"}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    This action cannot be undone. All bids will be permanently deleted.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-emerald-700 mb-6">Bid History</h2>
          <div className="relative">
            {/* Blur overlay khi chưa đặt cọc - chỉ hiện khi không phải chủ sở hữu và auction đang active và approved và không phải admin */}
            {data.seller._id !== user?.user?._id && isActive && isApproved && !depositStatus?.hasDeposit && !isAdmin && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-md">
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-emerald-200 text-center max-w-sm mx-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Lịch sử đấu giá bị ẩn
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Bạn cần đặt cọc để xem chi tiết lịch sử đấu giá và tham gia đấu giá.
                  </p>

                </div>
              </div>
            )}

            <div className={`bg-white rounded-md shadow-md border border-emerald-200 overflow-hidden ${data.seller._id !== user?.user?._id && isActive && isApproved && !depositStatus?.hasDeposit && !isAdmin
              ? 'blur-sm select-none pointer-events-none'
              : ''
              }`}>
              {topTenBids.length === 0 ? (
                <div className="p-8 text-center text-emerald-700">
                  No bids yet. Be the first to bid!
                </div>
              ) : (
                <div className="divide-y divide-emerald-50">
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
                        <p className="text-lg font-semibold text-emerald-700">
                          {formatCurrency(bid.bidAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div >
      </main >

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && (
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
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Deposit Modal */}
      {
        showDepositModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold"> Đặt cọc tham gia đấu giá</h3>
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
                    <div className="bg-gradient-to-br from-emerald-50 to-orange-50 p-4 rounded-xl border-2 border-emerald-200">
                      <p className="text-sm text-emerald-700 mb-1">Số tiền cọc</p>
                      <p className="text-3xl font-bold text-emerald-800">
                        {formatCurrency(depositAmt)}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        = {percentage}% của giá khởi điểm ({formatCurrency(startPrice)})
                      </p>
                    </div>
                  );
                })()}

                {/* Info */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Lưu ý:</strong> Tiền cọc sẽ được hoàn trả đầy đủ nếu bạn không thắng đấu giá.
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
                  onClick={handleDepositSubmit}
                  disabled={isSubmittingDeposit}
                  className="w-full bg-gradient-to-r from-emerald-500 to-orange-500 hover:from-emerald-600 hover:to-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingDeposit ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Xác nhận đặt cọc {formatCurrency(depositStatus?.depositAmount || Math.round((data?.startingPrice || 0) * (depositStatus?.depositPercentage || 10) / 100))}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Toast Notification */}
      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={() => {
          setShowVerificationModal(false);
          setToast({ message: "Tài khoản đã được xác minh! Bạn có thể đặt cọc ngay.", type: "success" });
        }}
      />

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
      />
    </div >
  );
};
