import React from 'react'
import { FaClock, FaGavel, FaShieldAlt } from 'react-icons/fa'

export const Features = () => {
  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We provide a secure, user-friendly environment for all your
            auction needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center p-8 bg-gradient-to-br from-sky-50 to-white border-2 border-sky-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 transform">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FaGavel className="text-3xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Easy Bidding
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Place bids with confidence using our intuitive interface. Track
              your bids and get real-time updates on auction status.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-8 bg-gradient-to-br from-cyan-50 to-white border-2 border-cyan-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 transform">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FaShieldAlt className="text-3xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Secure Transactions
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Your transactions are protected with industry-standard security
              measures. Buy and sell with complete peace of mind.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 transform">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FaClock className="text-3xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              24/7 Auctions
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Never miss an opportunity. Our platform runs around the clock,
              so you can bid and sell whenever it's convenient for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
