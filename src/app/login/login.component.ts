import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    email = signal('');
    password = signal('');
    loading = signal(false);
    error = signal('');
    isSignUp = signal(false);

    constructor(
        private supabaseService: SupabaseService,
        private router: Router
    ) { }

    async handleAuth() {
        this.loading.set(true);
        this.error.set('');

        try {
            const emailValue = this.email();
            const passwordValue = this.password();

            let result;
            if (this.isSignUp()) {
                result = await this.supabaseService.signUp(emailValue, passwordValue);
            } else {
                result = await this.supabaseService.signIn(emailValue, passwordValue);
            }

            if (result.error) {
                this.error.set(result.error.message);
            } else {
                this.router.navigate(['/']);
            }
        } catch (err: any) {
            this.error.set(err.message || 'An error occurred');
        } finally {
            this.loading.set(false);
        }
    }

    toggleMode() {
        this.isSignUp.set(!this.isSignUp());
        this.error.set('');
    }
}