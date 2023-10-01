const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handleFactory');

exports.getAllReviews = catchAsync (async (req, res, next)=> {
    let filter = {};
    if(req.params.tourId) filter = {tour : req.params.tourId};

    const reviews = await Review.find(filter);
    res.status(200).json({
        status : 'success',
        reviews
    });
});

exports.createReview = catchAsync(async (req, res, next) => {
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    const review = await Review.create(req.body);
    res.status(200).json({
        status : 'success',
        review
    });
});

exports.getReview = factory.getOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);


