import { ValidationError } from '../errors.js';

// Zod input validation middleware
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsedData = schema.parse(dataToValidate);
      req[source] = parsedData;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map(e => e.message).join(', ');
        return next(new ValidationError(errorMessages));
      }
      next(error);
    }
  };
};
