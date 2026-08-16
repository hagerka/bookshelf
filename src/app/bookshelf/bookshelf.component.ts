import { Component, signal, OnInit } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Component({
    selector: 'app-bookshelf',
    templateUrl: './bookshelf.component.html',
    styleUrl: './bookshelf.component.css'
})
export class BookshelfComponent implements OnInit {
    books = signal<any[]>([]);
    loading = signal(false);
    failedImages = new Set<string>();

    constructor(private supabaseService: SupabaseService) { }

    ngOnInit() {
        this.loadBooks();
    }

    loadBooks() {
        this.loading.set(true);
        this.supabaseService.getBooks().then((result) => {
            if (result.error) {
                console.error(result.error);
            } else {
                this.books.set(result.data || []);
            }
            this.loading.set(false);
        });
    }

    cleanISBN(isbn: string): string {
        return isbn.replace(/[^0-9]/g, '');
    }

    getImageUrl(isbn13: string): string {
        if (!isbn13) return '';
        let cleaned = isbn13.replace(/^="/, '').replace(/"$/, '');
        
        if (cleaned.startsWith('http')) {
            return cleaned;
        }
        
        if (/^\d+$/.test(cleaned)) {
            return `https://covers.openlibrary.org/b/isbn/${cleaned}-M.jpg`;
        }
        
        return cleaned;
    }

    onImageError(isbn: string): void {
        console.log('Image failed to load for ISBN:', this.getImageUrl(isbn));
        this.failedImages.add(isbn);
    }

    hasFailedImage(isbn: string): boolean {
        return this.failedImages.has(isbn);
    }

}