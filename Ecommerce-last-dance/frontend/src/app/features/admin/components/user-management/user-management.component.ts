import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, UserRole } from '../../../../models/user.model'; // Import UserRole
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-management">
      <h2>User Management</h2>
      <button class="add-button" (click)="createUser()">Add New User</button>
      <div class="user-form" *ngIf="editingUser">
        <h3>{{ editingUser.id ? 'Edit User' : 'Create User' }}</h3>
        <form [formGroup]="userForm" (ngSubmit)="saveUser()">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" formControlName="username">
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" formControlName="password" 
                   placeholder="{{ editingUser.id ? '(Leave blank to keep current)' : 'Enter password' }}">
          </div>
          
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" formControlName="role">
              <option [value]="UserRole.USER">User</option>
              <option [value]="UserRole.SELLER">Seller</option>
              <option [value]="UserRole.ADMIN">Admin</option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" formControlName="banned">
              Is Banned
            </label>
          </div>
          
          <div class="button-group">
            <button type="submit" [disabled]="userForm.invalid || isSaving">Save</button>
            <button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <div class="user-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{user.id}}</td>
              <td>{{user.username}}</td>
              <td>{{user.email}}</td>
              <td>
                <span [class.is-admin]="user.role === UserRole.ADMIN" 
                      [class.is-seller]="user.role === UserRole.SELLER">
                  {{user.role}}
                </span>
              </td>
              <td>
                <span [class.is-banned]="user.banned">
                  {{user.banned ? 'Banned' : 'Active'}}
                </span>
              </td>
              <td>
                <button (click)="editUser(user)">Edit</button>
                <button (click)="toggleBan(user)" [class.unban-button]="user.banned">
                  {{user.banned ? 'Unban' : 'Ban'}}
                </button>
                <button (click)="promoteToAdmin(user)" class="make-admin-button" 
                        [class.admin-button]="user.role === UserRole.ADMIN">
                  {{user.role === UserRole.ADMIN ? 'Remove Admin' : 'Make Admin'}}
                </button>
                <button (click)="deleteUser(user)" [disabled]="!user.id">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .user-management {
      width: 100%;
    }
    .user-form {
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
    .form-group input[type="email"],
    .form-group input[type="password"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
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
    button.unban-button {
      background-color: #28a745;
      color: white;
    }
    button:not(.unban-button):nth-child(2) {
      background-color: #dc3545;
      color: white;
    }
    button:last-child {
      background-color: #dc3545;
      color: white;
    }
    button.admin-button {
      background-color:rgb(255, 0, 0);
      color: white;
    }
    button.admin-button:hover {
      background-color:rgb(255, 76, 76);
    }
    .make-admin-button {
      background-color: rgb(49, 247, 0);
      color: white;
    }
    .make-admin-button:hover {
      background-color: rgb(130, 253, 99);
      color: white;
    }
    
    .is-admin {
      color: #198754;
      font-weight: bold;
    }
    .is-seller {
      color: #0d6efd;
      font-weight: bold;
    }
    .is-banned {
      color: #dc3545;
      font-weight: bold;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  editingUser: User | null = null;
  userForm: FormGroup;
  isSaving = false;
  UserRole = UserRole; // Expose to template

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.authService.getUsers().subscribe(
      users => this.users = users
    );
  }

  private createUserForm(user?: User): FormGroup {
    return this.fb.group({
      username: [user?.username || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      password: ['', user?.id ? [] : [Validators.required, Validators.minLength(6)]],
      role: [user?.role || UserRole.USER], // Use role instead of isAdmin
      banned: [user?.banned || false]
    });
  }

  createUser() {
    this.editingUser = {
      username: '',
      email: '',
      role: UserRole.USER, // Set default role
      banned: false
    };
    this.userForm = this.createUserForm();
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.userForm = this.createUserForm(user);
  }

  toggleBan(user: User) {
    if (!user.id) return;
    
    const updatedUser = { ...user, banned: !user.banned };
    this.authService.updateUser(user.id, updatedUser).subscribe({
      next: () => {
        this.loadUsers();
      }
    });
  }

  promoteToAdmin(user: User) {
    if (!user.id) return;
    
    const newRole = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
    const updatedUser = { ...user, role: newRole };
    
    this.authService.updateUser(user.id, updatedUser).subscribe({
      next: () => {
        this.loadUsers();
      }
    });
  }

  cancelEdit() {
    this.editingUser = null;
  }

  saveUser() {
    if (this.userForm.invalid || !this.editingUser) return;

    this.isSaving = true;
    const userData = {
      ...this.editingUser,
      ...this.userForm.value
    };

    const request = this.editingUser.id
      ? this.authService.updateUser(this.editingUser.id, userData)
      : this.authService.register(userData);

    request.subscribe({
      next: () => {
        this.loadUsers();
        this.editingUser = null;
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  deleteUser(user: User) {
    if (!user.id) return;
    
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        }
      });
    }
  }
}