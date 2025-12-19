import { FaClock, FaGavel, FaShieldAlt } from 'react-icons/fa'

export const Features = () => {
  const features = [
    {
      icon: FaGavel,
      title: "Đặt Giá Dễ Dàng",
      description: "Đặt giá với sự tự tin nhờ giao diện trực quan của chúng tôi. Theo dõi giá đặt và nhận cập nhật trạng thái đấu giá theo thời gian thực.",
      gradient: "from-lime-400 to-lime-600",
      bgGradient: "from-lime-50 to-blue-50",
      image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&auto=format&fit=crop"
    },
    {
      icon: FaShieldAlt,
      title: "Giao Dịch An Toàn",
      description: "Giao dịch của bạn được bảo vệ bằng các biện pháp bảo mật tiêu chuẩn ngành. Mua bán với sự an tâm hoàn toàn.",
      gradient: "from-emerald-400 to-emerald-600",
      bgGradient: "from-emerald-50 to-green-50",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop"
    },
    {
      icon: FaClock,
      title: "Đấu Giá 24/7",
      description: "Không bỏ lỡ cơ hội nào. Nền tảng của chúng tôi hoạt động suốt ngày đêm, để bạn có thể đặt giá và bán bất cứ khi nào thuận tiện.",
      gradient: "from-blue-400 to-blue-600",
      bgGradient: "from-blue-50 to-indigo-50",
      image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-20 md:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20" data-aos="fade-up">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Tại Sao Chọn Nền Tảng Của Chúng Tôi?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            Chúng tôi cung cấp môi trường an toàn, thân thiện cho mọi nhu cầu đấu giá của bạn
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isReversed = index % 2 === 1;

            return (
              <div 
                key={index}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16`}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Image Section */}
                <div className="w-full lg:w-1/2" data-aos={isReversed ? "fade-left" : "fade-right"} data-aos-delay={200 + index * 100}>
                  <div className={`relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${feature.bgGradient} p-2`}>
                    <img 
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-[400px] object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl"></div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="w-full lg:w-1/2" data-aos={isReversed ? "fade-right" : "fade-left"} data-aos-delay={300 + index * 100}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg mb-6`}>
                    <Icon className="text-3xl text-white" />
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600 leading-relaxed mb-8">
                    {feature.description}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-lime-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Cập nhật theo thời gian thực</span>
                    </div>
                    <div className="flex items-center gap-2 text-lime-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Dễ sử dụng</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}
