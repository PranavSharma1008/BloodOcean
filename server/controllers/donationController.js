const Donation = require('../models/Donation');
const sendError = require('../utils/sendError');

const BADGE_THRESHOLDS = [
  { level: 'Diamond', min: 50 },
  { level: 'Platinum', min: 25 },
  { level: 'Gold', min: 10 },
  { level: 'Silver', min: 5 },
  { level: 'Bronze', min: 1 },
];

const getBadge = (count) => {
  for (const badge of BADGE_THRESHOLDS) {
    if (count >= badge.min) return badge.level;
  }
  return null;
};

const createDonation = async (req, res) => {
  try {
    const { recipientName, bloodGroup, hospital, units, donationDate, notes, image, memoryStory, requestId } = req.body;

    if (!bloodGroup) {
      return res.status(400).json({ message: 'Blood group is required' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const parsedDonationDate = new Date(req.body.donationDate || Date.now());
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (parsedDonationDate > now) {
      return res.status(400).json({ message: 'Donation date cannot be in the future' });
    }

    const donation = await Donation.create({
      donor: req.user.id,
      recipientName: recipientName || '',
      bloodGroup,
      hospital: hospital || '',
      units: units || 1,
      donationDate: parsedDonationDate,
      notes: notes || '',
      image: image || '',
      memoryStory: memoryStory || '',
      requestId: requestId || undefined,
    });

    const count = await Donation.countDocuments({ donor: req.user.id });
    const badge = getBadge(count);

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      donation,
      totalDonations: count,
      badge,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .sort({ donationDate: -1 });

    const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);
    const badge = getBadge(donations.length);

    res.status(200).json({
      success: true,
      count: donations.length,
      totalUnits,
      badge,
      donations,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this donation' });
    }

    res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this donation' });
    }

    await Donation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully',
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }

    const { recipientName, bloodGroup, hospital, units, donationDate, notes, image, memoryStory } = req.body;

    if (bloodGroup) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({ message: 'Invalid blood group' });
      }
      donation.bloodGroup = bloodGroup;
    }

    if (donationDate) {
      const parsedDate = new Date(donationDate);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      if (parsedDate > now) {
        return res.status(400).json({ message: 'Donation date cannot be in the future' });
      }
      donation.donationDate = parsedDate;
    }

    if (recipientName !== undefined) donation.recipientName = recipientName;
    if (hospital !== undefined) donation.hospital = hospital;
    if (units !== undefined) donation.units = Math.max(1, parseInt(units) || 1);
    if (notes !== undefined) donation.notes = notes;
    if (image !== undefined) donation.image = image;
    if (memoryStory !== undefined) donation.memoryStory = memoryStory;

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      donation,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
};
