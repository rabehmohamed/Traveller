const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

router.use('/:tourId/reviews' , reviewRouter);

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTours , tourController.getAllTours);

router
    .route('/tour-stats')
    .get(tourController.getTourStats);



router.use(authController.protect);

router
    .route('/monthly-plan/:year')
    .get(tourController.getMonthlyPlan);

router
     .route('/tour-within/:distance/center/:latlng/unit/:unit')
     .get(tourController.getToursWithin)

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)
    

router
   .route('/')
   .get(tourController.getAllTours)
   .post(authController.restrictTo('admin' , 'lead-guide'),
         tourController.createTour);

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.restrictTo('admin' , 'lead-guide'), 
            tourController.uploadTourImages , 
            tourController.resizeTourImages ,
            tourController.updateTour)
    .delete(authController.restrictTo('admin' , 'lead-guide') ,
            tourController.deleteTour);
            

module.exports = router;