const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const factory = require('./handleFactory');
const multer = require('multer');
const sharp = require('sharp');

/* const multerStorage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename : (req, file, cb) => {
        // Extract extension from user's uploaded photo
        const extension = file.mimetype.split('/')[1];
        // user-16441616-5454.jpeg
        cb(null , `user-${req.user.id}-${Date.now()}.${extension}`)
    }
});*/ 

const multerStorage = multer.memoryStorage ();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null , true);
    } 
    else {
        cb(new appError('Not an image! Please upload only images .' , 400) , false);
    }

}
const upload = multer({ 
    storage : multerStorage,
    fileFilter : multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
  
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
  
    next();
  });

const filterObj = (obj, ...allowedFields) =>{
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)){
            newObj[el] = obj[el];
        }
    });
    return newObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id; 
    next();
}

exports.getAllUsers = factory.getAll(User)

exports.createUser = factory.createOne(User);

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.deletMe = catchAsync( async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id , {active : false});
    res.status(204).json({
        status : 'success',
        data : null
    });
});

exports.updateMe = catchAsync( async(req, res, next) => {

    if(req.body.password || req.body.passwordConfirm){
        return next(new appError('This route is not for password update') , 400);
    }

    // filter unwated fields (To not change role from user -> admin) 
    const filteredBody = filterObj(req.body , 'name' , 'email');
    if(req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.user.id , filteredBody , {
        new : true, 
        runValidators : true
    });

    res.status(200).json({
        status : 'success',
        message : 'Info Updated',
        updatedUser
    });

});