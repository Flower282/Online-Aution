import { Link } from "react-router";
import { useState } from "react";

export const Hero = () => {
  const [treeHoverKey, setTreeHoverKey] = useState(0);
  const [giftHoverKey, setGiftHoverKey] = useState(0);

  return (
    <section className="relative bg-[#f5f1e8] pt-20 pb-0 overflow-hidden">
      {/* Christmas Garland at Top */}
      <div className="absolute top-0 left-0 right-0 w-full h-24 sm:h-28 md:h-32 z-20 overflow-hidden">
        <div 
          className="w-full h-full"
          style={{ 
            backgroundImage: 'url(/christmas-garland.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center top',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
          }}
        />
        {/* Ornament decorations on garland */}
        <div className="absolute top-6 left-[15%] text-2xl animate-swing" style={{ animationDelay: '0s' }}>🎄</div>
        <div className="absolute top-8 left-[35%] text-xl animate-swing" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute top-6 left-[55%] text-2xl animate-swing" style={{ animationDelay: '1s' }}>🎁</div>
        <div className="absolute top-8 left-[75%] text-xl animate-swing" style={{ animationDelay: '1.5s' }}>🔔</div>
        <div className="absolute top-7 left-[90%] text-xl animate-swing" style={{ animationDelay: '2s' }}>❄️</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-2xl shadow-xl border-2 border-white/50 max-w-md -mt-8 ml-8 lg:ml-16" data-aos="fade-right">
            <div className="mb-2">
              <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">HÀNG ĐẦU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3 leading-tight" data-aos="fade-up" data-aos-delay="100">
              NỀN TẢNG<br />
              ĐẤU GIÁ TRỰC TUYẾN &<br />
              DỊCH VỤ ĐẶT GIÁ
            </h1>
            <p className="text-gray-700 text-sm sm:text-base mb-6 font-medium" data-aos="fade-up" data-aos-delay="200">
              Tất cả sản phẩm đấu giá trên một nền tảng
            </p>
            <div className="flex flex-wrap gap-3" data-aos="fade-up" data-aos-delay="300">
              <Link to="/login">
                <button className="px-6 py-2 border-2 border-gray-900 rounded-full text-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300 transform hover:scale-105 text-sm">
                  Bắt Đầu Ngay
                </button>
              </Link>
            </div>    
            {/* Christmas Sock with Gifts - positioned at bottom left */}
          </div>
          <div 
            className="absolute bottom-30 left-140 w-64 z-20 animate-bounce-gentle cursor-pointer" 
            style={{ animationDelay: '0.5s' }}
            onMouseEnter={() => setGiftHoverKey(prev => prev + 1)}
          >
            <div className="relative hover:scale-110 transition-transform duration-300 group">
              <img 
                src="/christmas-gifts.png" 
                alt="Christmas Gifts" 
                className="w-full h-auto drop-shadow-xl group-hover:animate-shake"
              />
              {/* Gifts falling effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-visible">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={`${giftHoverKey}-${i}`}
                    className="absolute text-2xl"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 40}px`,
                      animation: 'fall-gifts 2s ease-in forwards',
                      animationDelay: `${i * 0.2}s`
                    }}
                  >
                    🎁
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Christmas Decorations */}
          <div className="hidden lg:flex justify-end items-center relative">
            <div 
              className="relative w-full max-w-xl cursor-pointer" 
              data-aos="fade-left" 
              data-aos-delay="200"
              onMouseEnter={() => setTreeHoverKey(prev => prev + 1)}
            >
              {/* Christmas Tree */}
              <div className="relative z-10 animate-float-slow hover:scale-105 transition-transform duration-300 group">
                <img 
                  src="/christmas-tree.png" 
                  alt="Christmas Tree" 
                  className="w-full h-auto drop-shadow-2xl group-hover:animate-shake"
                />
                {/* Snow falling effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-visible">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`${treeHoverKey}-${i}`}
                      className="absolute text-xl"
                      style={{
                        left: `${Math.random() * 70 + 15}%`,
                        top: `${Math.random() * 80 + 20}px`,
                        animation: 'fall-snow 2s ease-in forwards',
                        animationDelay: `${i * 0.15}s`
                      }}
                    >
                      ❄️
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative snowflakes */}
              <div className="absolute top-10 left-5 text-4xl animate-twinkle" style={{ animationDelay: '0s' }}>❄️</div>
              <div className="absolute top-20 right-10 text-3xl animate-twinkle" style={{ animationDelay: '1s' }}>❄️</div>
              <div className="absolute bottom-32 left-10 text-3xl animate-twinkle" style={{ animationDelay: '2s' }}>❄️</div>
              <div className="absolute bottom-20 right-5 text-4xl animate-twinkle" style={{ animationDelay: '1.5s' }}>⭐</div>
            </div>
          </div>
        </div>
      </div>

      {/* Snow Wave Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
        <svg 
          className="relative block w-full h-64 sm:h-72 md:h-80 lg:h-96" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#e0f2fe', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#eff6ff', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#f8fafc', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="snow-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path 
            fill="url(#snowGradient)" 
            fillOpacity="1" 
            d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,133.3C672,117,768,107,864,122.7C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            filter="url(#snow-shadow)"
            className="animate-wave"
          />
          {/* Second layer for depth */}
          <path 
            fill="#ffffff" 
            fillOpacity="0.7" 
            d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,213.3C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slow"
          />
        </svg>
      </div>
    </section>
  );
};
