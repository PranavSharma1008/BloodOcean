const STATES_AND_DISTRICTS = {
  'Himachal Pradesh': [
    'Bilaspur',
    'Chamba',
    'Hamirpur',
    'Kangra',
    'Kinnaur',
    'Kullu',
    'Lahaul and Spiti',
    'Mandi',
    'Shimla',
    'Sirmaur',
    'Solan',
    'Una',
  ],
};

const getDistricts = (state) => STATES_AND_DISTRICTS[state] || [];

module.exports = { STATES_AND_DISTRICTS, getDistricts };
