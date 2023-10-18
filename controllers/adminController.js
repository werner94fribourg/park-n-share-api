/**
 * Functions related to calling the admin resource in the API
 * @module adminController
 */
const { Request, Response, NextFunction } = require('express');
const Admin = require('../models/adminModel');
const { catchAsync } = require('../utils/utils');

exports.getAllAdmins = catchAsync(
    /**
     * Function used to handle the requesting of all existing admin resources.
     * @param {Request} req The request object of the Express framework, used to handle the request sent by the admin.
     * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end admin.
     * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (req, res, next) => {
        const admins = await Admin.find({});

        res.status(200).json({
            status: 'success',
            data: { admins },
        });
    },
);
