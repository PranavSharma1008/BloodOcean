const User = require('../models/User');
const formatUser = require('../utils/formatUser');
const sendError = require('../utils/sendError');
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
    return sendError(res, error);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bloodGroup, state, district, city, available, age, gender, religion, disease, unitsCanDonate, bloodCharges } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
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

    if (!city || city.trim() === '') {
      return res.status(400).json({ message: 'City is required' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const validDistricts = getDistricts(state);
    if (!validDistricts.includes(district)) {
      return res.status(400).json({ message: 'Invalid district for selected state' });
    }

    if (age !== undefined && age !== '') {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
        return res.status(400).json({ message: 'Age must be between 18 and 65' });
      }
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
    if (city !== undefined) user.city = city;
    user.available = available !== undefined ? available : user.available;
    user.age = age !== undefined ? (age === '' ? '' : Number(age)) : user.age;
    user.gender = gender !== undefined ? gender : user.gender;
    user.religion = religion !== undefined ? religion : user.religion;
    user.disease = disease !== undefined ? disease : user.disease;
    user.unitsCanDonate = unitsCanDonate !== undefined ? (unitsCanDonate === '' ? 1 : Number(unitsCanDonate)) : user.unitsCanDonate;
    user.bloodCharges = bloodCharges !== undefined ? (bloodCharges === '' ? 0 : Number(bloodCharges)) : user.bloodCharges;

    if (user.disease && user.disease.trim() !== '') {
      user.available = false;
    }

    user.profileCompleted = true;

    await user.save();

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Update user avatar (base64)
// @route   PUT /api/profile/avatar
// @access  Private
const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar data is required' });
    }

    if (typeof avatar !== 'string' || !/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(avatar)) {
      return res.status(400).json({ message: 'Invalid avatar' });
    }

    if (avatar.length > 2 * 1024 * 1024) {
      return res.status(400).json({ message: 'Avatar must be smaller than 2MB' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Remove user avatar
// @route   DELETE /api/profile/avatar
// @access  Private
const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar removed successfully',
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// @desc    Get public user profile
// @route   GET /api/profile/:id
// @access  Private
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email phone bloodGroup city state district age gender religion disease unitsCanDonate available profileCompleted avatar location createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
  getPublicProfile,
};
