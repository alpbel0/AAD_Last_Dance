import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../../models/product.model';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-seller-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seller-products">
      <h3>My Products</h3>
      <div *ngIf="loading" class="loading">Loading products...</div>
      
      <div *ngIf="error" class="error">
        {{ error }}
      </div>
      
      <div *ngIf="!loading && !error && products.length === 0" class="no-products">
        You don't have any products yet. 
        <button (click)="navigateToCreate()">Create your first product</button>
      </div>
      
      <table *ngIf="products.length > 0" class="products-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let product of products">
            <td>
              <img [src]="product.image_url || 'assets/placeholder.png'" alt="{{ product.name }}" class="product-thumbnail">
            </td>
            <td>{{ product.name }}</td>
            <td>{{ product.price | currency }}</td>
            <td>{{ product.stock_quantity }}</td>
            <td>{{ product.category?.name || 'None' }}</td>
            <td class="actions">
              <button (click)="editProduct(product)" class="edit">Edit</button>
              <button (click)="deleteProduct(product)" class="delete">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      
    </div>
  `,
  styles: [`
    .seller-products {
      padding: 20px 0;
    }
    .loading, .error, .no-products {
      margin: 20px 0;
      padding: 15px;
      text-align: center;
    }
    .error {
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
    }
    .products-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed; /* Add this to ensure consistent column widths */
    }
    .products-table th, .products-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      vertical-align: middle; /* Ensure vertical alignment */
      height: 82px; /* Set a consistent height for all rows */
    }

    .product-thumbnail {
      width: 50px;
      height: 50px;
      object-fit: cover;
    }
    .actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .actions button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .edit {
      background-color: #2196F3;
      color: white;
    }
    .delete {
      background-color: #f44336;
      color: white;
    }
    .create {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 20px;
    }
    .actions-bottom {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class SellerProductListComponent implements OnInit {
  products: Product[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  constructor(
    private productService: ProductService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadProducts();
  }
  
  loadProducts(): void {
    this.loading = true;
    this.error = null;
    
    this.productService.getSellerProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load products';
        this.loading = false;
      }
    });
  }
  
  editProduct(product: Product): void {
    this.router.navigate(['/seller/edit', product.id]);
  }
  
  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      this.productService.deleteProduct(product.id!).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete product';
        }
      });
    }
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/seller/create']);
  }
}