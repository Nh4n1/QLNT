import express from 'express';
import sequelize from './config/database.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

sequelize;
app.set('views', './views');
app.set('view engine', 'pug');


app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

