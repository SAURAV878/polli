import express from 'express';
import userRoutes from './routes/user.routes.js'
import progressRoutes from './routes/progress.routes.js'
import connectDB from './config/db.config.js';
import cookieParser from 'cookie-parser';
import env from 'dotenv'
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001 ;

env.config()
connectDB();



app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({
    extended:true,
}))

app.use(cors({
    origin:'*'
}))

app.use('/api', userRoutes);
app.use('/api', progressRoutes);

app.listen(port, (err) => {
    if (err) return console.log(err);   
    console.log(`Server is running on port ${port}`);
})
