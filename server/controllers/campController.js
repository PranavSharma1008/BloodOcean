const Camp = require('../models/Camp');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendError = require('../utils/sendError');

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
    return sendError(res, error);
  }
};

// @desc    Create a new camp
// @route   POST /api/camps
// @access  Private
const createCamp = async (req, res) => {
  try {
    const { startDate, endDate, contactNumber, contactNumber: rawPhone } = req.body;
    const validationError = validateCampDates(startDate, endDate);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const phoneDigits = (contactNumber || rawPhone || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) {
      return res.status(400).json({ message: 'Contact number must be exactly 10 digits' });
    }

    const organizer = await User.findById(req.user.id).select('location');
    const organizerLocation = organizer?.location?.coordinates && organizer.location.coordinates[0] !== 0 && organizer.location.coordinates[1] !== 0
      ? organizer.location
      : null;

    const campData = {
      campName: req.body.campName,
      organizerName: req.body.organizerName,
      state: req.body.state,
      district: req.body.district,
      city: req.body.city,
      address: req.body.address,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      time: req.body.time,
      contactNumber: phoneDigits,
      description: req.body.description,
      radius: Math.min(Math.max(Number(req.body.radius) || 100, 1), 500),
      createdBy: req.user.id,
      location: organizerLocation || { type: 'Point', coordinates: [0, 0] },
      startDate: normalizeDate(req.body.startDate, false),
      endDate: normalizeDate(req.body.endDate, true),
    };

    const camp = await Camp.create(campData);
    const populatedCamp = await Camp.findById(camp._id).populate('createdBy', 'name email');

    let notifiedCount = 0;
    const searchRadiusKm = Math.min(Math.max(Number(req.body.radius) || 100, 1), 500);
    if (organizerLocation) {
      const io = require('../sockets/tracking').getIO();
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

      // create notifications and emit real-time socket events for online users
      const notificationPromises = matchingUsers.map(async (donor) => {
        const n = await Notification.create({
          donorId: donor._id,
          campId: camp._id,
          type: 'camp',
          message: notificationMessage,
          status: 'unread',
        });
        try {
          if (io) {
            io.to(`user:${donor._id}`).emit('new_notification', {
              notificationId: n._id,
              type: 'camp',
              message: notificationMessage,
              campId: camp._id,
              createdAt: n.createdAt,
            });
          }
        } catch (emitErr) {
          // ignore socket emit errors
          console.log('[camp] emit error:', emitErr.message);
        }
        return n;
      });
      await Promise.all(notificationPromises);
    }

    const responsePayload = { populatedCamp, notifiedCount, radius: searchRadiusKm };
    if (!organizerLocation) {
      responsePayload.warning = 'Camp created, but notifications were not sent because the organizer location is unavailable.';
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    return sendError(res, error);
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
    return sendError(res, error);
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
    
    // Check if user is the creator or admin
    const requestUser = await User.findById(req.user.id).select('role');
    if (camp.createdBy.toString() !== req.user.id && requestUser?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this camp' });
    }

    const startDate = req.body.startDate || camp.startDate;
    const endDate = req.body.endDate || camp.endDate;
    const validationError = validateCampDates(startDate, endDate);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    
    const allowedFields = [
      'campName',
      'organizerName',
      'state',
      'district',
      'city',
      'address',
      'startTime',
      'endTime',
      'time',
      'contactNumber',
      'description',
      'radius',
    ];
    const updateData = {
      startDate: normalizeDate(startDate, false),
      endDate: normalizeDate(endDate, true),
    };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = field === 'radius'
          ? Math.min(Math.max(Number(req.body.radius) || 100, 1), 500)
          : req.body[field];
      }
    }

    if (updateData.contactNumber) {
      const phoneDigits = updateData.contactNumber.replace(/\D/g, '');
      if (!/^\d{10}$/.test(phoneDigits)) {
        return res.status(400).json({ message: 'Contact number must be exactly 10 digits' });
      }
    }

    const updatedCamp = await Camp.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.status(200).json(updatedCamp);
  } catch (error) {
    return sendError(res, error);
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
    
    // Check if user is the creator or admin
    const requestUser = await User.findById(req.user.id).select('role');
    if (camp.createdBy.toString() !== req.user.id && requestUser?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this camp' });
    }
    
    await Camp.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Camp deleted successfully' });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllCamps,
  createCamp,
  getCampById,
  updateCamp,
  deleteCamp,
};
