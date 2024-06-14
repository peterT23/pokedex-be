//  Middleware to validate request body with Joi schema
// */

const validateSchema = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);
    if (error) {
      error.statusCode = 400;
      return next(error);
    }
    req[`validated${property.charAt(0).toUpperCase() + property.slice(1)}`] =
      value;
    next();
  };
};

module.exports = validateSchema;
