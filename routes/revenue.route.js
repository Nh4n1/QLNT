import express from 'express';
import * as controller from '../controllers/revenue.controller.js';
const router = express.Router();

router.get('/', controller.index);

export const revenueRouter = router;