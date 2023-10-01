const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException' , err => {
    console.log("uncaught exception ... shutting down"); 
    console.log(err.name , err.message);
    process.exit(1);

});

dotenv.config({path : './config.env'});
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<password>' ,
     process.env.DATABASE_PASSWORD
);

mongoose.connect(DB)
.then(() => {
    console.log('DB connection Successful');
});


const port = process.env.PORT || 5000;
app.listen(port , ()=>{
    console.log(`App running on port ${port}....`);
})

// HANDLE UNHANDLED REJECTED PROMISES 
process.on('unhandledRejection' , err =>{  
    console.log("unhandled rejection ... shutting down"); 
    console.log(err.name , err.message);
    // 0 : success , 1 : uncaught exception
    server.close(() => {
        process.exit(1);
    })
});

