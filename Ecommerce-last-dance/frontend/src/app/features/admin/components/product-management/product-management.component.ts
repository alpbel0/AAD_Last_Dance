import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="product-management">
      <h2>Product Management</h2>
      <button class="add-button" (click)="createProduct()">Add New Product</button>
      <div class="product-form" *ngIf="editingProduct">
        <h3>{{ editingProduct.id ? 'Edit Product' : 'Create Product' }}</h3>
        <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" formControlName="name">
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description"></textarea>
          </div>
          
          <div class="form-group">
            <label for="price">Price</label>
            <input type="number" id="price" formControlName="price" step="0.01">
          </div>
          
          <div class="form-group">
            <label for="image_url">Image URL</label>
            <input type="text" id="image_url" formControlName="image_url">
          </div>
          
          <div class="form-group">
            <label for="stock_quantity">Stock Quantity</label>
            <input type="number" id="stock_quantity" formControlName="stock_quantity">
          </div>

          <div class="form-group">
            <label for="category_id">Category</label>
            <select id="category_id" formControlName="category_id">
              <option [ngValue]="null">Select a category</option>
              <option *ngFor="let category of categories" [ngValue]="category.id">
                {{category.name}}
              </option>
            </select>
          </div>
          
          <div class="button-group">
            <button type="submit" [disabled]="productForm.invalid || isSaving">Save</button>
            <button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <div class="product-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products">
              <td>{{product.id}}</td>
              <td>{{product.name}}</td>
              <td>{{product.price | currency}}</td>
              <td>{{product.stock_quantity}}</td>
              <td>{{getCategoryName(product.category_id)}}</td>
              <td>
                <button (click)="editProduct(product)">Edit</button>
                <button (click)="deleteProduct(product)" [disabled]="!product.id">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`    
    .product-management {
      width: 100%;
    }
    .product-form {
      background: white;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .form-group textarea {
      height: 100px;
      resize: vertical;
    }
    .button-group {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    .add-button {
      margin-bottom: 20px;
      float: right;
      margin-right: 20px;
      background-color: rgb(23, 222, 123);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    button {
      margin: 0 5px;
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button:first-child {
      background-color: #007bff;
      color: white;
    }
    button:last-child {
      background-color: #dc3545;
      color: white;
    }
    .debug-info {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 8px;
      margin-top: 5px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .debug-controls {
      margin-top: 20px;
    }
    .debug-controls button {
      background-color: #6c757d;
      color: white;
    }
  `]
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  editingProduct: Product | null = null;
  productForm: FormGroup;
  isSaving = false;
  debugInfo = false;

  constructor(
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  private createProductForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      image_url: [''],
      stock_quantity: ['', [Validators.required, Validators.min(0)]],
      category_id: [null, [Validators.required]]
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(
      products => {
        this.products = products;
        console.log('Loaded products:', this.products);
      }
    );
  }

  loadCategories() {
    this.productService.getCategories().subscribe(
      categories => this.categories = categories
    );
  }

  getCategoryName(categoryId: number | null | undefined): string {
    if (!categoryId) return 'No Category';
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  createProduct() {
    this.editingProduct = {} as Product;
    this.productForm.reset();
  }

  editProduct(product: Product) {
    console.log('Original product to edit:', product);
    
    // Create a clean copy with explicitly typed category_id
    this.editingProduct = { 
      ...product,
      // Ensure category_id is a number or null
      category_id: product.category_id !== undefined ? Number(product.category_id) : null
    };
    
    // Reset form before setting values to avoid validation issues
    this.productForm.reset();
    
    // Use patchValue with explicit numeric value for category_id
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      // Ensure we're setting a number value, not a string
      category_id: product.category_id !== undefined ? Number(product.category_id) : null
    });
    
    console.log('Editing product with form values:', this.productForm.value);
    console.log('Category ID type:', typeof this.productForm.value.category_id);
  }

  cancelEdit() {
    this.editingProduct = null;
    this.productForm.reset();
  }

  saveProduct() {
    if (this.productForm.invalid || !this.editingProduct) {
      return;
    }

    this.isSaving = true;

    const formValues = this.productForm.value;
    const productData: Product = {
      id: this.editingProduct.id,
      name: formValues.name,
      description: formValues.description,
      price: Number(formValues.price),
      image_url: formValues.image_url,
      stock_quantity: Number(formValues.stock_quantity),
      category_id: formValues.category_id !== undefined && formValues.category_id !== null 
        ? Number(formValues.category_id) 
        : null
    };

    const request = productData.id
      ? this.productService.updateProduct(productData)
      : this.productService.createProduct(productData);
    
    request.subscribe({
      next: (savedProduct) => {
        console.log('Product saved successfully:', savedProduct);
        this.loadProducts();
        this.editingProduct = null;
        this.productForm.reset();
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving product:', error);
        this.isSaving = false;
      }
    });
  }

  deleteProduct(product: Product) {
    if (!product.id) return;
    
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
        }
      });
    }
  }
}