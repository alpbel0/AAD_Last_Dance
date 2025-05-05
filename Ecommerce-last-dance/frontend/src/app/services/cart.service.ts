import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { CartItem, Cart } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8080/api/cart';
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router
  ) {
    // Only load cart if user is logged in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadCart();
      } else {
        // Clear cart when user logs out
        this.cartItems = [];
        this.cartSubject.next([]);
      }
    });
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  isLoading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  loadCart(): void {
    // Skip loading if not authenticated
    if (!this.authService.isLoggedIn()) {
      console.log('User not logged in, skipping cart load');
      return;
    }

    this.loadingSubject.next(true);
    this.http.get<Cart>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error loading cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error('Failed to load cart. Please try again later.'));
      })
    ).subscribe({
      next: (cart) => {
        this.cartItems = cart.cartItems || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.loadingSubject.next(false);
      }
    });
  }

  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    // Validate authentication first
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return throwError(() => new Error('Please log in to add items to your cart'));
    }

    this.loadingSubject.next(true);
    return this.http.post<Cart>(`${this.apiUrl}/items`, { productId: product.id, quantity }).pipe(
      tap(cart => {
        this.cartItems = cart.cartItems || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error adding to cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error(error.error?.error || 'Failed to add item to cart. Please try again.'));
      })
    );
  }

  removeFromCart(productId: number): Observable<Cart> {
    this.loadingSubject.next(true);
    return this.http.delete<Cart>(`${this.apiUrl}/items/${productId}`).pipe(
      tap(cart => {
        this.cartItems = cart.cartItems || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error removing from cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error('Failed to remove item from cart. Please try again.'));
      })
    );
  }

  updateQuantity(productId: number, quantity: number): Observable<Cart> {
    this.loadingSubject.next(true);
    return this.http.put<Cart>(`${this.apiUrl}/items/${productId}`, { quantity }).pipe(
      tap(cart => {
        this.cartItems = cart.cartItems || [];
        this.cartSubject.next([...this.cartItems]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error updating quantity:', error);
        this.handleAuthError(error);
        return throwError(() => new Error(error.error?.error || 'Failed to update quantity. Please try again.'));
      })
    );
  }

  clearCart(): Observable<Cart> {
    this.loadingSubject.next(true);
    return this.http.delete<Cart>(this.apiUrl).pipe(
      tap(cart => {
        this.cartItems = [];
        this.cartSubject.next([]);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Error clearing cart:', error);
        this.handleAuthError(error);
        return throwError(() => new Error('Failed to clear cart. Please try again.'));
      })
    );
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }
  
  // Helper method to handle authentication errors
  private handleAuthError(error: HttpErrorResponse): void {
    if (error.status === 401 || error.status === 403) {
      console.log('Authentication error, redirecting to login');
      this.authService.logout(); // Clear current auth state
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }
}