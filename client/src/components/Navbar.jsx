import { useEffect, useState, useRef, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { logout } from "../store/auth/authSlice";
import { Gavel, Search, User, Heart, Menu, X, Gift, Sparkles, Trophy, ChevronDown, Wallet, Package, Settings, LogOut, ShieldCheck, LayoutDashboard, Plus, Eye, FileText, Home, Info, Phone, UserCircle, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  IoLogOutOutline,
} from "react-icons/io5";
import { getPendingAuctions, getPendingReactivationRequests } from "../api/admin";
import { getWonAuctions, getAuctions } from "../api/auction";
import { getPendingVerifications } from "../api/verification";

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.user?.role === "admin";

  // Static pages for search - Filter out Favorites for admin
  const staticPages = useMemo(() => {
    const pages = [
      { name: "Trang chủ", link: "/", icon: Home, keywords: ["home", "trang chu", "dashboard"] },
      { name: "Đấu giá", link: "/auction", icon: Gavel, keywords: ["auction", "dau gia", "san pham"] },
      { name: "Tạo đấu giá", link: "/create", icon: Plus, keywords: ["create", "tao", "dang ban", "moi"] },
      { name: "Đấu giá của tôi", link: "/myauction", icon: Package, keywords: ["my auction", "cua toi", "san pham cua toi"] },
      { name: "Đấu giá đã thắng", link: "/won", icon: Trophy, keywords: ["won", "thang", "chien thang"] },
      { name: "Tiền cọc", link: "/deposits", icon: Wallet, keywords: ["deposit", "tien coc", "dat coc"] },
      { name: "Yêu thích", link: "/favorites", icon: Heart, keywords: ["favorite", "yeu thich", "like"] },
      { name: "Hồ sơ", link: "/profile", icon: UserCircle, keywords: ["profile", "ho so", "tai khoan", "account"] },
      { name: "Giới thiệu", link: "/about", icon: Info, keywords: ["about", "gioi thieu", "ve chung toi"] },
      { name: "Liên hệ", link: "/contact", icon: Phone, keywords: ["contact", "lien he", "ho tro"] },
    ];
    
    // Filter out Favorites for admin
    if (isAdmin) {
      return pages.filter(page => page.link !== "/favorites");
    }
    return pages;
  }, [isAdmin]);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Query được gửi khi Enter
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch pending auctions count for admin
  const { data: pendingData } = useQuery({
    queryKey: ["pendingAuctionsCount"],
    queryFn: () => getPendingAuctions(1, 1),
    enabled: user?.user?.role === 'admin',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const pendingCount = pendingData?.data?.pagination?.totalPending || 0;

  // Fetch pending verifications count for admin
  const { data: pendingVerificationsData } = useQuery({
    queryKey: ["pendingVerificationsCount"],
    queryFn: getPendingVerifications,
    enabled: user?.user?.role === 'admin',
    refetchInterval: 30000,
  });

  const pendingVerificationsCount = pendingVerificationsData?.count || 0;

  // Fetch pending reactivation requests count for admin
  const { data: pendingReactivationsData } = useQuery({
    queryKey: ["pendingReactivationsCount"],
    queryFn: getPendingReactivationRequests,
    enabled: user?.user?.role === 'admin',
    refetchInterval: 30000,
  });

  const pendingReactivationsCount = pendingReactivationsData?.count || 0;

  // Fetch auctions for search
  const { data: auctionsData } = useQuery({
    queryKey: ["allAuctionsForSearch"],
    queryFn: getAuctions,
    staleTime: 60 * 1000,
  });

  // Search results computation - chỉ tìm khi đã bấm Enter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return { auctions: [], pages: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    const auctions = auctionsData || [];

    // Filter auctions by name, description, category (all returned auctions are approved)
    const filteredAuctions = auctions
      .filter(auction =>
        auction.itemName?.toLowerCase().includes(query) ||
        auction.itemDescription?.toLowerCase().includes(query) ||
        auction.itemCategory?.toLowerCase().includes(query)
      )
      .slice(0, 5); // Limit to 5 results

    // Filter static pages
    const filteredPages = staticPages.filter(page =>
      page.name.toLowerCase().includes(query) ||
      page.keywords.some(kw => kw.includes(query))
    ).slice(0, 4);

    return { auctions: filteredAuctions, pages: filteredPages };
  }, [searchQuery, auctionsData]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search result click
  const handleSearchResultClick = (link) => {
    setSearchTerm("");
    setSearchQuery("");
    setShowSearchResults(false);
    navigate(link);
  };

  // Handle search submit (Enter key)
  const handleSearchSubmit = () => {
    if (searchTerm.trim().length >= 2) {
      setSearchQuery(searchTerm);
      setShowSearchResults(true);
    }
  };

  // Fetch won auctions count for regular users
  const { data: wonData } = useQuery({
    queryKey: ["wonAuctionsCount"],
    queryFn: getWonAuctions,
    enabled: !!user && user?.user?.role !== 'admin',
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000,
  });

  // Count of won auctions and my auctions with winners
  const wonCount = wonData?.wonCount || 0;
  const myAuctionsWithWinner = wonData?.myAuctions?.filter(a => a.winner)?.length || 0;
  const totalWonNotifications = wonCount + myAuctionsWithWinner;

  // Track unseen notifications using localStorage
  const [unseenWonCount, setUnseenWonCount] = useState(0);
  const [hasNewPendingAuctions, setHasNewPendingAuctions] = useState(false);
  const [hasNewPendingVerifications, setHasNewPendingVerifications] = useState(false);
  const [hasNewPendingReactivations, setHasNewPendingReactivations] = useState(false);

  useEffect(() => {
    if (user?.user?._id && totalWonNotifications > 0) {
      const storageKey = `wonAuctions_seen_${user.user._id}`;
      const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');

      // Only show badge if there are new items since last view
      if (totalWonNotifications > lastSeenCount) {
        setUnseenWonCount(totalWonNotifications - lastSeenCount);
      } else {
        setUnseenWonCount(0);
      }
    }
  }, [totalWonNotifications, user?.user?._id]);

  // Track if there are new pending auctions for admin (for animation)
  useEffect(() => {
    if (user?.user?._id && user?.user?.role === 'admin' && pendingCount > 0) {
      const storageKey = `pendingAuctions_seen_${user.user._id}`;
      const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');
      setHasNewPendingAuctions(pendingCount > lastSeenCount);
    } else {
      setHasNewPendingAuctions(false);
    }
  }, [pendingCount, user?.user?._id, user?.user?.role]);

  // Track if there are new pending verifications for admin (for animation)
  useEffect(() => {
    if (user?.user?._id && user?.user?.role === 'admin' && pendingVerificationsCount > 0) {
      const storageKey = `pendingVerifications_seen_${user.user._id}`;
      const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');
      setHasNewPendingVerifications(pendingVerificationsCount > lastSeenCount);
    } else {
      setHasNewPendingVerifications(false);
    }
  }, [pendingVerificationsCount, user?.user?._id, user?.user?.role]);

  // Track if there are new pending reactivations for admin (for animation)
  useEffect(() => {
    if (user?.user?._id && user?.user?.role === 'admin' && pendingReactivationsCount > 0) {
      const storageKey = `pendingReactivations_seen_${user.user._id}`;
      const lastSeenCount = parseInt(localStorage.getItem(storageKey) || '0');
      setHasNewPendingReactivations(pendingReactivationsCount > lastSeenCount);
    } else {
      setHasNewPendingReactivations(false);
    }
  }, [pendingReactivationsCount, user?.user?._id, user?.user?.role]);

  // Function to mark won auctions as seen (call when visiting the page)
  const markWonAuctionsAsSeen = () => {
    if (user?.user?._id) {
      const storageKey = `wonAuctions_seen_${user.user._id}`;
      localStorage.setItem(storageKey, totalWonNotifications.toString());
      setUnseenWonCount(0);
    }
  };

  // Function to mark pending auctions as seen (stops animation, badge stays)
  const markPendingAuctionsAsSeen = () => {
    if (user?.user?._id) {
      const storageKey = `pendingAuctions_seen_${user.user._id}`;
      localStorage.setItem(storageKey, pendingCount.toString());
      setHasNewPendingAuctions(false);
    }
  };

  // Function to mark pending verifications as seen (stops animation, badge stays)
  const markPendingVerificationsAsSeen = () => {
    if (user?.user?._id) {
      const storageKey = `pendingVerifications_seen_${user.user._id}`;
      localStorage.setItem(storageKey, pendingVerificationsCount.toString());
      setHasNewPendingVerifications(false);
    }
  };

  // Function to mark pending reactivations as seen (stops animation, badge stays)
  const markPendingReactivationsAsSeen = () => {
    if (user?.user?._id) {
      const storageKey = `pendingReactivations_seen_${user.user._id}`;
      localStorage.setItem(storageKey, pendingReactivationsCount.toString());
      setHasNewPendingReactivations(false);
    }
  };

  // User logout
  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/");
    // Clear the manual logout flag after navigation
    setTimeout(() => {
      dispatch({ type: 'auth/clearManualLogout' });
    }, 100);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  //this will prevent body scroll when drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownItems = getDropdownItems(user?.user?.role);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-red-300 bg-white backdrop-blur shadow-lg">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 relative">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Gavel className="h-7 w-7 text-red-600 group-hover:text-red-700 transition-colors christmas-sparkle" />
                <Sparkles className="h-3.5 w-3.5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
                Online Auction
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              {/* Main nav links */}
              {(user ? getMainNavLinks(user.user.role) : navMenu).map((item) => (
                <NavLink
                  to={item.link}
                  key={item.link}
                  onClick={() => {
                    if (item.name === "Pending Auctions") {
                      markPendingAuctionsAsSeen();
                    } else if (item.name === "Pending Verifications") {
                      markPendingVerificationsAsSeen();
                    } else if (item.name === "Pending Requests") {
                      markPendingReactivationsAsSeen();
                    }
                  }}
                  className={({ isActive }) =>
                    isActive
                      ? "text-sm text-primary font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50"
                      : "text-sm hover:text-primary hover:bg-red-50/50 transition-all flex items-center gap-1.5 px-3 py-2 rounded-lg"
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                  {item.name === "Pending Auctions" && pendingCount > 0 && (
                    <span className={`bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${hasNewPendingAuctions ? 'animate-pulse' : ''}`}>
                      {pendingCount}
                    </span>
                  )}
                  {item.name === "Pending Requests" && pendingReactivationsCount > 0 && (
                    <span className={`bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${hasNewPendingReactivations ? 'animate-pulse' : ''}`}>
                      {pendingReactivationsCount}
                    </span>
                  )}
                  {item.name === "Pending Verifications" && pendingVerificationsCount > 0 && (
                    <span className={`bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${hasNewPendingVerifications ? 'animate-pulse' : ''}`}>
                      {pendingVerificationsCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-6" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
              <Input
                placeholder="Tìm kiếm đấu giá, trang... (Enter để tìm)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                  if (e.key === 'Escape') {
                    setShowSearchResults(false);
                  }
                }}
                autoComplete="off"
                className="pl-9 bg-red-50 border-red-200 focus:border-red-400 focus:ring-red-400"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                  {searchResults.auctions.length === 0 && searchResults.pages.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Không tìm thấy kết quả cho "{searchQuery}"</p>
                    </div>
                  ) : (
                    <>
                      {/* Auctions Results */}
                      {searchResults.auctions.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100">
                            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
                              <Gavel className="h-3 w-3" />
                              Đấu giá ({searchResults.auctions.length})
                            </span>
                          </div>
                          {searchResults.auctions.map((auction) => {
                            // Use timeLeft from API response
                            const timeRemaining = auction.timeLeft || 0;
                            const isEnded = auction.isEnded || timeRemaining <= 0;
                            const daysLeft = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                            const hoursLeft = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

                            return (
                              <button
                                key={auction._id}
                                onClick={() => handleSearchResultClick(`/auction/${auction._id}`)}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-red-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                              >
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
                                  {auction.itemPhoto ? (
                                    <img
                                      src={auction.itemPhoto}
                                      alt={auction.itemName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">{auction.itemName}</p>
                                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                    {auction.itemDescription?.slice(0, 60) || 'Không có mô tả'}
                                    {auction.itemDescription?.length > 60 ? '...' : ''}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      {auction.itemCategory}
                                    </span>
                                    {auction.bidsCount > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {auction.bidsCount} lượt đấu giá
                                      </span>
                                    )}
                                    {!isEnded ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m còn lại`}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        Đã kết thúc
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-xs text-gray-500">Giá hiện tại:</span>
                                    <span className="text-sm font-bold text-red-600">
                                      {new Intl.NumberFormat('vi-VN').format(auction.currentPrice)}đ
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Pages Results */}
                      {searchResults.pages.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-t border-gray-100">
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Trang ({searchResults.pages.length})
                            </span>
                          </div>
                          {searchResults.pages.map((page) => (
                            <button
                              key={page.link}
                              onClick={() => handleSearchResultClick(page.link)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                <page.icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900">{page.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-green-50 text-green-600">
              <Gift className="h-5 w-5 christmas-sparkle" />
            </Button>
            {user ? (
              <>
                {/* User/Admin Dropdown Menu - Right side */}
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 min-w-[220px] ${isDropdownOpen
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "hover:bg-red-50 text-gray-700 border-gray-200 hover:border-red-200"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span>{user.user.name}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    {/* Combined notification badge */}
                    {unseenWonCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg">
                        {unseenWonCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {user.user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {dropdownItems.map((item) => {
                          const isLogout = item.action === 'logout';
                          if (isLogout) {
                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  handleLogout();
                                }}
                                className="flex items-center justify-start gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                              >
                                <item.icon className={`h-5 w-5 ${item.iconColor || 'text-red-600'}`} />
                                <span className="flex-1 font-medium text-left">{item.name}</span>
                              </button>
                            );
                          }

                          return (
                            <NavLink
                              key={item.link}
                              to={item.link}
                              onClick={() => {
                                setIsDropdownOpen(false);
                                if (item.name === "Won Auctions") {
                                  markWonAuctionsAsSeen();
                                }
                              }}
                              className={({ isActive }) =>
                                `flex items-center justify-start gap-2 px-4 py-3 text-sm transition-colors ${isActive
                                  ? "bg-red-50 text-red-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                                }`
                              }
                            >
                              <item.icon className={`h-5 w-5 ${item.iconColor || 'text-gray-500'}`} />
                              <span className="flex-1 text-left">{item.name}</span>
                              {item.name === "Won Auctions" && unseenWonCount > 0 && (
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {unseenWonCount}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" className="hidden sm:flex border-red-600 text-red-600 hover:bg-red-50 min-w-[105px]" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button className="hidden sm:flex bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg min-w-[105px]" asChild>
                  <Link to="/signup">Đăng ký</Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="md:hidden hover:bg-red-50 text-red-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${isMenuOpen ? "opacity-70" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-between items-center p-4 border-b-2 border-red-300 bg-gradient-to-r from-red-100 via-red-50 to-red-100">
          <div className="flex items-center space-x-2">
            <Gavel className="h-6 w-6 text-red-600 christmas-sparkle" />
            <span className="text-xl font-bold bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
              Auction
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="hover:bg-red-100 text-red-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {user && (
          <div className="p-4 border-b border-red-300 bg-gradient-to-r from-red-100 to-red-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center overflow-hidden ring-2 ring-red-400">
                {user.user.avatar ? (
                  <img
                    src={user.user.avatar}
                    alt={user.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-red-900"> {user.user.name}</p>
                <p className="text-sm text-red-600 truncate">
                  {user.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4">
          <ul className="space-y-1">
            {(user ? getNavLinks(user.user.role) : navMenu).map((item) => (
              <li key={item.link}>
                <NavLink
                  to={item.link}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center justify-between py-3 px-3 text-primary font-semibold bg-primary/10 rounded-lg transition-all"
                      : "flex items-center justify-between py-3 px-3 hover:text-primary hover:bg-muted/50 font-medium rounded-lg transition-all"
                  }
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (item.name === "Won Auctions") {
                      markWonAuctionsAsSeen();
                    } else if (item.name === "Pending Auctions") {
                      markPendingAuctionsAsSeen();
                    } else if (item.name === "Pending Verifications") {
                      markPendingVerificationsAsSeen();
                    } else if (item.name === "Pending Requests") {
                      markPendingReactivationsAsSeen();
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {item.name === "Pending Auctions" && pendingCount > 0 && (
                    <span className={`bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ${hasNewPendingAuctions ? 'animate-pulse' : ''}`}>
                      {pendingCount}
                    </span>
                  )}
                  {item.name === "Pending Requests" && pendingReactivationsCount > 0 && (
                    <span className={`bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ${hasNewPendingReactivations ? 'animate-pulse' : ''}`}>
                      {pendingReactivationsCount}
                    </span>
                  )}
                  {item.name === "Pending Verifications" && pendingVerificationsCount > 0 && (
                    <span className={`bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ${hasNewPendingVerifications ? 'animate-pulse' : ''}`}>
                      {pendingVerificationsCount}
                    </span>
                  )}
                  {item.name === "Won Auctions" && unseenWonCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {unseenWonCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {user ? (
            <div className="mt-6 pt-6 border-t">
              <ul className="space-y-4">
                {protectedNavLink.slice(5, 10).map((item) => (
                  <li key={item.link}>
                    <NavLink
                      to={item.link}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center py-3 px-3 text-primary font-semibold bg-primary/10 rounded-lg transition-all"
                          : "flex items-center py-3 px-3 hover:text-primary hover:bg-muted/50 font-medium rounded-lg transition-all"
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <Button
                    variant="ghost"
                    className="w-full justify-start items-center text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 px-3 py-3 rounded-lg"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <IoLogOutOutline className="h-5 w-5" />
                    Đăng xuất
                  </Button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  Đăng nhập
                </Link>
              </Button>
              <Button className="w-full" asChild>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};
export const LoginSignup = () => {
  return (
    <>
      <Button variant="ghost" className="hidden md:flex" asChild>
        <Link to="/login">Đăng nhập</Link>
      </Button>
      <Button className="hidden md:flex" asChild>
        <Link to="/signup">Đăng ký</Link>
      </Button>
    </>
  );
};

// Guest navigation menu (same as logged-in users, but will redirect to login for protected routes)
const navMenu = [
  { name: "Dashboard", link: "/", icon: LayoutDashboard },
  { name: "Auction", link: "/auction", icon: Eye },
  { name: "Tạo mới", link: "/create", icon: Plus },
  { name: "About", link: "/about", icon: Info },
  { name: "Contact", link: "/contact", icon: Phone },
];

// Main navigation links for logged-in users (shown directly in navbar)
const mainNavLinks = [
  { name: "Dashboard", link: "/", icon: LayoutDashboard },
  { name: "Auction", link: "/auction", icon: Eye },
  { name: "Tạo mới", link: "/create", icon: Plus },
  { name: "About", link: "/about", icon: Info },
  { name: "Contact", link: "/contact", icon: Phone },
];

// Dropdown menu items for user account
const dropdownMenuItems = [
  { name: "My Auction", link: "/myauction", icon: Package, iconColor: "text-blue-500" },
  { name: "Won Auctions", link: "/won", icon: Trophy, iconColor: "text-amber-500" },
  { name: "My Deposits", link: "/deposits", icon: Wallet, iconColor: "text-emerald-500" },
  { name: "Favorites", link: "/favorites", icon: Heart, iconColor: "text-red-500" },
  { name: "Profile", link: "/profile", icon: Settings, iconColor: "text-gray-500" },
  { name: "Đăng xuất", action: "logout", icon: LogOut, iconColor: "text-red-600" },
];

// Admin dropdown items (same structure as user, but profile link points to /admin/profile)
const adminDropdownMenuItems = [
  { name: "My Auction", link: "/myauction", icon: Package, iconColor: "text-blue-500" },
  { name: "Won Auctions", link: "/won", icon: Trophy, iconColor: "text-amber-500" },
  { name: "Profile", link: "/admin/profile", icon: Settings, iconColor: "text-gray-500" },
  { name: "Đăng xuất", action: "logout", icon: LogOut, iconColor: "text-red-600" },
];

// Admin navigation links
const adminNavLink = [
  { name: "Auction", link: "/auction", icon: Eye },
  { name: "Pending Auctions", link: "/admin/auctions/pending", icon: Package },
  { name: "Pending Requests", link: "/admin/reactivation-requests", icon: UserCheck },
  { name: "Pending Verifications", link: "/admin/verifications", icon: ShieldCheck },
];

// All protected links for mobile menu
const protectedNavLink = [
  { name: "Dashboard", link: "/" },
  { name: "Auction", link: "/auction" },
  { name: "Tạo mới", link: "/create" },
  { name: "About", link: "/about" },
  { name: "Contact", link: "/contact" },
  { name: "My Auction", link: "/myauction" },
  { name: "Won Auctions", link: "/won" },
  { name: "My Deposits", link: "/deposits" },
  { name: "Favorites", link: "/favorites" },
  { name: "Profile", link: "/profile" },
  { name: "Privacy", link: "/privacy" },
];

// Helper function to get main navigation links based on user role
const getMainNavLinks = (userRole) => {
  if (userRole === 'admin') {
    return adminNavLink;
  }
  return mainNavLinks;
};

// Helper to get dropdown items based on role
const getDropdownItems = (userRole) => {
  if (userRole === 'admin') {
    return adminDropdownMenuItems;
  }
  return dropdownMenuItems;
};

// Helper function for mobile menu - returns first 5 items (matching desktop nav)
const getNavLinks = (userRole) => {
  if (userRole === 'admin') {
    return adminNavLink;
  }
  return protectedNavLink.slice(0, 5); // Dashboard, Auction, Create, About, Contact
};
