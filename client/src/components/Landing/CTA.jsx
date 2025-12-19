import { Link } from "react-router";

export const CTA = () => {
  return (
    <section className="py-20 md:py-24 bg-transparent">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 rounded-3xl overflow-hidden shadow-2xl" data-aos="zoom-in">
          {/* Christmas Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
          
          {/* Snowflakes decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-20 text-white/20 text-4xl">❄️</div>
            <div className="absolute top-32 right-40 text-white/20 text-3xl">❄️</div>
            <div className="absolute bottom-20 left-40 text-white/20 text-5xl">❄️</div>
            <div className="absolute bottom-32 right-20 text-white/20 text-3xl">❄️</div>
          </div>

          <div className="relative z-10 py-16 md:py-20 px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg" data-aos="fade-up" data-aos-delay="100">
               Sẵn Sàng Bắt Đầu Hành Trình Đấu Giá? 
            </h2>
            <p className="text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md" data-aos="fade-up" data-aos-delay="200">
              Tham gia cộng đồng của chúng tôi ngay hôm nay và khám phá những ưu đãi tuyệt vời hoặc biến đồ của bạn
              thành tiền mặt. Bắt đầu nhanh chóng và dễ dàng! ❄️
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center" data-aos="fade-up" data-aos-delay="300">
              <Link to="/login">
                <div className="bg-white cursor-pointer text-green-700 px-10 py-4 rounded-xl hover:bg-yellow-50 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transform">
                   Tham Gia Ngay
                </div>
              </Link>
              <Link to="/auction">
                <div className="bg-transparent border-2 border-white cursor-pointer text-white px-10 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform backdrop-blur-sm">
                   Khám Phá Các Sản Phẩm Đấu Giá
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
