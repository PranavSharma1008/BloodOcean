const Camp = require('../models/Camp');
const User = require('../models/User');
const Notification = require('../models/Notification');

const normalizeDate = (dateValue, endOfDay = false) => {
  const date = new Date(dateValue);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

const validateCampDates = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = normalizeDate(startDate, false);
  const end = normalizeDate(endDate, true);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date format';
  }

  if (start < today) {
    return 'Start date cannot be in the past';
  }

  if (end < start) {
    return 'End date cannot be earlier than start date';
  }

  return null;
};

// @desc    Get all camps
// @route   GET /api/camps
// @access  Private
const getAllCamps = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const camps = await Camp.find({
      $or: [
        { endDate: { $gte: today } },
        { date: { $gte: today }, endDate: { $exists: false } },
      ],
    })
      .populate('createdBy', 'name email')
      .sort({ startDate: 1, date: 1, createdAt: -1 });
    res.status(200).json(camps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new camp
// @route   POST /api/camps
// @access  Private
const createCamp = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const validationError = validateCampDates(startDate, endDate);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const organizer = await User.findById(req.user.id).select('location');
    const organizerLocation = organizer?.location?.coordinates && organizer.location.coordinates[0] !== 0 && organizer.location.coordinates[1] !== 0
      ? organizer.location
      : null;

    const campData = {
      ...req.body,
      createdBy: req.user.id,
      location: organizerLocation || { type: 'Point', coordinates: [0, 0] },
      startDate: normalizeDate(req.body.startDate, false),
      endDate: normalizeDate(req.body.endDate, true),
    };

    const camp = await Camp.create(campData);
    const populatedCamp = await Camp.findById(camp._id).populate('createdBy', 'name email');

    let notifiedCount = 0;
    if (organizerLocation) {
      const searchRadiusKm = 100;
      const matchingUsers = await User.find({
        _id: { $ne: req.user.id },
        profileCompleted: true,
        location: {
          $nearSphere: {
            $geometry: organizerLocation,
            $maxDistance: searchRadiusKm * 1000,
          },
        },
      }).select('_id name');

      notifiedCount = matchingUsers.length;
      const notificationMessage = `New blood donation camp "${camp.campName}" organized near you in ${camp.city || camp.district || camp.state}. Please join if you can.`;

      const notificationPromises = matchingUsers.map((donor) => {
        return Notification.create({
          donorId: donor._id,
          campId: camp._id,
          type: 'camp',
          message: notificationMessage,
          status: 'unread',
        });
      });
      await Promise.all(notificationPromises);
    }

    const responsePayload = { populatedCamp, notifiedCount };
    if (!organizerLocation) {
      responsePayload.warning = 'Camp created, but notifications were not sent because the organizer location is unavailable.';
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single camp
// @route   GET /api/camps/:id
// @access  Private
const getCampById = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }
    
    res.status(200).json(camp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a camp
// @route   PUT /api/camps/:id
// @access  Private
const updateCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);
    
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }
    
    // Check if user is the creator
    if (camp.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this camp' });
    }

    const startDate = req.body.startDate || camp.startDate;
    const endDate = req.body.endDate || camp.endDate;
    const validationError = validateCampDates(startDate, endDate);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    
    const updateData = {
      ...req.body,
      startDate: normalizeDate(startDate, false),
      endDate: normalizeDate(endDate, true),
    };

    const updatedCamp = await Camp.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.status(200).json(updatedCamp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a camp
// @route   DELETE /api/camps/:id
// @access  Private
const deleteCamp = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);
    
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }
    
    // Check if user is the creator
    if (camp.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this camp' });
    }
    
    await Camp.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Camp deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCamps,
  createCamp,
  getCampById,
  updateCamp,
  deleteCamp,
};
