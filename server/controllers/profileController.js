const User = require('../models/User');
const formatUser = require('../utils/formatUser');
const { getDistricts } = require('../data/locations');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bloodGroup, state, district, available } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!bloodGroup || bloodGroup === '') {
      return res.status(400).json({ message: 'Blood group is required' });
    }

    if (!state || state.trim() === '') {
      return res.status(400).json({ message: 'State is required' });
    }

    if (!district || district.trim() === '') {
      return res.status(400).json({ message: 'District is required' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const validDistricts = getDistricts(state);
    if (!validDistricts.includes(district)) {
      return res.status(400).json({ message: 'Invalid district for selected state' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name;
    user.phone = phone;
    user.bloodGroup = bloodGroup;
    user.state = state;
    user.district = district;
    user.city = district;
    user.available = available !== undefined ? available : user.available;
    user.profileCompleted = true;

    await user.save();

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
