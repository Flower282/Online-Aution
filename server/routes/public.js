import express from 'express';
import {
    getPublicAuctions,
} from '../controllers/public.controller.js';

const publicRouter = express.Router();

// Public endpoints - NO authentication required
publicRouter
    .get('/auctions', getPublicAuctions);

export default publicRouter;
