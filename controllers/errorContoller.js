const appError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path} : ${err.value}`;
    return new appError(message , 400);
}

const handleDuplicateDB = err => {
    
    const value = err.keyValue;
    const message = `Duplicate field value ${JSON.stringify(value)} ,please use another value`;
    return new appError(message , 400);
}

const handleValidationError = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data . ${errors.join('. ')}`;
    return new appError(message , 400);

}

const handleJWTError = err => new appError('Invalid Token , please login again ' , 401);

const handleJWTExpired = err => new appError('Your Token has expired, please login again ' , 401);

const sendErrorDev = (err, req, res)=> {
    // API
    if(req.originalUrl.startsWith('/api')){
        res.status(err.statusCode).json({
            status : err.status ,
            message : err.message,
            error : err,
            stack : err.stack
        });
    }
    else {
        // RENDERED WEBSTIE
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg : err.message
        });
    }
}

const sendErrorProd = (err, req , res)=>{
    if(req.originalUrl.startsWith('/api')){
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status : err.status ,
                message : err.message,
            });
        }
        
        return res.status(500).json({
                status : 'error' ,
                message : 'Something went wrong',
            });
        }
        
    
        if(err.isOperational){
            return res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg : err.message
            });
        }
        
        return res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg : 'Please try again later'
            });
}

module.exports = (err, req, res, next)=>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV === 'development'){
       sendErrorDev(err, req ,res);
    }else if (process.env.NODE_ENV === 'production'){
        let error = {...err};
        error.message = err.message; 

        if(error.name === 'CastError')  error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateDB(error);
        if(error.name === 'ValidationError') error = handleValidationError(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTError();
        if(error.name == 'TokenExpiredError') error = handleJWTExpired();
        
        sendErrorProd(err, req ,res);
    }
}; 