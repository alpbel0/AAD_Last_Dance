import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { AlertService } from '../../services/alert.service';
import { Product } from '../../models/product.model';
import { Review } from '../../models/review.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})   
export class ProductDetailComponent implements OnInit {
  @ViewChild('errorTemplate') errorTemplate!: TemplateRef<any>;

  product: Product | null = null;
  reviews: Review[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  isLoggedIn: boolean = false;
  reviewForm: FormGroup;
  currentUserId: number | null = null;
  hasReviewed: boolean = false;
  userReview: Review | null = null;
  //isAdmin: boolean;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private cartService: CartService,
    private alertService: AlertService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize the form immediately
    this.reviewForm = this.createReviewForm();
  }

  // Create a separate method for form creation for better organization
  private createReviewForm(): FormGroup {
    return this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Check login status first
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUserId = this.authService.getCurrentUserId();
    
    // Get the product ID from the route
    this.route.paramMap.subscribe(params => {
      const productId = Number(params.get('id'));
      if (!productId) {
        this.error = 'Invalid product ID';
        this.isLoading = false;
        return;
      }
      
      this.loadProduct(productId);
    });
  }

  loadProduct(productId: number): void {
    this.isLoading = true;
    
    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loadReviews(productId);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load product';
        this.isLoading = false;
        this.alertService.error(err.message || 'Failed to load product details');
        this.cdr.detectChanges(); // Make sure changes are detected
      }
    });
  }

  loadReviews(productId: number): void {
    this.reviewService.getProductReviews(productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.isLoading = false;
        
        // Check if the current user has already reviewed this product
        if (this.isLoggedIn && this.currentUserId) {
          const existingReview = this.reviews.find(r => r.userId === this.currentUserId);
          if (existingReview) {
            this.hasReviewed = true;
            this.userReview = existingReview;
            
            // Update form with existing review data
            this.reviewForm.patchValue({
              rating: existingReview.rating,
              comment: existingReview.comment
            });
          }
        }
        
        // Manually trigger change detection after all updates
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.isLoading = false;
        this.cdr.detectChanges(); // Make sure changes are detected
      }
    });
  }

  submitReview(): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to submit a review.');
      return;
    }

    if (this.reviewForm.invalid) {
      this.alertService.error('Please fill all required fields correctly.');
      return;
    }

    if (!this.product?.id) {
      this.alertService.error('Product information is missing.');
      return;
    }

    const reviewData: Review = {
      productId: this.product.id,
      userId: this.currentUserId as number,
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment
    };

    if (this.hasReviewed && this.userReview?.id) {
      // Update existing review
      reviewData.id = this.userReview.id;
      this.reviewService.updateReview(reviewData).subscribe({
        next: (updatedReview) => {
          this.alertService.success('Your review has been updated!');
          this.loadReviews(this.product?.id as number);
        },
        error: (err) => {
          this.alertService.error(err.message || 'Failed to update review');
        }
      });
    } else {
      // Add new review
      this.reviewService.addReview(reviewData).subscribe({
        next: (newReview) => {
          this.alertService.success('Your review has been submitted!');
          this.loadReviews(this.product?.id as number);
        },
        error: (err) => {
          this.alertService.error(err.message || 'Failed to submit review');
        }
      });
    }
  }

  deleteReviewByUserId(userId: number): void {
    const reviewToDelete = this.reviews.find(review => review.userId === userId);

    if (!reviewToDelete?.id) {
        this.alertService.warn('Review not found for the specified user.');
        return;
    }

    // Check if user has permission to delete this review
    const canDelete = this.authService.isAdmin() || userId === this.currentUserId;
    
    if (!canDelete) {
        this.alertService.error('You do not have permission to delete this review.');
        return;
    }

    if (confirm('Are you sure you want to delete this review?')) {
        this.reviewService.deleteReview(reviewToDelete.id).subscribe({
            next: () => {
                this.alertService.success('The review has been deleted successfully.');
                // Update the reviews array to remove the deleted review
                this.reviews = this.reviews.filter(review => review.id !== reviewToDelete.id);
                
                // If the deleted review was the current user's, reset the form
                if (userId === this.currentUserId) {
                    this.hasReviewed = false;
                    this.userReview = null;
                    this.reviewForm.reset({rating: 5, comment: ''});
                }
                
                this.cdr.detectChanges(); // Ensure UI updates
            },
            error: (err) => {
                console.error('Delete review error:', err);
                this.alertService.error(err.message || 'Failed to delete review. Please try again.');
            }
        });
    }
}

  addToCart(): void {
    if (!this.isLoggedIn) {
      this.alertService.warn('Please log in to add items to your cart.');
      return;
    }

    if (!this.product) {
      this.alertService.error('Product information is missing.');
      return;
    }

    if (this.product.stock_quantity < 1) {
      this.alertService.error('This product is out of stock.');
      return;
    }

    this.cartService.addToCart(this.product, 1).subscribe({
      next: () => {
        this.alertService.success(`${this.product?.name} added to your cart.`);
      },
      error: (err) => {
        this.alertService.error(err.message || 'Failed to add product to cart.');
      }
    });
  }

    // Helper method to check if the user is an admin
    isAdminUser(): boolean {
        return this.authService.isAdmin();
    }


  // Helper method for star ratings display
  createStarArray(rating: number): number[] {
    // Create array of 5 elements and fill with either 1 (filled star) or 0 (empty star)
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
}