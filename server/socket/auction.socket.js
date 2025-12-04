/**
 * Auction Socket Module
 * Xử lý đấu giá real-time với Redis ZSET và MongoDB logging
 * Tránh N+1 connection bằng cách nhận dependencies từ bên ngoài
 */

/**
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance
 * @param {Object} dependencies - External dependencies
 * @param {Object} dependencies.redisClient - Redis client instance
 * @param {Object} dependencies.mongoLogger - MongoDB logger instance
 */
export const handleAuctionSocket = (socket, io, { redisClient, mongoLogger }) => {
    
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
                message: `Joined auction ${auctionId}`
            });

            console.log(`Socket ${socket.id} joined room ${roomName}`);
        } catch (error) {
            console.error('Error joining auction room:', error);
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
            const existingBidsWithSamePrice = await redisClient.zrangebyscore(
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
            // ZADD key NX score member - chỉ thêm nếu member chưa tồn tại
            const addResult = await redisClient.zadd(
                redisKey,
                'NX', // Only add if member doesn't exist
                amount,
                userId
            );

            // Nếu userId đã tồn tại, cập nhật score
            if (addResult === 0) {
                // User đã bid trước đó, cập nhật với score mới
                await redisClient.zadd(redisKey, amount, userId);
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
                // Không throw error để không ảnh hưởng đến luồng chính
            }

            // 6. Lấy top bids để gửi về client
            const topBids = await redisClient.zrevrange(
                redisKey,
                0,
                9,
                'WITHSCORES'
            );

            // Format top bids thành array of objects
            const formattedBids = [];
            for (let i = 0; i < topBids.length; i += 2) {
                formattedBids.push({
                    userId: topBids[i],
                    amount: parseFloat(topBids[i + 1])
                });
            }

            // 7. Emit event cho tất cả clients trong room
            const roomName = `auction:${auctionId}`;
            io.to(roomName).emit('auction:bid:updated', {
                ...bidData,
                topBids: formattedBids,
                totalBids: await redisClient.zcard(redisKey)
            });

            // 8. Confirm thành công cho client đã bid
            socket.emit('auction:bid:success', {
                message: 'Bid placed successfully',
                bid: bidData
            });

            console.log(`Bid placed: User ${userId} bid ${amount} on auction ${auctionId}`);

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

            const redisKey = `auction:${auctionId}:bids`;

            // Lấy top 10 bids
            const topBids = await redisClient.zrevrange(
                redisKey,
                0,
                9,
                'WITHSCORES'
            );

            // Format bids
            const formattedBids = [];
            for (let i = 0; i < topBids.length; i += 2) {
                formattedBids.push({
                    userId: topBids[i],
                    amount: parseFloat(topBids[i + 1])
                });
            }

            // Lấy highest bid
            const highestBid = formattedBids.length > 0 ? formattedBids[0] : null;

            socket.emit('auction:state', {
                auctionId,
                topBids: formattedBids,
                highestBid,
                totalBids: await redisClient.zcard(redisKey)
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
            
            console.log(`Socket ${socket.id} left room ${roomName}`);
        } catch (error) {
            console.error('Error leaving auction room:', error);
        }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected from auction`);
    });
};

export default handleAuctionSocket;
