import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ProductListComponent } from './components/product-list/product-list.component';

@NgModule({
  imports: [
    BrowserModule,
    RouterModule,
    HttpClientModule,
    AppComponent,
    ProductListComponent,
  ],
  providers: []
})
export class AppModule { } 