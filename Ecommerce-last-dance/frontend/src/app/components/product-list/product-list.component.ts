import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Category } from '../../models/category.model';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  originalProducts: Product[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private alertService: AlertService // Inject AlertService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    // Subscribe to query parameter changes for search
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.filterProducts(params['search']);
      } else {
        this.loadProducts();
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.originalProducts = [...data];
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  selectCategory(category: Category | null, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    console.log('Selecting category:', category);
    this.selectedCategory = category;
    
    if (category) {
      console.log('Fetching products for category:', category.id);
      this.productService.getProductsByCategory(category.id).subscribe({
        next: (products) => {
          console.log('Products received:', products);
          this.products = products;
        },
        error: (error) => {
          console.error('Error loading products for category:', error);
          // Fallback to all products if there's an error
          this.loadProducts();
        }
      });
    } else {
      console.log('Loading all products');
      this.loadProducts();
    }
  }

  filterProducts(searchQuery: string): void {
    const query = searchQuery.toLowerCase();
    this.products = this.originalProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.description?.toLowerCase().includes(query) ?? false)
    );

    if (this.selectedCategory) {
      this.selectCategory(this.selectedCategory);
    }
  }

  addToCart(product: Product): void {
    if (!product || product.id === undefined) {
      console.error('Cannot add product without ID to cart:', product);
      // Use AlertService for error
      this.alertService.error('Could not add product to cart. Product information is missing.');
      return;
    }

    console.log('Attempting to add product to cart:', product);
    this.cartService.addToCart(product).subscribe({
      next: (cart) => {
        // Use AlertService for success
        this.alertService.success(`'${product.name}' added to cart successfully!`);
      },
      error: (error) => {
        console.error('Error adding product to cart:', error);
        // Use AlertService for error
        const message = error?.error?.message || error?.message || 'Please try again.';
        this.alertService.error(`Failed to add product to cart: ${message}`);
      }
    });
  }
}