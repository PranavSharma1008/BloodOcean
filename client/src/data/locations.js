export const STATES_AND_DISTRICTS = {
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

export const getStates = () => Object.keys(STATES_AND_DISTRICTS);

export const getDistricts = (state) => STATES_AND_DISTRICTS[state] || [];

export const normalizeDistrict = (state, value) => {
  if (!state || !value) return value || '';
  const match = getDistricts(state).find(
    (district) => district.toLowerCase() === value.toLowerCase()
  );
  return match || value;
};
