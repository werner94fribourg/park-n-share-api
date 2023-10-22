/**
 * Functions used to handle the authentication in the API
 * @module authController
 */

const { Request, Response, NextFunction } = require('express');
const User = require('../models/userModel');
// const APIFeatures = require('../utils/classes/APIFeatures');
const AppError = require('../utils/classes/AppError');
const { catchAsync } = require('../utils/utils');
const {user} = require("express/lib/request");
const { unlink } = require('fs');
const path = require('path');
const { promisify } = require('util');
const { USERS_FOLDER } = require('../utils/globals');


exports.getAllUsers = (Model = User, filterOptions = { role: { $ne: 'admin' }, _id: { $ne: user.id } }) =>

    catchAsync(async (req, res, next) => {
        const filter = filterOptions || {};

        const { query } = req;
        // const features = new APIFeatures(Model, query);

        const collectionName = Model.collection.collectionName.toLowerCase();
        // COMPARISON
        // try {
        //     const dbQuery = (
        //         await features
        //             .build(filter)
        //             //SORTING
        //             .sort()
        //             //FIELD SELECTION
        //             .limitFields()
        //             //PAGINATION
        //             .paginate()
        //     ).getQuery();
        //
        //     // QUERY EXECUTION
        //     // const docs = await dbQuery.explain();
        //     const docs = await dbQuery;
        //
        //     res
        //         .status(200)
        //         .json({ status: 'success', data: { [collectionName]: docs } });
        // } catch (err) {
        //     if (err.message === "This page doesn't exist.") {
        //         next(new AppError(err.message, 404));
        //     }
        // }
    });

exports.getUser = () =>
    catchAsync(async (req, res) => {
    const { document, collectionName } = req;

    res
        .status(200)
        .json({ status: 'success', data: { [collectionName]: document } });
});

exports.queryUser = (Model = User, filterOptions = { role: { $ne: 'admin' } }, popOptions, selectOptions) =>
    catchAsync(async (req, res, next) => {
        const {
            params: { id },
        } = req;

        let query = Model.findOne({ _id: id, ...filterOptions });
        if (selectOptions) query = query.select(selectOptions);
        if (popOptions) query = query.populate(popOptions);

        const document = await query;
        const collectionName = Model.collection.collectionName
            .toLowerCase()
            .slice(0, -1);

        if (!document) {
            next(new AppError(`No ${collectionName} found with that ID.`, 404));
            return;
        }
        req.document = document;
        req.collectionName = collectionName;
        next();
    });

exports.deleteUser = (Model = User) =>
    catchAsync(async (req, res) => {
        const { document, collectionName } = req;

        if (collectionName === 'user' && document.photo !== 'default') {
            await promisify(unlink)(
                path.join(__dirname, `../../${USERS_FOLDER}/${document.photo}`)
            );
        }

        await Model.findByIdAndDelete(document._id);

        // Delete operation : it is a practice to not send anything back when we are deleting an element from a Rest API
        res.status(204).json({
            status: 'success',
        });
    });

exports.updateUser = (Model = User) =>
    catchAsync(async (req, res) => {
        const { document, collectionName, body, file } = req;

        if (file && collectionName === 'user') {
            const { success, data } = await upload({
                containerName: 'public',
                fileName: file.filename,
                filePath: `./${USERS_FOLDER}/${file.filename}`,
                useConnectionString: true,
                connectionString: process.env.AZURE_CONNECTION_STRING,
                accountName: process.env.AZURE_ACCOUNT_NAME,
            });
            if (success) body.photo = data.url;
        }

        const updatedDocument = await Model.findByIdAndUpdate(document._id, body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
            data: { [collectionName]: updatedDocument },
        });
    });

exports.createUser = (_, res) => {
    res
        .status(500)
        .json({ status: 'error', message: 'Please use /signup instead.' });
};

exports.createOne = Model =>
    catchAsync(async (req, res) => {
        const { body } = req;
        const collectionName = Model.collection.collectionName
            .toLowerCase()
            .slice(0, -1);
        const newDoc = await Model.create(body);
        res.status(201).json({
            status: 'success',
            data: { [collectionName]: newDoc },
        });
    });