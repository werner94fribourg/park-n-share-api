/**
 * Functions related to calling the client resource in the API
 * @module clientController
 */
const { Request, Response, NextFunction } = require('express');
const Client = require('../models/clientModel');
const { catchAsync } = require('../utils/utils');

exports.getAllClients = catchAsync(
    /**
     * Function used to handle the requesting of all existing user resources.
     * @param {Request} req The request object of the Express framework, used to handle the request sent by the client.
     * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
     * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
     */
    async (req, res, next) => {
      const clients = await Client.find({});

      res.status(200).json({
        status: 'success',
        data: { clients },
      });
    },
);
