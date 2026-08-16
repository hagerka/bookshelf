import { Component, Output, signal, OnInit } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { SupabaseService } from '../supabase.service';

@Component({
    selector: 'app-bookshelf',
    standalone: true,
    imports: [NavigationComponent],
    templateUrl: './bookshelf.component.html',
    styleUrl: './bookshelf.component.css'
})
export class BookshelfComponent implements OnInit {
    books = signal<any[]>([]);
    loading = signal(false);
    failedImages = new Set<string>();
    page = signal(0);
    perPage = signal(10);
    totalBooks = signal(0);
    searchTerm = signal('');

    constructor(private supabaseService: SupabaseService) { }

    get hasActiveSearch(): boolean {
        return this.searchTerm().trim().length > 0;
    }

    get maxPage(): number {
        const total = this.totalBooks();
        if (total <= 0) {
            return 0;
        }

        return Math.ceil(total / this.perPage()) - 1;
    }

    canGoPrevious(): boolean {
        return this.page() > 0;
    }

    canGoNext(): boolean {
        if (this.hasActiveSearch) {
            return false;
        }

        return this.page() < this.maxPage;
    }

    ngOnInit() {
        this.loadTotalBooks();
        this.loadBooks();
    }

    loadTotalBooks() {
        this.supabaseService.getListLength().then((result) => {
            if (result.error) {
                console.error(result.error);
            } else {
                this.totalBooks.set(result.count ?? 0);
            }
        });
    }

    loadBooks() {
        this.loading.set(true);
        console.log('Loading books for page:', this.page(), 'perPage:', this.perPage());
        this.supabaseService.getBooks(this.page(), this.perPage()).then((result) => {
            if (result.error) {
                console.error(result.error);
            } else {
                console.log('Supabase books result:', result);
                console.log('Books data length:', result.data?.length ?? 0);
                this.books.set(result.data || []);
            }
            this.loading.set(false);
        });
    }

    onPageChange(newPage: number) {
        this.page.set(newPage);
        this.loadBooks();
    }

    searchBooks() {
        const term = this.searchTerm().trim();

        this.page.set(0);

        if (!term) {
            this.loadBooks();
            return;
        }

        this.loading.set(true);
        this.supabaseService.searchBook(term).then((result) => {
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

    getImageUrl(isbn: string): string {
        if (!isbn) return '';

        const digits = isbn.replace(/\D/g, '');

        if (digits.length === 10 || digits.length === 13) {
            const url = `https://covers.openlibrary.org/b/isbn/${digits}-M.jpg`;
            return url;
        }
        return '';
    }

    onImageError(isbn: string): void {
        console.log('Image failed to load for ISBN:', this.getImageUrl(isbn));
        this.failedImages.add(isbn);
    }

    hasFailedImage(isbn: string): boolean {
        return this.failedImages.has(isbn);
    }

}