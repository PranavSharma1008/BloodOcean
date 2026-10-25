const GENERIC_ERROR = 'Request could not be completed';

const sendError = (res, error, defaultStatus = 500) => {
  if (error && process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (error?.code === 11000) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  return res.status(defaultStatus).json({ message: GENERIC_ERROR });
};

module.exports = sendError;
