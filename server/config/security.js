const validateEnv = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const insecureSecrets = [
    'replace_with_a_random_32_plus_character_secret',
    'your_jwt_secret',
    'secret',
    '12345678',
    'admin123',
    'password123',
    'jwt_secret',
  ];

  if (insecureSecrets.includes(process.env.JWT_SECRET)) {
    console.error('Insecure default JWT_SECRET detected. Please provide a strong, random secret.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    console.error('FRONTEND_URL is required in production');
    process.exit(1);
  }
};

const getAllowedOrigins = () => {
  const fromEnv = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') {
    return fromEnv;
  }

  return [...new Set(['http://localhost:5173', 'http://localhost:3000', ...fromEnv])];
};

module.exports = { validateEnv, getAllowedOrigins };
