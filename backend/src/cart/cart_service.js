import { ValidationError } from '../shared/errors.js';

// Cart business logic
export class CartService {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  // Get all items in cart session
  async getCartItems(cartSessionId) {
    return await this.cartRepository.fetchCartItems(cartSessionId);
  }

  // Add item or increment quantity
  async addItem(cartSessionId, data) {
    const { menu_item_id: menuItemId, dressing_id: dressingId, quantity = 1, item_notes: itemNotes = '' } = data;

    if (!menuItemId) throw new ValidationError('ไม่พบรหัสสินค้า');
    if (quantity < 1 || quantity > 99) throw new ValidationError('จำนวนสินค้าไม่ถูกต้อง');
    if (itemNotes && itemNotes.length > 200) throw new ValidationError('หมายเหตุยาวเกินไป (สูงสุด 200 ตัวอักษร)');

    const activeDressingId = dressingId || null;
    const existingItem = await this.cartRepository.getExistingItem(cartSessionId, menuItemId, activeDressingId, itemNotes);

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + quantity;
      await this.cartRepository.updateItemQuantity(existingItem.id, updatedQuantity, itemNotes);
    } else {
      await this.cartRepository.addItem(cartSessionId, menuItemId, activeDressingId, quantity, itemNotes);
    }
  }

  // Update item quantity or remove if 0
  async updateItemQuantity(cartSessionId, cartItemId, newQuantity) {
    if (newQuantity !== undefined && (newQuantity < 0 || newQuantity > 99)) {
      throw new ValidationError('จำนวนสินค้าไม่ถูกต้อง');
    }

    if (newQuantity <= 0) {
      await this.cartRepository.removeItem(cartItemId, cartSessionId);
    } else {
      await this.cartRepository.updateItemQuantityWithSession(cartItemId, newQuantity, cartSessionId);
    }
  }

  // Remove item from cart
  async removeItem(cartSessionId, cartItemId) {
    await this.cartRepository.removeItem(cartItemId, cartSessionId);
  }

  // Clear all items in cart
  async clearCart(cartSessionId) {
    await this.cartRepository.clearCart(cartSessionId);
  }
}
