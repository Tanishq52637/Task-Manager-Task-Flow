const { validationResult } = require('express-validator');

// run after express-validator checks
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0], // return first error only, cleaner UX
      errors: messages
    });
  }
  next();
};

module.exports = { validate };
