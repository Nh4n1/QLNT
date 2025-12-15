import express from 'express';
import * as controller from '../controllers/rent-house.controller.js';
const router = express.Router();

router.get('/', controller.index);
router.post('/', controller.create);

export const rentHouseRouter = router;