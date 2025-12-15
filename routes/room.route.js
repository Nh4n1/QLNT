import express from 'express';
import * as controller from '../controllers/room.controller.js';
const router = express.Router();

router.get('/', controller.index);
router.post('/', controller.create);

export const roomRouter = router;