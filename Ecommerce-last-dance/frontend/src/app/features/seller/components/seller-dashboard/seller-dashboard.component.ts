import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="seller-dashboard">
      <h2>Seller Dashboard</h2>
      <div class="seller-info" *ngIf="currentUser">
        <h3>Welcome, {{ currentUser.firstName || currentUser.username }}!</h3>
        <p>Manage your products and track your sales.</p>
      </div>

      <div class="dashboard-nav">
        <button [routerLink]="['./products']" routerLinkActive="active">My Products</button>
        <button [routerLink]="['./create']" routerLinkActive="active">Add New Product</button>
      </div>

      <div class="dashboard-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .seller-dashboard {
      padding: 20px;
    }
    .dashboard-nav {
      margin: 20px 0;
    }
    .dashboard-nav button {
      padding: 10px 15px;
      margin-right: 10px;
      background-color: #f0f0f0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .dashboard-nav button.active {
      background-color: #4CAF50;
      color: white;
    }
  `]
})
export class SellerDashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}