const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bloodGroup: user.bloodGroup,
  city: user.city,
  state: user.state,
  district: user.district,
  available: user.available,
  profileCompleted: user.profileCompleted,
  role: user.role,
  location: user.location,
});

module.exports = formatUser;
