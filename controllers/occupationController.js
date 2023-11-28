const Occupation = require('../models/occupationModel');
const { catchAsync } = require('../utils/utils');

exports.getOwnOccupations = catchAsync(
  /**
   * Function used to get all parking occupations of the connected user.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   */
  async (req, res) => {
    const {
      user: { _id },
    } = req;

    const occupations = await Occupation.find({ client: _id }).populate([
      {
        path: 'client',
        select: '_id username email',
      },
      {
        path: 'parking',
        select: '_id name',
      },
    ]);

    res.status(200).json({ status: 'success', data: { occupations } });
  },
);
