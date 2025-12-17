/**
 * Auction Socket Module
 * Xử lý đấu giá real-time với Redis ZSET và MongoDB logging
 * Tránh N+1 connection bằng cách nhận dependencies từ bên ngoài
 */

import { canUserBid } from '../controllers/deposit.controller.js';

/**
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} dependencies - External dependencies
 * @param {Object} dependencies.redisClient - Redis client instance (optional)
 * @param {Object} dependencies.mongoLogger - MongoDB logger instance
 */
export const handleAuctionSocket = (socket, io, { redisClient, mongoLogger }) => {

    // Check if Redis is available
    const isRedisAvailable = redisClient !== null && redisClient !== undefined;

    /**
     * Join auction room
     */
    socket.on('auction:join', async (data) => {
        try {
            const { auctionId } = data;

            // Validate input
            if (!auctionId) {
                socket.emit('auction:error', {
                    code: 'INVALID_INPUT',
                    message: 'auctionId is required'
                });
                return;
            }

            // Join room
            const roomName = `auction:${auctionId}`;
            await socket.join(roomName);

            socket.emit('auction:joined', {
                auctionId,
                message: `Joined auction ${auctionId}`,
                realTimeEnabled: isRedisAvailable
            });
        } catch (error) {
            console.error('Error joining auction:', error);
            socket.emit('auction:error', {
                code: 'JOIN_FAILED',
                message: error.message
            });
        }
    });

    /**
     * Handle bid placement
     */
    socket.on('auction:bid', async (data) => {
        console.log('📥 Received auction:bid event:', {
            data,
            socketId: socket.id,
            redisAvailable: isRedisAvailable
        });

        try {
            // ✅ FALLBACK: Nếu Redis không có, lưu trực tiếp vào MongoDB
            if (!isRedisAvailable) {
                console.log('⚠️ Redis not available, using MongoDB fallback');
                const { auctionId, userId, amount } = data;

                // Validate input
                if (!auctionId || !userId || !amount) {
                    console.error('❌ Invalid input:', { auctionId, userId, amount });
                    socket.emit('auction:bid:error', {
                        code: 'INVALID_INPUT',
                        message: 'auctionId, userId, and amount are required'
                    });
                    return;
                }

                // Validate amount
                if (typeof amount !== 'number' || amount <= 0) {
                    socket.emit('auction:bid:error', {
                        code: 'INVALID_AMOUNT',
                        message: 'amount must be a positive number'
                    });
                    return;
                }

                // Check auction status before allowing bid
                try {
                    const Product = (await import('../models/product.js')).default;
                    const auction = await Product.findById(auctionId);

                    if (!auction) {
                        socket.emit('auction:bid:error', {
                            code: 'AUCTION_NOT_FOUND',
                            message: 'Auction not found'
                        });
                        return;
                    }

                    // Only approved auctions can accept bids
                    if (auction.status !== 'approved') {
                        socket.emit('auction:bid:error', {
                            code: 'AUCTION_NOT_APPROVED',
                            message: auction.status === 'pending'
                                ? 'This auction is pending admin approval and cannot accept bids yet'
                                : 'This auction cannot accept bids'
                        });
                        return;
                    }

                    // Check if auction has ended
                    if (new Date(auction.itemEndDate) < new Date()) {
                        socket.emit('auction:bid:error', {
                            code: 'AUCTION_ENDED',
                            message: 'Phiên đấu giá đã kết thúc. Không thể đặt giá thêm.'
                        });
                        return;
                    }

                    // Check if user is the seller
                    if (auction.seller.toString() === userId) {
                        socket.emit('auction:bid:error', {
                            code: 'CANNOT_BID_OWN_AUCTION',
                            message: 'Bạn không thể đấu giá sản phẩm của chính mình'
                        });
                        return;
                    }

                    // 🔥 CHECK PROFILE & VERIFICATION: User phải cập nhật thông tin và xác minh tài khoản
                    const User = (await import('../models/user.js')).default;
                    const user = await User.findById(userId).select('verification.isVerified phone address location.city location.region');
                    
                    if (!user?.verification?.isVerified) {
                        socket.emit('auction:bid:error', {
                            code: 'VERIFICATION_REQUIRED',
                            message: 'Bạn cần xác minh tài khoản trước khi đặt giá'
                        });
                        return;
                    }

                    const isProfileComplete = user.phone && user.address && user.location?.city && user.location?.region;
                    if (!isProfileComplete) {
                        socket.emit('auction:bid:error', {
                            code: 'PROFILE_INCOMPLETE',
                            message: 'Bạn cần cập nhật đầy đủ thông tin cá nhân (số điện thoại, địa chỉ, tỉnh/thành phố, quận/huyện) trước khi đặt giá',
                            missingFields: {
                                phone: !user.phone,
                                address: !user.address,
                                city: !user.location?.city,
                                region: !user.location?.region
                            }
                        });
                        return;
                    }

                    // 🔥 CHECK DEPOSIT: User phải đặt cọc trước khi bid
                    const depositCheck = await canUserBid(userId, auctionId);
                    if (!depositCheck.canBid) {
                        socket.emit('auction:bid:error', {
                            code: 'DEPOSIT_REQUIRED',
                            message: depositCheck.reason,
                            depositRequired: depositCheck.depositRequired,
                            depositAmount: depositCheck.depositAmount,
                            depositPercentage: depositCheck.depositPercentage
                        });
                        return;
                    }
                } catch (error) {
                    console.error('Error checking auction status:', error);
                    socket.emit('auction:bid:error', {
                        code: 'SERVER_ERROR',
                        message: 'Failed to validate auction'
                    });
                    return;
                }

                // Lưu trực tiếp vào MongoDB
                const timestamp = new Date();
                console.log('💾 Logging bid to MongoDB:', { auctionId, userId, amount });
                await mongoLogger.logBid({
                    auctionId,
                    userId,
                    amount,
                    timestamp
                });
                console.log('✅ Bid logged to MongoDB successfully');

                // Emit success
                console.log('📤 Emitting auction:bid:success to socket:', socket.id);
                socket.emit('auction:bid:success', {
                    message: 'Bid placed successfully',
                    bid: {
                        auctionId,
                        userId,
                        amount,
                        timestamp: timestamp.toISOString()
                    }
                });

                // Emit update to room
                const roomName = `auction:${auctionId}`;
                console.log('📢 Broadcasting bid update to room:', roomName);
                io.to(roomName).emit('auction:bid:updated', {
                    auctionId,
                    userId,
                    amount,
                    timestamp: timestamp.toISOString()
                });

                return;
            }

            console.log('✅ Using Redis path');
            const { auctionId, userId, amount } = data;

            // 1. Validate input
            if (!auctionId || !userId || !amount) {
                console.error('❌ Invalid input (Redis path):', { auctionId, userId, amount });
                socket.emit('auction:bid:error', {
                    code: 'INVALID_INPUT',
                    message: 'auctionId, userId, and amount are required'
                });
                return;
            }

            // Validate amount is a positive number
            if (typeof amount !== 'number' || amount <= 0) {
                socket.emit('auction:bid:error', {
                    code: 'INVALID_AMOUNT',
                    message: 'amount must be a positive number'
                });
                return;
            }

            // 2. Check auction status before allowing bid
            try {
                const Product = (await import('../models/product.js')).default;
                const auction = await Product.findById(auctionId);

                if (!auction) {
                    socket.emit('auction:bid:error', {
                        code: 'AUCTION_NOT_FOUND',
                        message: 'Auction not found'
                    });
                    return;
                }

                // Only approved auctions can accept bids
                if (auction.status !== 'approved') {
                    socket.emit('auction:bid:error', {
                        code: 'AUCTION_NOT_APPROVED',
                        message: auction.status === 'pending'
                            ? 'This auction is pending admin approval and cannot accept bids yet'
                            : 'This auction cannot accept bids'
                    });
                    return;
                }

                // Check if auction has ended
                if (new Date(auction.itemEndDate) < new Date()) {
                    socket.emit('auction:bid:error', {
                        code: 'AUCTION_ENDED',
                        message: 'Phiên đấu giá đã kết thúc. Không thể đặt giá thêm.'
                    });
                    return;
                }

                // Check if user is the seller
                if (auction.seller.toString() === userId) {
                    socket.emit('auction:bid:error', {
                        code: 'CANNOT_BID_OWN_AUCTION',
                        message: 'Bạn không thể đấu giá sản phẩm của chính mình'
                    });
                    return;
                }

                // 🔥 CHECK PROFILE & VERIFICATION: User phải cập nhật thông tin và xác minh tài khoản
                const User = (await import('../models/user.js')).default;
                const user = await User.findById(userId).select('verification.isVerified phone address location.city location.region');
                
                if (!user?.verification?.isVerified) {
                    socket.emit('auction:bid:error', {
                        code: 'VERIFICATION_REQUIRED',
                        message: 'Bạn cần xác minh tài khoản trước khi đặt giá'
                    });
                    return;
                }

                const isProfileComplete = user.phone && user.address && user.location?.city && user.location?.region;
                if (!isProfileComplete) {
                    socket.emit('auction:bid:error', {
                        code: 'PROFILE_INCOMPLETE',
                        message: 'Bạn cần cập nhật đầy đủ thông tin cá nhân (số điện thoại, địa chỉ, tỉnh/thành phố, quận/huyện) trước khi đặt giá',
                        missingFields: {
                            phone: !user.phone,
                            address: !user.address,
                            city: !user.location?.city,
                            region: !user.location?.region
                        }
                    });
                    return;
                }

                // 🔥 CHECK DEPOSIT: User phải đặt cọc trước khi bid
                const depositCheck = await canUserBid(userId, auctionId);
                if (!depositCheck.canBid) {
                    socket.emit('auction:bid:error', {
                        code: 'DEPOSIT_REQUIRED',
                        message: depositCheck.reason,
                        depositRequired: depositCheck.depositRequired,
                        depositAmount: depositCheck.depositAmount,
                        depositPercentage: depositCheck.depositPercentage
                    });
                    return;
                }
            } catch (error) {
                console.error('Error checking auction status:', error);
                socket.emit('auction:bid:error', {
                    code: 'SERVER_ERROR',
                    message: 'Failed to validate auction'
                });
                return;
            }

            const redisKey = `auction:${auctionId}:bids`;

            // 3. Kiểm tra xem giá đã tồn tại chưa
            const existingBidsWithSamePrice = await redisClient.zRangeByScore(
                redisKey,
                amount,
                amount
            );

            if (existingBidsWithSamePrice && existingBidsWithSamePrice.length > 0) {
                socket.emit('auction:bid:error', {
                    code: 'PRICE_EXISTS',
                    message: `Price ${amount} already exists. Please choose a different amount.`,
                    existingAmount: amount
                });
                return;
            }

            // 4. Thêm bid vào Redis ZSET
            const addResult = await redisClient.zAdd(
                redisKey,
                { score: amount, value: userId },
                { NX: true }
            );

            // Nếu userId đã tồn tại, cập nhật score
            if (addResult === 0) {
                await redisClient.zAdd(redisKey, { score: amount, value: userId });
            }

            // 5. Lấy thông tin bid mới nhất
            const timestamp = new Date();
            const bidData = {
                auctionId,
                userId,
                amount,
                timestamp: timestamp.toISOString(),
                socketId: socket.id
            };

            // 6. Ghi log vào MongoDB
            try {
                await mongoLogger.logBid({
                    auctionId,
                    userId,
                    amount,
                    timestamp
                });
            } catch (logError) {
                console.error('MongoDB logging failed:', logError);
            }

            // 7. Lấy top bids để gửi về client
            const topBids = await redisClient.zRangeWithScores(
                redisKey,
                0,
                9,
                { REV: true }
            );

            // Format top bids thành array of objects
            const formattedBids = topBids.map(bid => ({
                userId: bid.value,
                amount: bid.score
            }));

            // 8. Emit event cho tất cả clients trong room
            const roomName = `auction:${auctionId}`;

            const updateData = {
                ...bidData,
                topBids: formattedBids,
                totalBids: await redisClient.zCard(redisKey)
            };

            io.to(roomName).emit('auction:bid:updated', updateData);

            // 9. Confirm thành công cho client đã bid
            console.log('📤 Emitting auction:bid:success to socket (Redis):', socket.id);
            socket.emit('auction:bid:success', {
                message: 'Bid placed successfully',
                bid: bidData
            });
            console.log('✅ Bid process completed successfully');

        } catch (error) {
            console.error('Error handling bid:', error);
            socket.emit('auction:bid:error', {
                code: 'BID_FAILED',
                message: error.message || 'Failed to place bid'
            });
        }
    });

    /**
     * Get current auction state
     */
    socket.on('auction:get-state', async (data) => {
        try {
            const { auctionId } = data;

            if (!auctionId) {
                socket.emit('auction:error', {
                    code: 'INVALID_INPUT',
                    message: 'auctionId is required'
                });
                return;
            }

            // ✅ FALLBACK: Nếu Redis không có, lấy từ MongoDB
            if (!isRedisAvailable) {
                try {
                    const Product = (await import('../models/product.js')).default;
                    const product = await Product.findById(auctionId);

                    if (!product) {
                        socket.emit('auction:error', {
                            code: 'AUCTION_NOT_FOUND',
                            message: 'Auction not found'
                        });
                        return;
                    }

                    // Get top 10 bids from MongoDB
                    const sortedBids = [...(product.bids || [])]
                        .sort((a, b) => b.bidAmount - a.bidAmount)
                        .slice(0, 10);

                    const formattedBids = sortedBids.map(bid => ({
                        userId: bid.bidder,
                        amount: bid.bidAmount
                    }));

                    const highestBid = formattedBids.length > 0 ? formattedBids[0] : null;

                    socket.emit('auction:state', {
                        auctionId,
                        topBids: formattedBids,
                        highestBid,
                        totalBids: product.bids?.length || 0
                    });
                    return;
                } catch (mongoError) {
                    console.error('MongoDB fallback error:', mongoError);
                    socket.emit('auction:error', {
                        code: 'STATE_FETCH_FAILED',
                        message: 'Failed to fetch auction state'
                    });
                    return;
                }
            }

            // Redis is available - use Redis
            const redisKey = `auction:${auctionId}:bids`;

            // Lấy top 10 bids
            const topBids = await redisClient.zRangeWithScores(
                redisKey,
                0,
                9,
                { REV: true }
            );

            // Format bids
            const formattedBids = topBids.map(bid => ({
                userId: bid.value,
                amount: bid.score
            }));

            // Lấy highest bid
            const highestBid = formattedBids.length > 0 ? formattedBids[0] : null;

            socket.emit('auction:state', {
                auctionId,
                topBids: formattedBids,
                highestBid,
                totalBids: await redisClient.zCard(redisKey)
            });

        } catch (error) {
            console.error('Error getting auction state:', error);
            socket.emit('auction:error', {
                code: 'STATE_FETCH_FAILED',
                message: error.message
            });
        }
    });

    /**
     * Leave auction room
     */
    socket.on('auction:leave', async (data) => {
        try {
            const { auctionId } = data;

            if (!auctionId) {
                return;
            }

            const roomName = `auction:${auctionId}`;
            await socket.leave(roomName);
        } catch (error) {
            console.error('Error leaving auction room:', error);
        }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
        // Silent disconnect
    });
};

export default handleAuctionSocket;
