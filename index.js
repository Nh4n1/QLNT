import express from 'express';
import dotenv from 'dotenv';
import clientRouter from './routes/index.route.js';
import session from 'express-session';
import flash from 'express-flash';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser('keyboard cat'));
app.use(session({ cookie: { maxAge: 60000 }}));
app.use(flash());



app.set('views', './views');
app.set('view engine', 'pug');


app.get('/', (req, res) => {
  res.send('Hello World');
});


clientRouter(app);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

