const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bloodGroup: user.bloodGroup,
  city: user.city,
  state: user.state,
  district: user.district,
  age: user.age,
  gender: user.gender,
  religion: user.religion,
  disease: user.disease,
  unitsCanDonate: user.unitsCanDonate,
  bloodCharges: user.bloodCharges,
  available: user.available,
  profileCompleted: user.profileCompleted,
  role: user.role,
  location: user.location,
  avatar: user.avatar,
});

module.exports = formatUser;
