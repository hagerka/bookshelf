import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { BookshelfComponent } from './bookshelf/bookshelf.component';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

export const authGuard = async () => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);
    const { data } = await supabase.getCurrentUser();

    if (!data.user) {
        router.navigate(['/login']);
        return false;
    }
    return true;
};

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: BookshelfComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];