import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, LoginRequest, RegisterRequest, UserRole } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadUserFromStorage();
  }
  
  private loadUserFromStorage(): void {
    if (this.isBrowser) {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error parsing user from localStorage', error);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }
  
  register(userData: RegisterRequest): Observable<User> {
    // Log the data being sent to help with debugging
    console.log('Registering user with data:', userData);
    
    // Ensure required fields are present and not empty
    if (!userData.username || !userData.email || !userData.password) {
      return throwError(() => ({ message: 'Username, email, and password are required' }));
    }
    
    // Create a user object with the correct structure matching backend expectations
    const userToRegister = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || '',  // Default to empty string if undefined
      lastName: userData.lastName || '',    // Default to empty string if undefined
      role: userData.role || 'USER',        // Default to USER if role is not specified
      banned: false                         // Users are not banned by default
    };
    
    console.log('Sending formatted user data:', userToRegister);
    
    return this.http.post<User>(`${this.apiUrl}/register`, userToRegister).pipe(
      tap(user => {
        console.log('Registration successful:', user);
        this.storeUserData(user);
      }),
      catchError(error => {
        console.error('Registration error details:', error);
        if (error.error && error.error.message) {
          return throwError(() => ({ message: error.error.message }));
        }
        return throwError(() => ({ message: 'Registration failed. Please try again.' }));
      })
    );
  }
  
  login(credentials: LoginRequest): Observable<User> {
    const loginData = {
      email: credentials.email.trim(),
      password: credentials.password
    };
    
    return this.http.post<User>(`${this.apiUrl}/login`, loginData).pipe(
      tap(user => {
        this.storeUserData(user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        if (error.error && typeof error.error === 'string') {
          return throwError(() => ({ message: error.error }));
        }
        return throwError(() => ({ 
          message: error.error?.message || 'Login failed. Please check your credentials and try again.'
        }));
      })
    );
  }
  
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }
  
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  // User management methods
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all`).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  
  private storeUserData(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }
  
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
  
  isAdmin(): boolean {
    return !!this.currentUserSubject.value && this.currentUserSubject.value.role === UserRole.ADMIN;
  }
  
  isSeller(): boolean {
    return this.isSellerOrAdmin();
  }
  
  isSellerOrAdmin(): boolean {
    return !!this.currentUserSubject.value && 
      (this.currentUserSubject.value.role === UserRole.SELLER || 
       this.currentUserSubject.value.role === UserRole.ADMIN);
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id || null;
  }
  
  // Renamed from getToken to match usage in ReviewService
  getAuthToken(): string | null {
    return this.currentUserSubject.value?.token || null;
  }
  
  private handleError(error: any): Observable<never> {
    console.error('Auth service error', error);
    return throwError(() => error.error?.message || 'Something went wrong');
  }
}