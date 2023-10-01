const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.createOne = Model => 
    catchAsync (async (req, res, next) => {
        const doc = await Model.create(req.body); 
        res.status(201).json({
            status:'success',
            data : doc
        });     
    });

exports.getAll = Model => 
    catchAsync (async (req, res, next) => {
        const features = new APIFeatures( Model.find() , req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

        const docs = await features.query.explain();
        res.status(200).json({
         status : 'success',
         results : docs.length,
         data : {docs}
        });
    });


exports.getOne = (Model, popOptions) => 
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        
        if(popOptions) query = query.populate(popOptions);
        const doc = await query;

        if(!doc){
            return next(new appError('No document found with with ID' , 404));
        }

        res.status(200).json({
         status : 'success',
         data : doc
        });
    })

exports.updateOne = Model => 
    catchAsync (async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id , req.body , {
            new : true,
            runValidators : true
        });

        if(!doc){
            return next(new appError('No document found with with ID' , 404));
        }

        res.status(200).json({
            status : 'success',
            data : doc
        });
    })

exports.deleteOne = Model => 
    catchAsync (async(req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        return next(new appError('No document found with with ID' , 404));
    }

    res.status(200).json({
        status : 'success',
        message : 'deleted'
    }); 
});
