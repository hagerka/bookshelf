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

    private mapUserBookEntry(entry: any, fallbackIndex: number = 0) {
        const bookDetails = entry?.books ?? {};
        const hasRow = typeof entry?.row === 'number';
        const hasColumn = typeof entry?.column === 'number';

        return {
            user_book_id: entry?.id ?? null,
            book_id: entry?.book_id ?? bookDetails?.id ?? null,
            id: bookDetails?.id ?? entry?.book_id ?? null,
            title: bookDetails?.title ?? '',
            author: bookDetails?.author ?? '',
            isbn: bookDetails?.isbn ?? '',
            row: hasRow ? entry.row : 0,
            column: hasColumn ? entry.column : fallbackIndex,
        };
    }

    async getBooks(page: number = 0, perPage: number = 10) {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();

        if (userError || !userData.user) {
            return { error: userError ?? new Error('No authenticated user'), data: [] };
        }

        const start = page * perPage;
        const end = start + perPage - 1;

        const { data, error } = await this.supabase
            .from('user_books')
            .select('id, user_id, book_id, row, column, books(id, title, author, isbn)')
            .eq('user_id', userData.user.id)
            .order('row', { ascending: true })
            .order('column', { ascending: true })
            .range(start, end);

        if (!error && (data ?? []).length > 0) {
            const normalizedEntries = (data ?? []).map((entry: any, index: number) => this.mapUserBookEntry(entry, index));

            normalizedEntries.forEach((entry: any, index: number) => {
                const needsInitialPosition = entry.user_book_id && (
                    typeof entry.row !== 'number' || typeof entry.column !== 'number' || entry.column === null
                );

                if (needsInitialPosition) {
                    this.supabase
                        .from('user_books')
                        .update({ row: 0, column: index })
                        .eq('id', entry.user_book_id)
                        .then();
                }
            });

            return {
                data: normalizedEntries,
                error: null,
            };
        }

        const fallback = await this.supabase
            .from('books')
            .select('*')
            .order('date_read', { ascending: false })
            .range(start, end);

        if (fallback.error) {
            return { error: fallback.error, data: [] };
        }

        return {
            data: (fallback.data ?? []).map((book: any) => ({
                ...book,
                user_book_id: book.user_book_id ?? null,
                book_id: book.id,
                row: typeof book.row === 'number' ? book.row : 0,
                column: typeof book.column === 'number' ? book.column : 0,
            })),
            error: null,
        };
    }

    async searchBook(term: string) {
        const value = term.trim();

        if (!value) {
            return this.getBooks(0, 10);
        }

        const { data: userData, error: userError } = await this.supabase.auth.getUser();

        if (userError || !userData.user) {
            return { error: userError ?? new Error('No authenticated user'), data: [] };
        }

        const { data, error } = await this.supabase
            .from('user_books')
            .select('id, user_id, book_id, row, column, books(id, title, author, isbn)')
            .eq('user_id', userData.user.id)
            .or(`books.title.ilike.%${value}%,books.author.ilike.%${value}%,books.isbn.ilike.%${value}%`)
            .limit(20);

        if (!error && (data ?? []).length > 0) {
            const normalizedEntries = (data ?? []).map((entry: any, index: number) => this.mapUserBookEntry(entry, index));

            normalizedEntries.forEach((entry: any, index: number) => {
                const needsInitialPosition = entry.user_book_id && (
                    typeof entry.row !== 'number' || typeof entry.column !== 'number' || entry.column === null
                );

                if (needsInitialPosition) {
                    this.supabase
                        .from('user_books')
                        .update({ row: 0, column: index })
                        .eq('id', entry.user_book_id)
                        .then();
                }
            });

            return {
                data: normalizedEntries,
                error: null,
            };
        }

        const fallback = await this.supabase
            .from('books')
            .select('*')
            .or(`title.ilike.%${value}%,author.ilike.%${value}%,isbn.ilike.%${value}%`)
            .limit(20);

        if (fallback.error) {
            return { error: fallback.error, data: [] };
        }

        return {
            data: (fallback.data ?? []).map((book: any) => ({
                ...book,
                user_book_id: book.user_book_id ?? null,
                book_id: book.id,
                row: typeof book.row === 'number' ? book.row : 0,
                column: typeof book.column === 'number' ? book.column : 0,
            })),
            error: null,
        };
    }

    async getListLength() {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();

        if (userError || !userData.user) {
            return { error: userError ?? new Error('No authenticated user'), count: 0 };
        }

        const result = await this.supabase
            .from('user_books')
            .select('*', { count: 'exact' })
            .eq('user_id', userData.user.id);

        if (result.error) {
            return result;
        }

        if ((result.count ?? 0) > 0) {
            return result;
        }

        const fallback = await this.supabase.from('books').select('*', { count: 'exact' });
        return fallback;
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

        const { data: userBooks, error: userBooksError } = await this.supabase
            .from('user_books')
            .select('column')
            .eq('user_id', userData.user.id);

        if (userBooksError) {
            return { error: userBooksError };
        }

        const nextColumn = userBooks?.length ?? 0;

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
                    row: 0,
                    column: nextColumn,
                }
            ])
            .select();

        return { data, error };
    }

    async updateBookPosition(userBookId: number | string, row: number, column: number) {
        return this.supabase
            .from('user_books')
            .update({ row, column })
            .eq('id', userBookId)
            .select();
    }
}