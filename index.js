import express from 'express';
import dotenv from 'dotenv';
import clientRouter from './routes/index.route.js';
import session from 'express-session';
import flash from 'express-flash';
import cookieParser from 'cookie-parser';
import { loadHouses, selectHouse, createHouse } from './middlewares/house.middleware.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser('keyboard cat'));
app.use(session({ 
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 ngày
}));
app.use(flash());

// Middleware load danh sách nhà trọ cho tất cả các trang
app.use(loadHouses);

// Routes cho việc chọn/tạo nhà trọ từ sider
app.get('/houses/select/:id', selectHouse);
app.post('/houses/create', createHouse);



app.set('views', './views');
app.set('view engine', 'pug');


app.get('/', (req, res) => {
  res.send('Hello World');
});


clientRouter(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

