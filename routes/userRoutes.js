const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup' , authController.signup);
router.post('/login' , authController.login);
router.post('/logout' , authController.logout);

router.post('/forgotPassword' , authController.forgotPassword);
router.patch('/resetPassword/:token' , authController.resetPassword);


// ALL THE BELOW ROUTES NEEDS PROTECTION
router.use(authController.protect); 

router.patch('/updateMyPassword' , authController.updatePassword);
router.get('/me' , userController.getMe , userController.getUser);
router.patch('/updateMyInfo' , userController.uploadUserPhoto , userController.resizeUserPhoto ,userController.updateMe);
router.delete('/deleteMyAcc' , userController.deletMe);

// ALL THE BELOW ROUTES NEEDS ADMIN AUTHORIZATION
router.use(authController.protect, authController.restrictTo('admin')); 

router
    .route('/')
    .get(userController.getAllUsers) 
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser) 
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

    
module.exports = router;