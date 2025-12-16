import express from 'express';
import * as controller from '../controllers/contract.controller.js';
const router = express.Router();

router.get('/', controller.index);
router.post('/create',controller.create)
export const contractRouter = router;