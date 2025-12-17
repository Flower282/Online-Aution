import { FaClock, FaGavel, FaShieldAlt } from 'react-icons/fa'

export const Features = () => {
  const features = [
    {
      icon: FaGavel,
      title: "Easy Bidding",
      description: "Place bids with confidence using our intuitive interface. Track your bids and get real-time updates on auction status.",
      gradient: "from-sky-400 to-sky-600",
      bgGradient: "from-sky-50 to-blue-50",
      image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&auto=format&fit=crop"
    },
    {
      icon: FaShieldAlt,
      title: "Secure Transactions",
      description: "Your transactions are protected with industry-standard security measures. Buy and sell with complete peace of mind.",
      gradient: "from-cyan-400 to-cyan-600",
      bgGradient: "from-cyan-50 to-teal-50",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop"
    },
    {
      icon: FaClock,
      title: "24/7 Auctions",
      description: "Never miss an opportunity. Our platform runs around the clock, so you can bid and sell whenever it's convenient for you.",
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
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            We provide a secure, user-friendly environment for all your auction needs
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
                    <div className="flex items-center gap-2 text-sky-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Real-time updates</span>
                    </div>
                    <div className="flex items-center gap-2 text-sky-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Easy to use</span>
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
