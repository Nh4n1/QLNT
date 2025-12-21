import express from 'express';
import * as controller from '../controllers/service.controller.js';
const router = express.Router();

router.get('/', controller.index);
router.post('/', controller.create);
router.post('/update/:id', controller.update);
router.get('/delete/:id', controller.remove);

export const serviceRouter = router;