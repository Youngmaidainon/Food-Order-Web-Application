import { v4 as uuidv4 } from 'uuid';
import { CartRepository } from './cart_repository.js';

const cartRepository = new CartRepository();

export const ensureCartSessionMiddleware = async (req, res, next) => {
  let cartSessionId = req.cookies.springroll_cart_session;

  try {
    if (!cartSessionId) {
      cartSessionId = uuidv4();
      await cartRepository.createSession(cartSessionId);
      setSessionCookie(res, cartSessionId);
    } else {
      const exists = await cartRepository.ensureSessionExists(cartSessionId);
      if (!exists) {
        cartSessionId = uuidv4();
        await cartRepository.createSession(cartSessionId);
        setSessionCookie(res, cartSessionId);
      }
    }
    req.cartSessionId = cartSessionId;
    next();
  } catch (error) {
    next(error);
  }
};

function setSessionCookie(res, cartSessionId) {
  res.cookie('springroll_cart_session', cartSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
}
