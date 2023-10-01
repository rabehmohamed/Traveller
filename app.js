const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const cookieParser = require('cookie-parser');

const appError = require('./utils/appError');
const errorHandler = require('./controllers/errorContoller');
const userRouter = require('./routes/userRoutes');   
const tourRouter = require('./routes/tourRoutes'); 
const reviewRouter = require('./routes/reviewRoutes'); 
const bookingRouter = require('./routes/bookingRoutes'); 
const viewRouter = require('./routes/viewRoutes'); 

const DB = process.env.DATABASE.replace(
    '<password>' ,
     process.env.DATABASE_PASSWORD
);

const storeSession = new mongodbStore({
    urL : DB,
    collection : 'sessions'
})

const app = express(); 

app.set('view engine' , 'pug');
app.set('views', path.join(__dirname ,'views'));
// Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
app.use(helmet({
    contentSecurityPolicy: false
}));

// Development Logging
if(process.env.NODE_ENV === "development"){
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    // max -> 100 requests from same ip , windowMs -> one hour
    max : 1000,
    windowMs : 60*60*1000,
    message : 'Too many requests from this IP , please try again in an hour!'
});

//Limit requests from same API
app.use('/api',limiter);

// Body parser , reading data from body into req.body
app.use(express.json({ limit : '10kb' }));
app.use(express.urlencoded({ extended : true , limit :'10kb'}));
app.use(cookieParser());

// Data sanitization : against noSql query injection 
app.use(mongoSanitize());

// Data sanitization : xss
app.use(xss());
// Prevent parameter pollutino
app.use(hpp({
    whitelist : ['duration' , 'ratingsAverage' , 'ratingsQuantity' , 'maxGroupSize' , 'difficulty' , 'price']
}));


/* app.use(session({
    secret : 'SGLAASJFASJLFSAJFSAJFA',
    resave : false,
    saveUninitialized : false,
    store : storeSession
}
)); */
app.use('/',viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*',(req, res, next)=>{
    next(new appError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandler , (err)=>{
    console.err(err.stack);
});

module.exports = app;
