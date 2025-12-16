import { contractRouter } from './contract.route.js';
import { rentHouseRouter } from './rent-house.route.js';
import { roomRouter } from './room.route.js';
import { userRouter } from './user.route.js';

const clientRouter = (app) => {
    app.use('/rent-houses', rentHouseRouter);
    app.use('/rooms', roomRouter); 
    app.use('/users',userRouter);
    app.use('/contracts', contractRouter);
}

export default clientRouter;