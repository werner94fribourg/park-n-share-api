const {catchAsync} = require("../utils/utils");
const Park = require("../models/parkingModel");
const AppError = require("../utils/classes/AppError");


exports.handleParkingQuery = catchAsync(
    /**
     * Function used to handle all type of queries related to the get parking slots
     * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
     * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
     * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (req, res, next) => {
        const query = {};
        const validParkTypes = ['indoor', 'outdoor'];

        if (req.query.isOccupied) {
            query.isOccupied = false;
        }

        if (req.query.location) {
            query.location = req.query.location;
        }

        if (req.query.minPrice && req.query.maxPrice) {
            query.price = {$gte: parseFloat(req.query.minPrice), $lte: parseFloat(req.query.maxPrice)};
        } else if (req.query.minPrice) {
            query.price = {$gte: parseFloat(req.query.minPrice)};
        } else if (req.query.maxPrice) {
            query.price = {$lte: parseFloat(req.query.maxPrice)};
        }

        if (req.query.parkType && validParkTypes.includes(req.query.parkType)) {
            query.parkType = req.query.parkType;
        }

        req.query=query

        next();
    },
);

exports.getAllParkings = catchAsync(
    /**
     * Function used to process queries and populate the response with such filters
     * @param query All queries used to output a specific response to the filters given by the queries
     * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
     * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (query, res, next) => {
        try {
            const parks = await Park.find(query).populate({
                path: 'Owner',
                select: 'username phone email',
            });

            parks.forEach(park => {
                park.generateFileAbsolutePath();
            });

            res.status(200).json({ status: 'success', data: {parks}, });

        } catch (error) {
            next(
                new AppError("The requested query doesn't exist.", 404),
            );
        }
    }
);