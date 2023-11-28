const Occupation = require('../models/occupationModel');
const { catchAsync } = require('../utils/utils');

exports.getOwnOccupations = catchAsync(async (req, res) => {
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
});
