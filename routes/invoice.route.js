import express from 'express';
import * as controller from '../controllers/invoice.controller.js';
const router = express.Router();
router.get('/', controller.index);
router.get('/details/:id', controller.detail);
router.post('/create', controller.create);
router.post('/payment', controller.payment);
export const invoiceRouter = router;