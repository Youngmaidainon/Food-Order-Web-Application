import { ValidationError } from '../errors.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsedData = schema.parse(dataToValidate);
      req[source] = parsedData; // Replace with validated/transformed data
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        // Map Zod errors to our ValidationError
        const errorMessages = error.errors.map(e => e.message).join(', ');
        return next(new ValidationError(errorMessages));
      }
      next(error);
    }
  };
};
