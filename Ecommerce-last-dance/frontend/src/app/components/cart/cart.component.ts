import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item.model';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service'; // Import AlertService

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, CartItemComponent]
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  isLoading: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService // Inject AlertService
  ) { }

  ngOnInit(): void {
    // First check authentication state
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      
      if (this.isLoggedIn) {
        this.loadCartItems();
      }
    });
    
    this.trackLoadingState();
  }

  trackLoadingState(): void {
    this.cartService.isLoading().subscribe(loading => {
      this.isLoading = loading;
    });
  }

  loadCartItems(): void {
    if (!this.isLoggedIn) {
      return;
    }
    
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  removeFromCart(productId: number | undefined): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to modify your cart.'); // Use AlertService
      this.router.navigate(['/login']);
      return;
    }

    if (productId !== undefined) {
      const itemToRemove = this.cartItems.find(item => item.product.id === productId);
      this.cartService.removeFromCart(productId).subscribe({
        next: () => {
          // Cart updated successfully (handled by service)
          if (itemToRemove) {
            this.alertService.success(`'${itemToRemove.product.name}' removed from cart.`); // Use AlertService
          }
        },
        error: (error) => {
          console.error('Error removing item:', error);
          const message = error?.error?.message || error?.message || 'Failed to remove item. Please try again.';
          this.alertService.error(message); // Use AlertService
        }
      });
    }
  }

  updateQuantity(productId: number | undefined, quantity: number): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to modify your cart.'); // Use AlertService
      this.router.navigate(['/login']);
      return;
    }

    if (productId !== undefined) {
      if (quantity > 0) {
        const itemToUpdate = this.cartItems.find(item => item.product.id === productId);
        this.cartService.updateQuantity(productId, quantity).subscribe({
          next: () => {
            // Cart updated successfully (handled by service)
            if (itemToUpdate) {
              this.alertService.success(`Quantity for '${itemToUpdate.product.name}' updated to ${quantity}.`); // Use AlertService
            }
          },
          error: (error) => {
            console.error('Error updating quantity:', error);
            const message = error?.error?.message || error?.message || 'Failed to update quantity. Please try again.';
            this.alertService.error(message); // Use AlertService
          }
        });
      } else {
        // Quantity is 0 or less, treat as removal
        this.removeFromCart(productId);
      }
    }
  }

  clearCart(): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to clear your cart.'); // Use AlertService
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.clearCart().subscribe({
      next: () => {
        // Cart cleared successfully (handled by service)
        this.alertService.success('Cart cleared successfully.'); // Use AlertService
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
        const message = error?.error?.message || error?.message || 'Failed to clear cart. Please try again.';
        this.alertService.error(message); // Use AlertService
      }
    });
  }
  
  goToLogin(): void {
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: this.router.url } 
    });
  }
}
