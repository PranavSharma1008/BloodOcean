const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Strip HTML tags, script/style blocks, event handlers, and dangerous URI schemes to prevent XSS
const stripHtml = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags and contents
    .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
    .replace(/javascript\s*:/gi, '') // Strip javascript: URIs
    .replace(/vbscript\s*:/gi, '') // Strip vbscript: URIs
    .replace(/data\s*:\s*text\/html/gi, '') // Strip data:text/html
    .replace(/on\w+\s*=/gi, ''); // Strip inline event handlers like onerror=, onload=
};

// Check if string is a legitimate base64 image data URI or clean external URL
const isSafeImageString = (val) => {
  if (typeof val !== 'string') return false;
  if (val.trim() === '') return true;
  return (
    /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(val.trim()) ||
    /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(val.trim())
  );
};

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return stripHtml(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const rawKeys = Object.keys(value);
    const cleaned = {};

    for (const rawKey of rawKeys) {
      const nested = value[rawKey];
      const key = rawKey.trim();

      // Block prototype pollution, MongoDB query operators ($), and dot-notation keys
      if (DANGEROUS_KEYS.has(key) || key.startsWith('$') || key.includes('.')) {
        continue;
      }

      // Safe handling of avatar and image fields (prevent object/operator injection)
      if (key === 'avatar' || key === 'image') {
        if (typeof nested === 'string' && isSafeImageString(nested)) {
          cleaned[key] = nested.trim();
        } else if (nested === null || nested === '') {
          cleaned[key] = '';
        }
        // If nested is an object, array, or unsafe string, discard it completely
        continue;
      }

      const cleanedNested = sanitizeValue(nested);
      if (cleanedNested !== undefined) {
        cleaned[key] = cleanedNested;
      }
    }

    // If the original object had keys but all were stripped (e.g. { $ne: null }), drop the object
    if (rawKeys.length > 0 && Object.keys(cleaned).length === 0) {
      return undefined;
    }

    return cleaned;
  }

  return value;
};

const sanitizeRequest = (req, _res, next) => {
  if (req.body) req.body = sanitizeValue(req.body) || {};
  if (req.query) req.query = sanitizeValue(req.query) || {};
  if (req.params) req.params = sanitizeValue(req.params) || {};
  next();
};

module.exports = sanitizeRequest;
