const Camp = require('../models/Camp');

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
    const campData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const camp = await Camp.create(campData);
    const populatedCamp = await Camp.findById(camp._id).populate('createdBy', 'name email');
    
    res.status(201).json(populatedCamp);
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
    
    const updatedCamp = await Camp.findByIdAndUpdate(
      req.params.id,
      req.body,
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
