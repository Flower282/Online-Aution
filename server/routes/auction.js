import express from 'express';
import { createAuction, showAuction, auctionById, placeBid, dashboardData, myAuction, deleteAuction } from '../controllers/auction.controller.js';
import upload from '../middleware/multer.js';
import { checkAdmin } from '../middleware/checkAdmin.js';

const auctionRouter = express.Router();

auctionRouter
    .get('/stats', dashboardData)

auctionRouter
    .get('/', showAuction)
    .post('/', upload.single('itemPhoto'), createAuction);

auctionRouter
    .get("/myauction", myAuction)

auctionRouter
    .get('/:id', auctionById)
    .post('/:id', placeBid)
    .delete('/:id', checkAdmin, deleteAuction)


export default auctionRouter;