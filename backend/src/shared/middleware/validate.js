import { ValidationError } from '../errors.js';

// Middleware กรอง Input ขยะหรือ Input โจมตี (Strict Input Validation) ด้วย Zod
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      // แกะและกรองข้อมูล (Sanitization & Validation)
      const parsedData = schema.parse(dataToValidate);
      req[source] = parsedData; // นำข้อมูลที่ปลอดภัยแล้วไปใช้งานต่อ
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        // แปลงข้อผิดพลาด Zod ให้เป็นรูปแบบมาตรฐานของระบบ
        const errorMessages = error.errors.map(e => e.message).join(', ');
        return next(new ValidationError(errorMessages));
      }
      next(error);
    }
  };
};
