import { Product } from './product.model';

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
  addedAt?: string;
  subtotal?: number;
}

export interface Cart {
  id?: number;
  cartItems: CartItem[];
  createdAt?: string;
  updatedAt?: string;
  totalPrice?: number;
}