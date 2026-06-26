const User = require('../models/User');
const formatUser = require('../utils/formatUser');

// @desc    Update user location
// @route   PUT /api/users/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validation
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Latitude and longitude must be numbers' });
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateLocation,
};
