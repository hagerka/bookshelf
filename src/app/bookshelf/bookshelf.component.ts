import { Component, Output, signal, OnInit } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { SupabaseService } from '../supabase.service';
import { SearchComponent } from "../search/search.component";
import { AddComponent } from '../add/add.component';

@Component({
    selector: 'app-bookshelf',
    standalone: true,
    imports: [NavigationComponent, SearchComponent, AddComponent],
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
    showAddModal = signal(false);
    orderLocked = signal(true);
    draggedIndex = signal<number | null>(null);
    private dragOrderSnapshot: any[] = [];

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
        if (this.hasActiveSearch || !this.orderLocked()) {
            return false;
        }

        return this.page() < this.maxPage;
    }

    get effectivePerPage(): number {
        if (!this.orderLocked()) {
            return Math.max(this.totalBooks(), 1000);
        }

        return this.perPage();
    }

    toggleOrderLock() {
        const nextLocked = !this.orderLocked();
        this.orderLocked.set(nextLocked);

        if (!nextLocked) {
            this.page.set(0);
            this.loadAllBooksForUnlock();
        }
    }

    loadAllBooksForUnlock() {
        this.loading.set(true);
        const total = Math.max(this.totalBooks() || 0, 1000);

        this.supabaseService.getBooks(0, total).then((result) => {
            if (result.error) {
                console.error(result.error);
            } else {
                this.books.set((result.data || []).map((book: any) => ({
                    ...book,
                    row: typeof book.row === 'number' ? book.row : 0,
                    column: typeof book.column === 'number' ? book.column : 0,
                })));
            }
            this.loading.set(false);
        });
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
        const perPage = this.effectivePerPage;
        this.supabaseService.getBooks(this.page(), perPage).then((result) => {
            if (result.error) {
                console.error(result.error);
            } else {
                this.books.set((result.data || []).map((book: any) => ({
                    ...book,
                    row: typeof book.row === 'number' ? book.row : 0,
                    column: typeof book.column === 'number' ? book.column : 0,
                })));
            }
            this.loading.set(false);
        });
    }

    getPositionKey(row: number, column: number): string {
        return `${row}-${column}`;
    }

    reorderBooks(fromIndex: number, toIndex: number, books: any[] = this.books()) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
            return;
        }

        const currentBooks = [...books];
        if (fromIndex >= currentBooks.length) {
            return;
        }

        const [movedBook] = currentBooks.splice(fromIndex, 1);
        const insertionIndex = Math.min(Math.max(toIndex, 0), currentBooks.length);
        currentBooks.splice(insertionIndex, 0, movedBook);

        const finalBooks = currentBooks.map((book, index) => ({
            ...book,
            row: 0,
            column: index,
        }));

        this.books.set(finalBooks);
        this.persistBookPositions(finalBooks);
    }

    persistBookPositions(books: any[]) {
        Promise.allSettled(
            books.map((book, index) => {
                const userBookId = book.user_book_id ?? book.book_id;
                if (!userBookId) {
                    return Promise.resolve(null);
                }

                return this.supabaseService.updateBookPosition(userBookId, 0, index).then((result) => {
                    if (result.error) {
                        console.error('Failed to save book position', result.error);
                    }
                });
            })
        );
    }

    onDragStart(index: number, event: DragEvent) {
        if (this.orderLocked()) {
            event.preventDefault();
            return;
        }

        this.draggedIndex.set(index);
        this.dragOrderSnapshot = [...this.books()];
        event.dataTransfer?.setData('text/plain', String(index));
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    onDragOver(event: DragEvent) {
        if (this.orderLocked()) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    onDrop(targetIndex: number, event: DragEvent) {
        if (this.orderLocked()) {
            return;
        }

        event.preventDefault();
        const sourceIndex = Number(event.dataTransfer?.getData('text/plain') ?? this.draggedIndex());

        if (!Number.isFinite(sourceIndex)) {
            return;
        }

        const baseBooks = this.dragOrderSnapshot.length > 0 ? this.dragOrderSnapshot : this.books();
        this.reorderBooks(sourceIndex, targetIndex, baseBooks);
        this.dragOrderSnapshot = [];
        this.draggedIndex.set(null);
    }

    onPageChange(newPage: number) {
        this.page.set(newPage);
        this.loadBooks();
    }

    searchBooks(termOverride?: string) {
        const term = (termOverride ?? this.searchTerm()).trim();

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

    onSearch(term: string) {
        this.searchTerm.set(term);
        this.searchBooks(term);
    }

    onAddBook(book: any) {
        const ratingValue = Number(book.rating);
        const normalizedRating = Number.isFinite(ratingValue)
            ? Math.round(ratingValue)
            : null;

        const payload = {
            title: book.title?.trim(),
            author: (book.author || '').trim(),
            isbn: book.isbn?.trim(),
            date_read: book.date_read || new Date().toISOString().slice(0, 10),
            notes: book.notes?.trim() || null,
            rating: normalizedRating,
        };

        this.loading.set(true);
        this.supabaseService.addBook(payload).then((result) => {
            if (result.error) {
                console.error(result.error);
            } else {
                this.showAddModal.set(false);
                this.page.set(0);
                this.loadTotalBooks();
                this.loadBooks();
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