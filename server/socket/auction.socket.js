/**
 * Auction Socket Module
 * Xử lý đấu giá real-time với Redis ZSET và MongoDB logging
 * Tránh N+1 connection bằng cách nhận dependencies từ bên ngoài
 */

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
        try {
            // ✅ FALLBACK: Nếu Redis không có, lưu trực tiếp vào MongoDB
            if (!isRedisAvailable) {
                const { auctionId, userId, amount } = data;

                // Validate input
                if (!auctionId || !userId || !amount) {
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

                // Lưu trực tiếp vào MongoDB
                const timestamp = new Date();
                await mongoLogger.logBid({
                    auctionId,
                    userId,
                    amount,
                    timestamp
                });

                // Emit success
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
                io.to(roomName).emit('auction:bid:updated', {
                    auctionId,
                    userId,
                    amount,
                    timestamp: timestamp.toISOString()
                });

                return;
            }

            const { auctionId, userId, amount } = data;

            // 1. Validate input
            if (!auctionId || !userId || !amount) {
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

            const redisKey = `auction:${auctionId}:bids`;

            // 2. Kiểm tra xem giá đã tồn tại chưa
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

            // 3. Thêm bid vào Redis ZSET
            const addResult = await redisClient.zAdd(
                redisKey,
                { score: amount, value: userId },
                { NX: true }
            );

            // Nếu userId đã tồn tại, cập nhật score
            if (addResult === 0) {
                await redisClient.zAdd(redisKey, { score: amount, value: userId });
            }

            // 4. Lấy thông tin bid mới nhất
            const timestamp = new Date();
            const bidData = {
                auctionId,
                userId,
                amount,
                timestamp: timestamp.toISOString(),
                socketId: socket.id
            };

            // 5. Ghi log vào MongoDB
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

            // 6. Lấy top bids để gửi về client
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

            // 7. Emit event cho tất cả clients trong room
            const roomName = `auction:${auctionId}`;

            const updateData = {
                ...bidData,
                topBids: formattedBids,
                totalBids: await redisClient.zCard(redisKey)
            };

            io.to(roomName).emit('auction:bid:updated', updateData);

            // 8. Confirm thành công cho client đã bid
            socket.emit('auction:bid:success', {
                message: 'Bid placed successfully',
                bid: bidData
            });

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
