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
            options: {
                emailRedirectTo: `${environment.appUrl}/login`
            }
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

    async addBook(book: { title: string; author: string; isbn?: string; date_read?: string; notes?: string | null; rating?: number | null }) {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();

        if (userError || !userData.user) {
            return { error: userError ?? new Error('No authenticated user') };
        }

        const { data: existingBook, error: existingBookError } = await this.supabase
            .from('books')
            .select('id')
            .eq('isbn', book.isbn || '')
            .maybeSingle();

        if (existingBookError && existingBookError.code !== 'PGRST116') {
            return { error: existingBookError };
        }

        let bookId = existingBook?.id;

        if (!bookId) {
            const { data: insertedBook, error: insertError } = await this.supabase
                .from('books')
                .insert([
                    {
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn || null,
                    }
                ])
                .select('id')
                .single();

            if (insertError) {
                return { error: insertError };
            }

            bookId = insertedBook.id;
        }

        const { data, error } = await this.supabase
            .from('user_books')
            .insert([
                {
                    user_id: userData.user.id,
                    book_id: bookId,
                    notes: book.notes || null,
                    rating: typeof book.rating === 'number' ? Math.round(book.rating) : null,
                    date_read: book.date_read || new Date().toISOString().slice(0, 10),
                    status: 'completed',
                }
            ])
            .select();

        return { data, error };
    }
}