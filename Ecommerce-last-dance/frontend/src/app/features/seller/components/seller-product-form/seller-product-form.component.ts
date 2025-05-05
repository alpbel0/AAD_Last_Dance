import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="product-form-container">
      <h3>{{ isEditMode ? 'Edit Product' : 'Create New Product' }}</h3>
      
      <div *ngIf="loading" class="loading">Loading...</div>
      
      <div *ngIf="error" class="error">
        {{ error }}
      </div>
      
      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" *ngIf="!loading">
        <div class="form-group">
          <label for="name">Product Name</label>
          <input type="text" id="name" formControlName="name" placeholder="Enter product name">
          <div *ngIf="submitted && f['name'].errors" class="validation-error">
            <div *ngIf="f['name'].errors['required']">Product name is required</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" formControlName="description" rows="4" 
                    placeholder="Enter product description"></textarea>
        </div>
        
        <div class="form-group">
          <label for="price">Price ($)</label>
          <input type="number" id="price" formControlName="price" min="0" step="0.01">
          <div *ngIf="submitted && f['price'].errors" class="validation-error">
            <div *ngIf="f['price'].errors['required']">Price is required</div>
            <div *ngIf="f['price'].errors['min']">Price must be greater than or equal to 0</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="stock_quantity">Stock Quantity</label>
          <input type="number" id="stock_quantity" formControlName="stock_quantity" min="0" step="1">
          <div *ngIf="submitted && f['stock_quantity'].errors" class="validation-error">
            <div *ngIf="f['stock_quantity'].errors['required']">Stock quantity is required</div>
            <div *ngIf="f['stock_quantity'].errors['min']">Stock quantity must be greater than or equal to 0</div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="image_url">Image URL</label>
          <input type="text" id="image_url" formControlName="image_url" placeholder="Enter image URL">
        </div>
        
        <div class="form-group">
          <label for="category_id">Category</label>
          <select id="category_id" formControlName="category_id">
            <option [value]="null">-- Select Category --</option>
            <option *ngFor="let category of categories" [value]="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="button" (click)="goBack()" class="cancel-btn">Cancel</button>
          <button type="submit" class="save-btn" [disabled]="saving">
            {{ saving ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .product-form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    input, textarea, select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    .validation-error {
      color: #f44336;
      font-size: 14px;
      margin-top: 5px;
    }
    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }
    .cancel-btn, .save-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    .cancel-btn {
      background-color: #f5f5f5;
      color: #333;
    }
    .save-btn {
      background-color: #4CAF50;
      color: white;
    }
    .save-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .loading, .error {
      margin: 20px 0;
      padding: 15px;
      text-align: center;
    }
    .error {
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
    }
  `]
})
export class SellerProductFormComponent implements OnInit {
  productForm!: FormGroup;
  categories: Category[] = [];
  isEditMode: boolean = false;
  productId?: number;
  loading: boolean = false;
  saving: boolean = false;
  submitted: boolean = false;
  error: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        this.loadProduct(this.productId);
      }
    });
  }
  
  // Convenience getter for easy access to form fields
  get f() { return this.productForm.controls; }
  
  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock_quantity: [0, [Validators.required, Validators.min(0)]],
      image_url: [''],
      category_id: [null]
    });
  }
  
  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        this.error = 'Failed to load categories';
        console.error(err);
      }
    });
  }
  
  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.populateForm(product);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load product';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  populateForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category_id: product.category?.id || null
    });
  }
  
  onSubmit(): void {
    this.submitted = true;
    
    if (this.productForm.invalid) {
      return;
    }
    
    this.saving = true;
    
    const product: Product = {
      ...this.productForm.value,
      id: this.isEditMode ? this.productId : undefined
    };
    
    if (this.isEditMode) {
      this.updateProduct(product);
    } else {
      this.createProduct(product);
    }
  }
  
  createProduct(product: Product): void {
    console.log('Creating product with data:', product);
    this.productService.createProduct(product).subscribe({
      next: (createdProduct) => {
        console.log('Product created successfully:', createdProduct);
        this.saving = false;
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        console.error('Error details:', err);
        // Extract the detailed error message if available
        const errorMessage = err.error?.message || err.error?.error || err.message || 'Failed to create product';
        this.error = errorMessage;
        this.saving = false;
      }
    });
  }
  
  updateProduct(product: Product): void {
    console.log('Updating product with data:', product);
    this.productService.updateProduct(product).subscribe({
      next: (updatedProduct) => {
        console.log('Product updated successfully:', updatedProduct);
        this.saving = false;
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        console.error('Error details:', err);
        // Extract the detailed error message if available
        const errorMessage = err.error?.message || err.error?.error || err.message || 'Failed to update product';
        this.error = errorMessage;
        this.saving = false;
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/seller/products']);
  }
}