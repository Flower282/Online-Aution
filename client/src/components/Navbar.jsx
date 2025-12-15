import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { logout } from "../store/auth/authSlice";
import { Gavel, Search, User, Heart, Bell, Menu, X, Gift, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  MdOutlineAccountCircle,
} from "react-icons/md";
import {
  IoLogOutOutline,
} from "react-icons/io5";
import { getPendingAuctions } from "../api/admin";

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Fetch pending auctions count for admin
  const { data: pendingData } = useQuery({
    queryKey: ["pendingAuctionsCount"],
    queryFn: () => getPendingAuctions(1, 1),
    enabled: user?.user?.role === 'admin',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const pendingCount = pendingData?.data?.pagination?.totalPending || 0;

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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-red-300 bg-white/95 backdrop-blur shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-red-100 via-red-50 to-red-100 opacity-60"></div>
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

            <nav className="hidden md:flex items-center gap-6">
              {(user ? getNavLinks(user.user.role) : navMenu).map((item) => (
                <NavLink
                  to={item.link}
                  key={item.link}
                  className={({ isActive }) =>
                    isActive
                      ? "text-base text-primary font-medium transition-colors flex items-center gap-1"
                      : "text-base hover:text-primary transition-colors flex items-center gap-1"
                  }
                >
                  {item.name}
                  {item.name === "Pending Auctions" && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                placeholder="🎁 Tìm kiếm đấu giá Christmas..."
                className="pl-9 bg-red-50 border-red-200 focus:border-red-400 focus:ring-red-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-red-50 text-red-600" asChild>
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
                <Button variant="ghost" size="icon" className="hover:bg-red-50" asChild>
                  <Link to="/profile">
                    <User className="h-5 w-5 text-red-600" />
                  </Link>
                </Button>
                <Button
                  className="hidden sm:flex bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white gap-2 shadow-lg"
                  onClick={handleLogout}
                >
                  <IoLogOutOutline className="h-5 w-5" />
                  🎅 Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="hidden sm:flex border-red-600 text-red-600 hover:bg-red-50" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button className="hidden sm:flex bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-lg" asChild>
                  <Link to="/signup">🎅 Đăng ký</Link>
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
              🎅 Auction
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
                <p className="font-semibold text-red-900">🎅 {user.user.name}</p>
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.name}</span>
                  {item.name === "Pending Auctions" && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {user ? (
            <div className="mt-6 pt-6 border-t">
              <ul className="space-y-4">
                {protectedNavLink.slice(4, 7).map((item) => (
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

const navMenu = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "About",
    link: "/about",
  },
  {
    name: "Contact",
    link: "/contact",
  },
  // Temporarily hidden Legal link
  // {
  //   name: "Legal",
  //   link: "/legal",
  // },
];

const protectedNavLink = [
  {
    name: "Dashboard",
    link: "/",
  },
  {
    name: "Create Auction",
    link: "/create",
  },
  {
    name: "View Auction",
    link: "/auction",
  },
  {
    name: "My Auction",
    link: "/myauction",
  },
  {
    name: "Contact",
    link: "/contact",
  },
  {
    name: "Profile",
    link: "/profile",
  },
  {
    name: "Privacy",
    link: "/privacy",
  },
];

const adminNavLink = [
  {
    name: "Admin Panel",
    link: "/admin",
  },
  {
    name: "Pending Auctions",
    link: "/admin/auctions/pending",
  },
  {
    name: "Create Auction",
    link: "/create",
  },
  {
    name: "View Auction",
    link: "/auction",
  },
];

// Helper function to get navigation links based on user role
const getNavLinks = (userRole) => {
  if (userRole === 'admin') {
    return adminNavLink;
  }
  return protectedNavLink.slice(0, 4); // Dashboard, Create, View, My Auction
};
