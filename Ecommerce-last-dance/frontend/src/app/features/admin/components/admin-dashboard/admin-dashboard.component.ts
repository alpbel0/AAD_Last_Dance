import { Component } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="admin-dashboard">
      <nav class="admin-nav">
        <a routerLink="./products" routerLinkActive="active">Products</a>
        <a routerLink="./users" routerLinkActive="active">Users</a>
        <a routerLink="./categories" routerLinkActive="active">Categories</a>
      </nav>
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 20px;
      height: 100%;
    }
    .admin-nav {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .admin-nav a {
      padding: 10px;
      text-decoration: none;
      color: #333;
      border-radius: 4px;
    }
    .admin-nav a.active {
      background: #007bff;
      color: white;
    }
    .admin-content {
      background: white;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class AdminDashboardComponent {}