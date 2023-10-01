const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const catchAsync = require('./../utils/catchAsync');

const signToken = id => {
    return jwt.sign({ id : id } , process.env.JWT_SECRET , {
        expiresIn : process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user , statusCode , res) => {
    const token = signToken(user._id);

    const cookieOptions =  {
        expires : new Date( Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly : true
    };
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token , cookieOptions);
    
    res.status(statusCode).json({
        status : 'success', 
        token      
    })
}

exports.signup = catchAsync ( async (req, res, next) => {
    const newUser = await User.create(req.body);
    // sign(payload , secret , options : {expiresIn})
    createSendToken(newUser , 201 , res);
});

exports.login = catchAsync ( async (req, res, next) =>{
    const {email , password} = req.body; 
    if(!email || !password){
        return next(new appError('please provide email and password') , 400);
    }
    
    const user = await User.findOne({email : email}).select('+password');
    // correctPassword : instance method on all user documents -> userModel
    if(!user || !await user.correctPassword(password , user.password)){
        return next(new appError('Incorrect Email or password') , 401);
    }
    createSendToken(user , 200 , res);
    /*  
    req.session.user = user
    console.log(req.session); 
    // ON LOGOUT
    req.session.destroy 
    */
});

exports.logout = catchAsync(async (req,res,next)=> {
    res.cookie('jwt' , 'loggedOut' , {
        expires : new Date(Date.now() + 10 * 1000),
        httpOnly : true
    });
    res.status(200).json({status : 'success'});
});

exports.protect = catchAsync ( async (req, res, next) => {
    //1) Get token 
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt){
        token = req.cookies.jwt;
    }
    if(!token){
        return next(new appError(`You are not logged in , Please login to access `) , 401);
    }
    /*2) Verify token 
         Get payload : user._id 
    */
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3) Chevk if user stil exists 
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new appError('The user does not exist'));
    }
    //4) Check if user changed password after jwt was issued
    if(freshUser.changePasswordAfter(decoded.iat)){
      // return next(new appError('User changed password , Please login again'), 401);
    };
    //GRANT ACCESS
    req.user = freshUser ; 
    next();
});

// for render pages
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt){
        try {
        // Verify token
        const decoded = await promisify(jwt.verify)(req.cookies.jwt , process.env.JWT_SECRET);
        // check if user exists
        const currentUser = await User.findById(decoded.id);
        if(!currentUser){
            return next();
        }
        //Check if user changed password after jwt was issued
        if(currentUser.changePasswordAfter(decoded.iat)){
            return next(); 
        };
        //GRANT ACCESS
        res.locals.user = currentUser;
        return next();
    }catch(err){
        return next();
    }
    }
    next();
};

exports.restrictTo = (...roles) =>{
    return (req, res, next) =>{
        if(!roles.includes(req.user.role)) {
            return next(new appError('You do not have permission ') , 403);
        }
        next();
    }
}

exports.forgotPassword = catchAsync (async (req, res , next) =>{
    const user = await User.findOne({email : req.body.email});
    if(!user){
        return next(new appError ('This user does not exist'), 404 );
    }

    const resetToken = user.createPassResetToken();
    await user.save({validateBeforeSave : false});

    //DELETE THOSE WHEN YOU FIX THE EMAIL SENDER
    res.status(200).json({
        status : 'success',
        message : 'Token created!'
    });
    console.log(resetToken);

  /*  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}` ; 
    const message = `Forgot you password ? Submit with your new password to : ${resetURL}`;

    try {

        await sendEmail({
            email : user.email,
            subject : 'Your password reset {valid for 10 minutes}',
            message
        });
        res.status(200).json({
            status : 'success',
            message : 'Token sent to email!'
        });
    }
    catch(err){
       // user.passwordResetToken = undefined ;
       // user.passwordResetExpires = undefined ;
        await user.save({validateBeforeSave : false});

        return next(new appError('There was an error sending the email , Try again Later'), 500);
    } */
});

exports.resetPassword = catchAsync ( async (req, res, next) => {
    // Get user based on token , hash plain token sent , then search
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken : hashedToken

    });

    if(!user || (Date.now() > user.passwordResetExpires)){
        return next(new appError('Token is invalid or has expired'), 400);
    }

    user.password = req.body.password ;
    user.passwordConfirm = req.body.passwordConfirm ;
    user.passwordChangedAt = Date.now() - 1000;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user , 200 , res);
});

exports.updatePassword = catchAsync ( async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if(!( await user.correctPassword(req.body.currentPassword , user.password) )){
        return next(new appError('You entered wrong password'), 401);
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user , 200 , res);
});

