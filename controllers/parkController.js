const {catchAsync} = require("../utils/utils");
const Park = require("../models/parkModel");
// const User = require("../models/userModel");


exports.getAllParkings = catchAsync(
    /**
     * Function used to get all existing user resources in the database.
     * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
     * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
     * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (req, res, next) => {
        const parks = await Park.find({}).populate({
            path: 'User',
            select: 'username phone email'
        });
        parks.forEach(park => {
            park.generateFileAbsolutePath();
        });
        res.status(200).json({
            status: 'success',
            data: { parks },
        });
    },
);

exports.getAllFreeParkings = catchAsync(
    /**
     * Function used to get all existing user resources in the database.
     * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
     * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
     * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (req, res, next) => {
        const parks = await Park.find({ isOccupied: false }).populate({
            path: 'User',
            select: 'username phone email'
        });
        parks.forEach(park => {
            park.generateFileAbsolutePath();
        });
        res.status(200).json({
            status: 'success',
            data: { parks },
        });
    },
);