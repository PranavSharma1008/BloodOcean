const User = require('../models/User');
const formatUser = require('../utils/formatUser');
const sendError = require('../utils/sendError');

// @desc    Update user location
// @route   PUT /api/users/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ message: 'Latitude must be between -90 and 90' });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Longitude must be between -180 and 180' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update location (GeoJSON format: [longitude, latitude])
    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      user: formatUser(user),
      location: {
        latitude,
        longitude,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  updateLocation,
};
