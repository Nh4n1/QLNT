import express from 'express';
import * as controller from '../controllers/user.controller.js';
const router = express.Router();

router.get('/', controller.index);
router.post('/create', controller.create);
router.post('/add-resident', controller.addResident);

export const userRouter = router;