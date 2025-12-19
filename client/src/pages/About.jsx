// import { AdsComponent } from "../components/AdsComponent";
import { Features } from "../components/Landing/Features";

export const About = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f1e8' }}>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-transparent rounded-3xl shadow-2xl p-12 border-2 border-emerald-200" data-aos="fade-up">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-red-700 mb-8" data-aos="zoom-in" data-aos-delay="100">
            Về Dự Án Của Chúng Tôi
          </h1>

          {/* Introduction Section */}
          <div className="space-y-6 mb-10" data-aos="fade-up" data-aos-delay="200">
            <p className="text-lg text-gray-700 leading-relaxed">
              Chào mừng bạn đến với <span className="font-bold text-emerald-600">Nền Tảng Đấu Giá Trực Tuyến</span> - 
              nơi kết nối người mua và người bán thông qua các cuộc đấu giá trực tuyến minh bạch và an toàn.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Được thành lập vào năm 2025, chúng tôi cam kết mang đến trải nghiệm đấu giá tốt nhất với công nghệ 
              hiện đại và dịch vụ khách hàng xuất sắc.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-10" data-aos="fade-up" data-aos-delay="300">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-600 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sứ Mệnh</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Tạo ra một thị trường đấu giá công bằng, minh bạch và dễ tiếp cận cho mọi người, 
                nơi mọi giao dịch đều được bảo vệ và đảm bảo an toàn tuyệt đối.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tầm Nhìn</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Trở thành nền tảng đấu giá trực tuyến hàng đầu, được tin cậy nhất tại Việt Nam, 
                đồng thời mở rộng ra thị trường quốc tế trong tương lai gần.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="mb-10" data-aos="fade-up" data-aos-delay="400">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Giá Trị Cốt Lõi</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">An Toàn</h3>
                <p className="text-gray-600">Bảo mật thông tin và giao dịch của người dùng là ưu tiên hàng đầu</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Minh Bạch</h3>
                <p className="text-gray-600">Mọi giao dịch đều rõ ràng, công khai và có thể kiểm chứng</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nhanh Chóng</h3>
                <p className="text-gray-600">Giao dịch được xử lý nhanh chóng với công nghệ hiện đại</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <Features />
    </div>
  );
};

