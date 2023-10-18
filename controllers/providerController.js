/**
 * Functions related to calling the provider resource in the API
 * @module providerController
 */
const { Request, Response, NextFunction } = require('express');
const Provider = require('../models/providerModel');
const { catchAsync } = require('../utils/utils');

exports.getAllProviders = catchAsync(
    /**
     * Function used to handle the requesting of all existing Provider resources.
     * @param {Request} req The request object of the Express framework, used to handle the request sent by the provider.
     * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end provider.
     * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (req, res, next) => {
        const providers = await Provider.find({});

        res.status(200).json({
            status: 'success',
            data: { providers },
        });
    },
);
