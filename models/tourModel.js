const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema({

    name : 
    {
        type :String,
        required : [true , 'A tour must have a name'],
        unique : true,
        trim : true,
        maxlength : [40 , 'A tour name must have less or equal than 40 characters'],
        minlength : [10 , 'A tour name must have more or equal than 10 characters'],
       // validate : validator.isAlpha
    },
    slug : String,
    duration :
    {
        type : Number,
        required : [true , 'A tour must have a duration']
    },
    maxGroupSize :
    {
        type : Number,
        required : [true , 'A tour must have a group size']
    },
    difficulty :
    {
        type : String,
        required : [true , 'A tour must have a difficulty'],
        enum : 
        {
            values : ['easy' , 'medium' , 'difficult'],
            message : 'Difficulty is either easy , medium or difficult'
        }
    },
    ratingsAverage : 
    {
        type : Number,
        default : 4.5,
        min : [1 , 'Rating must be above 1.0'],
        max : [5 , 'Rating must be below 5.0'],
        set : val => Math.round(val * 10) / 10  // Run each time value is set for this field
    },
    ratingsQuantity : 
    {
        type : Number,
        default : 0
    },
    price : 
    {
        type : Number,
        required : [true , 'A tour must have a price']
    },
    priceDiscount :
    {
        type : Number , 
        validate : 
        {
            validator : function(val) { return this.price > val; },                                                               
            message : 'Price discount can not be higher than the actual price'
        }
    } ,
    summary :
    {
        type : String,
        trim : true,  
    },
    description :
    {
        type : String,
        trim : true,
        required : [true , 'A tour must have a description']
    },
    imageCover : {
        type : String,
        required : [true , 'A tour must have an image']
    },
    images : [String],
    createdAt : {
        type : Date,
        default : Date.now(),
        select : false
    },
    startDates : [Date],
    secretTour : 
    {
        type : Boolean ,
        default : false
    },
    startLocation :
    {
        type : 
        {
            type : String , 
            default : 'Point',
            enum : ['Point']
        },
        coordinates : [Number],
        address : String ,
        description : String
    },
    locations : 
    [
        {
            type : 
            {
                type : String , 
                default : 'Point',
                enum : ['Point']
            },
            coordinates : [Number],
            address : String ,
            description : String, 
            day : Number
        }
    ],
    guides : 
    [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'User'
        }
    ],
},
{
    toJSON : { virtuals : true},
    toObject  : { virtuals : true}
}
); 
// 1 : ascending order
tourSchema.index({ price : 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation : '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7 ;
});

// VIRTUAL POPULATE
tourSchema.virtual('reviews' , {
    ref : 'Review',
    foreignField : 'tour',
    localField : '_id'
});

//Document Middleware runs before .save() and .create()
tourSchema.pre('save' , function(next) {
    if (!this.slug) {
        this.slug = slugify(this.name, { lower: true });
    }
    next();
});


// RESPONSIBLE FOR EMBDEDDING
/* tourSchema.pre('save' , async function(next) {
    const guidePromises = this.guides.map(async id => await User.findById(id));
    this.guides = await Promise.all(guidePromises);
    next();
}); */

//Query Middleware
// /^find/ -> for all queries start with find
tourSchema.pre(/^find/ , function(next){
    this.find({secretTour : {$ne : true}});
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/ , function(next){
    this.populate({
        path : 'guides', 
        select : '-__v -passwordChangedAt'
    });
    next();
})

//Aggregation Middleware
/* tourSchema.pre('aggregate', function(next){
    // to add at first of array *pipeline*
    this.pipeline().unshift({ $match : {secretTour : {$ne : true} } });
    next();
}); */

const Tour = mongoose.model('Tour' , tourSchema);

module.exports = Tour;