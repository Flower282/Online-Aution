/**
 * Product/Auction Factory - Generates fake auction/product data for tests
 * 
 * Usage:
 *   productFactory() // Basic product
 *   productFactory({ status: 'closed' }) // Closed auction
 *   auctionFactory({ currentBid: 1000 }) // Custom bid
 */

/**
 * Creates a product/auction object
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Product object
 */
export const productFactory = (overrides = {}) => ({
  _id: 'product123',
  id: 'product123',
  itemName: 'Test Auction Item',
  description: 'This is a test auction item description',
  startingBid: 100,
  currentBid: 100,
  minIncrement: 10,
  status: 'active',
  createdBy: 'user123',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  endTime: new Date('2024-12-31T23:59:59.999Z'),
  imageUrl: 'https://example.com/image.jpg',
  category: 'electronics',
  bids: [],
  ...overrides,
});

/**
 * Alias for productFactory (more semantic for auction context)
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Auction object
 */
export const auctionFactory = (overrides = {}) => productFactory(overrides);

/**
 * Creates a closed auction
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Closed auction object
 */
export const closedAuctionFactory = (overrides = {}) => 
  productFactory({
    _id: 'closed123',
    id: 'closed123',
    status: 'closed',
    endTime: new Date('2023-12-31T23:59:59.999Z'),
    ...overrides,
  });

/**
 * Creates an auction with bids
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Auction with bids
 */
export const auctionWithBidsFactory = (overrides = {}) => 
  productFactory({
    currentBid: 250,
    bids: [
      {
        userId: 'user456',
        amount: 150,
        timestamp: new Date('2024-06-01T10:00:00.000Z'),
      },
      {
        userId: 'user789',
        amount: 200,
        timestamp: new Date('2024-06-02T11:00:00.000Z'),
      },
      {
        userId: 'user456',
        amount: 250,
        timestamp: new Date('2024-06-03T12:00:00.000Z'),
      },
    ],
    ...overrides,
  });

/**
 * Creates a bid object
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Bid object
 */
export const bidFactory = (overrides = {}) => ({
  userId: 'user456',
  amount: 150,
  timestamp: new Date('2024-06-01T10:00:00.000Z'),
  ...overrides,
});

/**
 * Creates an auction creation payload
 * @param {Object} overrides - Fields to override defaults
 * @returns {Object} Auction creation payload
 */
export const auctionPayloadFactory = (overrides = {}) => ({
  itemName: 'New Auction Item',
  description: 'Brand new auction item',
  startingBid: 100,
  minIncrement: 10,
  endTime: '2024-12-31T23:59:59.999Z',
  category: 'electronics',
  ...overrides,
});
