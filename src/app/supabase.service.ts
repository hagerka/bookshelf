import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root',
})

export class SupabaseService {
    private supabase: SupabaseClient;
    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
    }

    signUp(email: string, password: string) {
        return this.supabase.auth.signUp({
            email,
            password,
        });
    }

    signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({
            email,
            password,
        });
    }

    signOut() {
        return this.supabase.auth.signOut();
    }

    getCurrentUser() {
        return this.supabase.auth.getUser();
    }

    getBooks(page: number = 0, perPage: number = 10) {
        const start = page * perPage;
        const end = start + perPage - 1;
        return this.supabase.from('books').select('*').order('date_read', { ascending: false }).range(start, end);
    }

    searchBook(term: string) {
        const value = term.trim();

        if (!value) {
            return this.getBooks(0, 10);
        }

        return this.supabase
            .from('books')
            .select('*')
            .or(`title.ilike.%${value}%,author.ilike.%${value}%,isbn.ilike.%${value}%`)
            .limit(20);
    }

    getListLength() {
        return this.supabase.from('books').select('*', { count: 'exact' });
    }
}