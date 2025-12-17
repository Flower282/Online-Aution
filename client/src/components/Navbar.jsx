import { useEffect, useState, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { logout } from "../store/auth/authSlice";
import { Gavel, Search, User, Heart, Menu, X, Gift, Sparkles, Trophy, ChevronDown, Wallet, Package, Settings, LogOut, ShieldCheck, LayoutDashboard, Plus, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  IoLogOutOutline,
} from "react-icons/io5";
import { getPendingAuctions } from "../api/admin";
import { getWonAuctions } from "../api/auction";

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  // Fetch pending auctions count for admin
  const { data: pendingData } = useQuery({
    queryKey: ["pendingAuctionsCount"],
    queryFn: () => getPendingAuctions(1, 1),
    enabled: user?.user?.role === 'admin',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const pendingCount = pendingData?.data?.pagination?.totalPending || 0;

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

  // Function to mark won auctions as seen (call when visiting the page)
  const markWonAuctionsAsSeen = () => {
    if (user?.user?._id) {
      const storageKey = `wonAuctions_seen_${user.user._id}`;
      localStorage.setItem(storageKey, totalWonNotifications.toString());
      setUnseenWonCount(0);
    }
  };

  // User logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
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
                  className={({ isActive }) =>
                    isActive
                      ? "text-sm text-primary font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50"
                      : "text-sm hover:text-primary hover:bg-red-50/50 transition-all flex items-center gap-1.5 px-3 py-2 rounded-lg"
                  }
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                  {item.name === "Pending Auctions" && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
              <Input
                placeholder=" Tìm kiếm đấu giá Christmas..."
                className="pl-9 bg-red-50 border-red-200 focus:border-red-400 focus:ring-red-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Favorites button - always visible for logged in users */}
            {user && (
              <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors" asChild>
                <Link to="/favorites" title="Yêu thích">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-green-50 text-green-600">
              <Gift className="h-5 w-5 christmas-sparkle" />
            </Button>
            {user ? (
              <>
                {/* Admin logout button - admin doesn't use dropdown */}
                {user.user.role === 'admin' && (
                  <Button
                    className="hidden sm:flex bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white gap-2 shadow-lg"
                    onClick={handleLogout}
                  >
                    <IoLogOutOutline className="h-5 w-5" />
                    Đăng xuất
                  </Button>
                )}

                {/* User Dropdown Menu - Right side */}
                {user.user.role !== 'admin' && (
                  <div className="relative hidden md:block" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${isDropdownOpen
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "hover:bg-red-50 text-gray-700 border-gray-200 hover:border-red-200"
                        }`}
                    >
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="hidden lg:inline">{user.user.name?.split(' ')[0]}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                          {dropdownMenuItems.map((item) => (
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
                                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive
                                  ? "bg-red-50 text-red-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                                }`
                              }
                            >
                              <item.icon className={`h-5 w-5 ${item.iconColor || 'text-gray-500'}`} />
                              <span className="flex-1">{item.name}</span>
                              {item.name === "Won Auctions" && unseenWonCount > 0 && (
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {unseenWonCount}
                                </span>
                              )}
                            </NavLink>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-2 px-2">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center gap-3 w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                          >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" className="hidden sm:flex border-red-600 text-red-600 hover:bg-red-50" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button className="hidden sm:flex bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg" asChild>
                  <Link to="/signup"> Đăng ký</Link>
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
                    }
                  }}
                >
                  <span>{item.name}</span>
                  {item.name === "Pending Auctions" && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
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
                {protectedNavLink.slice(5, 8).map((item) => (
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
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <IoLogOutOutline className="mr-2 h-5 w-5" />
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

// Guest navigation menu
const navMenu = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Contact", link: "/contact" },
];

// Main navigation links for logged-in users (shown directly in navbar)
const mainNavLinks = [
  { name: "Dashboard", link: "/", icon: LayoutDashboard },
  { name: "Đấu giá", link: "/auction", icon: Eye },
  { name: "Tạo mới", link: "/create", icon: Plus },
];

// Dropdown menu items for user account
const dropdownMenuItems = [
  { name: "My Auction", link: "/myauction", icon: Package, iconColor: "text-blue-500" },
  { name: "Won Auctions", link: "/won", icon: Trophy, iconColor: "text-amber-500" },
  { name: "My Deposits", link: "/deposits", icon: Wallet, iconColor: "text-emerald-500" },
  { name: "Profile", link: "/profile", icon: Settings, iconColor: "text-gray-500" },
];

// Admin navigation links
const adminNavLink = [
  { name: "Admin Panel", link: "/admin", icon: ShieldCheck },
  { name: "Pending Auctions", link: "/admin/auctions/pending", icon: Package },
  { name: "Đấu giá", link: "/auction", icon: Eye },
  { name: "Tạo mới", link: "/create", icon: Plus },
];

// All protected links for mobile menu
const protectedNavLink = [
  { name: "Dashboard", link: "/" },
  { name: "Create Auction", link: "/create" },
  { name: "View Auction", link: "/auction" },
  { name: "My Auction", link: "/myauction" },
  { name: "Won Auctions", link: "/won" },
  { name: "My Deposits", link: "/deposits" },
  { name: "Contact", link: "/contact" },
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

// Legacy function for mobile menu
const getNavLinks = (userRole) => {
  if (userRole === 'admin') {
    return adminNavLink;
  }
  return protectedNavLink.slice(0, 6);
};
