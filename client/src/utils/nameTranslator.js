// Utility for translating / transliterating user names between English and Hindi

const KNOWN_NAMES = {
  // Common Names & Test Names
  'Pranav': 'प्रणव',
  'Pranav Sharma': 'प्रणव शर्मा',
  'Hero': 'हीरो',
  'Admin': 'एडमिन',
  'Amit': 'अमित',
  'Amit Kumar': 'अमित कुमार',
  'Rahul': 'राहुल',
  'Rahul Verma': 'राहुल वर्मा',
  'Priya': 'प्रिया',
  'Priya Patel': 'प्रिया पटेल',
  'Rohan': 'रोहन',
  'Rohan Gupta': 'रोहन गुप्ता',
  'Vikram': 'विक्रम',
  'Vikram Singh': 'विक्रम सिंह',
  'Sunil': 'सुनील',
  'Suresh': 'सुरेश',
  'Deepak': 'दीपक',
  'Vikas': 'विकास',
  'Anjali': 'अंजली',
  'Manish': 'मनीष',
  'Rajesh': 'राजेश',
  'Kavita': 'कविता',
  'Neha': 'नेहा',
  'Sanjay': 'संजय',
  'Pooja': 'पूजा',
  'Anita': 'अनीता',
  'Vijay': 'विजय',
  'Ramesh': 'रमेश',
  'Dinesh': 'दिनेश',
  'Ashok': 'अशोक',
  'Manoj': 'मनोज',
  'Ajay': 'अजय',
  'Sandeep': 'संदीप',
  'Pankaj': 'पंकज',
  'Alok': 'आलोक',
  'Rakesh': 'राकेश',
  'Sachin': 'सचिन',
  'Sunita': 'सुनीता',
  'Reena': 'रीना',
  'Seema': 'सीमा',
  'Geeta': 'गीता',
  'Sunil Kumar': 'सुनील कुमार',
  'Rajesh Kumar': 'राजेश कुमार',
  'Dr. A. K. Sharma (Red Cross Director)': 'डॉ. ए. के. शर्मा (रेड क्रॉस निदेशक)',
  'Rotary Care Team': 'रोटरी केयर टीम',
  'AIIMS Transfusion Dept': 'एम्स ट्रांसफ्यूजन विभाग',
  'BloodOcean': 'ब्लड ओशन',
  
  // Surnames
  'Sharma': 'शर्मा',
  'Verma': 'वर्मा',
  'Gupta': 'गुप्ता',
  'Kumar': 'कुमार',
  'Singh': 'सिंह',
  'Patel': 'पटेल',
  'Joshi': 'जोशी',
  'Rao': 'राव',
  'Yadav': 'यादव',
  'Mehta': 'मेहता',
  'Jain': 'जैन',
  'Khan': 'खान',
  'Ali': 'अली',
  'Choudhary': 'चौधरी',
  'Chowdhury': 'चौधरी',
  'Mishra': 'मिश्रा',
  'Pandey': 'पांडे',
  'Saini': 'सैनी',
  'Agarwal': 'अग्रवाल',
  'Bhatia': 'भाटिया',
  'Kapoor': 'कपूर',
  'Malhotra': 'मल्होत्रा',
  'Reddy': 'रेड्डी',
  'Nair': 'नायर',
  'Deshmukh': 'देशमुख',
  'Patil': 'पाटिल'
};

/**
 * Phonetic transliterator fallback for Latin script names to Devanagari Hindi
 */
const transliterateWord = (word) => {
  if (!word) return '';
  if (KNOWN_NAMES[word]) return KNOWN_NAMES[word];

  let w = word.trim();
  // Capitalize check
  const isCap = w[0] === w[0].toUpperCase();

  // Rule replacements
  let str = w.toLowerCase();

  // Special consonant patterns
  str = str
    .replace(/ksh/g, 'क्ष')
    .replace(/gya/g, 'ज्ञा')
    .replace(/tr/g, 'त्र')
    .replace(/shr/g, 'श्र')
    .replace(/sh/g, 'श')
    .replace(/ch/g, 'च')
    .replace(/th/g, 'थ')
    .replace(/bh/g, 'भ')
    .replace(/dh/g, 'ध')
    .replace(/kh/g, 'ख')
    .replace(/gh/g, 'घ')
    .replace(/ph/g, 'फ')
    .replace(/jh/g, 'झ');

  // Single consonants & vowels
  const charMap = {
    'a': 'आ', 'b': 'ब', 'c': 'क', 'd': 'द', 'e': 'ए', 'f': 'फ',
    'g': 'ग', 'h': 'ह', 'i': 'इ', 'j': 'ज', 'k': 'क', 'l': 'ल',
    'm': 'म', 'n': 'न', 'o': 'ओ', 'p': 'प', 'q': 'क', 'r': 'र',
    's': 'स', 't': 'त', 'u': 'उ', 'v': 'व', 'w': 'व', 'x': 'क्स',
    'y': 'य', 'z': 'ज़'
  };

  let res = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (charMap[char]) {
      res += charMap[char];
    } else {
      res += char;
    }
  }

  return res;
};

export const getTranslatedName = (name, lang = 'en') => {
  if (!name || typeof name !== 'string') return name || '';
  if (lang !== 'hi') return name;

  const trimmed = name.trim();
  if (KNOWN_NAMES[trimmed]) return KNOWN_NAMES[trimmed];

  // Split multiple words (e.g., "Pranav Sharma") and translate each part
  const parts = trimmed.split(/\s+/);
  const translatedParts = parts.map(part => KNOWN_NAMES[part] || transliterateWord(part));
  return translatedParts.join(' ');
};

export default getTranslatedName;
