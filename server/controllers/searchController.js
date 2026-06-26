const User = require('../models/User');
const { getDistricts } = require('../data/locations');

// @desc    Search nearby donors
// @route   GET /api/donors/nearby
// @access  Private
const searchNearbyDonors = async (req, res) => {
  try {
    const { bloodGroup, radius, state, district, name } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({ message: 'Blood group is required' });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    if (!state || !district) {
      return res.status(400).json({ message: 'State and district are required' });
    }

    const validDistricts = getDistricts(state);
    if (!validDistricts.includes(district)) {
      return res.status(400).json({ message: 'Invalid district for selected state' });
    }

    const validRadii = [5, 10, 20, 50];
    const searchRadius = radius ? parseInt(radius) : 10;
    if (!validRadii.includes(searchRadius)) {
      return res.status(400).json({ message: 'Invalid radius. Must be 5, 10, 20, or 50 km' });
    }

    const currentUser = await User.findById(req.user.id);
    const hasGps =
      currentUser?.location &&
      currentUser.location.coordinates[0] !== 0 &&
      currentUser.location.coordinates[1] !== 0;

    const query = {
      _id: { $ne: req.user.id },
      bloodGroup,
      available: true,
      profileCompleted: true,
      $or: [
        { state, district },
        { city: { $regex: new RegExp(`^${district}$`, 'i') } },
      ],
    };

    if (name && name.trim()) {
      query.name = { $regex: name.trim(), $options: 'i' };
    }

    let donors = await User.find(query).select(
      'name bloodGroup phone city state district location available'
    );

    if (hasGps) {
      donors = donors
        .map((donor) => {
          const hasDonorGps =
            donor.location?.coordinates &&
            donor.location.coordinates[0] !== 0 &&
            donor.location.coordinates[1] !== 0;

          const distance = hasDonorGps
            ? calculateDistance(
                currentUser.location.coordinates[1],
                currentUser.location.coordinates[0],
                donor.location.coordinates[1],
                donor.location.coordinates[0]
              )
            : null;

          return { donor, distance };
        })
        .filter(({ distance }) => distance === null || distance <= searchRadius)
        .sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
        .map(({ donor, distance }) => ({
          id: donor._id,
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          phone: donor.phone,
          city: donor.city || donor.district,
          state: donor.state,
          district: donor.district,
          available: donor.available,
          distance: distance !== null ? distance.toFixed(2) : 'N/A',
        }));
    } else {
      donors = donors.map((donor) => ({
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        phone: donor.phone,
        city: donor.city || donor.district,
        state: donor.state,
        district: donor.district,
        available: donor.available,
        distance: 'N/A',
      }));
    }

    res.status(200).json({
      success: true,
      count: donors.length,
      donors,
      searchRadius,
      bloodGroup,
      state,
      district,
      name: name?.trim() || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  searchNearbyDonors,
};
