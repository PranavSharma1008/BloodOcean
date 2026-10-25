const sanitizeRequest = require('../middleware/sanitize');

describe('Sanitize Middleware Security Tests', () => {
  const runSanitize = (body, query = {}, params = {}) => {
    const req = { body, query, params };
    const res = {};
    const next = jest.fn();
    sanitizeRequest(req, res, next);
    expect(next).toHaveBeenCalled();
    return req;
  };

  test('should strip dangerous HTML and XSS payloads', () => {
    const input = {
      name: '<script>alert("XSS")</script>John Doe',
      notes: '<img src="x" onerror="alert(1)">Hello World',
      website: 'javascript:alert(document.cookie)',
    };

    const { body } = runSanitize(input);
    expect(body.name).toBe('John Doe');
    expect(body.notes).toBe('Hello World');
    expect(body.website).toBe('alert(document.cookie)');
  });

  test('should strip NoSQL query operator keys starting with $', () => {
    const input = {
      email: { $ne: null },
      password: { $gt: '' },
      validField: 'safe string',
    };

    const { body } = runSanitize(input);
    expect(body.email).toBeUndefined();
    expect(body.password).toBeUndefined();
    expect(body.validField).toBe('safe string');
  });

  test('should strip prototype pollution keys (__proto__, constructor, prototype)', () => {
    const input = {
      __proto__: { isAdmin: true },
      constructor: { hacked: true },
      prototype: { evil: true },
      normalKey: 'safe',
    };

    const { body } = runSanitize(input);
    expect(body.__proto__.isAdmin).toBeUndefined();
    expect(body.constructor.hacked).toBeUndefined();
    expect(body.prototype).toBeUndefined();
    expect(body.normalKey).toBe('safe');
  });

  test('should prevent NoSQL injection via avatar or image fields with objects', () => {
    const input = {
      avatar: { $ne: null },
      image: { $gt: '' },
    };

    const { body } = runSanitize(input);
    expect(body.avatar).toBeUndefined();
    expect(body.image).toBeUndefined();
  });

  test('should allow safe base64 images in avatar', () => {
    const validBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const input = {
      avatar: validBase64,
    };

    const { body } = runSanitize(input);
    expect(body.avatar).toBe(validBase64);
  });

  test('should drop unsafe / script-injected data URIs in avatar', () => {
    const evilDataUri = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
    const input = {
      avatar: evilDataUri,
    };

    const { body } = runSanitize(input);
    expect(body.avatar).toBeUndefined();
  });

  test('should strip dot-notation keys that can tamper with nested document fields', () => {
    const input = {
      'user.role': 'admin',
      'account.isVerified': true,
      safeField: 'valid',
    };

    const { body } = runSanitize(input);
    expect(body['user.role']).toBeUndefined();
    expect(body['account.isVerified']).toBeUndefined();
    expect(body.safeField).toBe('valid');
  });
});
