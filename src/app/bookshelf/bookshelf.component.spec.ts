import { BookshelfComponent } from './bookshelf.component';
import { SupabaseService } from '../supabase.service';

describe('BookshelfComponent', () => {
    let component: BookshelfComponent;
    let supabaseService: jasmine.SpyObj<SupabaseService>;

    beforeEach(() => {
        supabaseService = jasmine.createSpyObj<SupabaseService>('SupabaseService', [
            'getListLength',
            'getBooks',
            'searchBook',
            'addBook',
            'updateBookPosition',
        ]);

        component = new BookshelfComponent(supabaseService);
        component.books.set([
            { id: 1, title: 'Book 1', author: 'Author 1', isbn: '111', row: 0, column: 0, user_book_id: 101 },
            { id: 2, title: 'Book 2', author: 'Author 2', isbn: '222', row: 0, column: 1, user_book_id: 102 },
            { id: 3, title: 'Book 3', author: 'Author 3', isbn: '333', row: 0, column: 2, user_book_id: 103 },
        ]);
    });

    it('should move an item to a new position and update row and column values', () => {
        component.reorderBooks(2, 1);

        expect(component.books().map((book) => book.id)).toEqual([1, 3, 2]);
        expect(component.books()[1].id).toBe(3);
        expect(component.books()[1].row).toBe(0);
        expect(component.books()[1].column).toBe(1);
        expect(component.books()[2].column).toBe(2);
    });

    it('should shift later books down when moved to the first position', () => {
        component.reorderBooks(2, 0);

        expect(component.books().map((book) => book.id)).toEqual([3, 1, 2]);
        expect(component.books()[0].column).toBe(0);
        expect(component.books()[1].column).toBe(1);
        expect(component.books()[2].column).toBe(2);
    });

    it('should preserve a single-step shift when multiple books are dropped into the same target', () => {
        component.books.set([
            { id: 1, title: 'Book 1', author: 'Author 1', isbn: '111', row: 0, column: 0, user_book_id: 101 },
            { id: 2, title: 'Book 2', author: 'Author 2', isbn: '222', row: 0, column: 1, user_book_id: 102 },
            { id: 3, title: 'Book 3', author: 'Author 3', isbn: '333', row: 0, column: 2, user_book_id: 103 },
            { id: 4, title: 'Book 4', author: 'Author 4', isbn: '444', row: 0, column: 3, user_book_id: 104 },
        ]);

        component.reorderBooks(2, 3);

        expect(component.books().map((book) => book.id)).toEqual([1, 2, 4, 3]);
        expect(component.books()[2].column).toBe(2);
        expect(component.books()[3].column).toBe(3);
    });

    it('should toggle order locking and show the full list when unlocked', () => {
        expect(component.orderLocked()).toBeTrue();

        component.toggleOrderLock();

        expect(component.orderLocked()).toBeFalse();
        expect(component.effectivePerPage).toBeGreaterThan(10);
    });

    it('should build a unique row-column key', () => {
        expect(component.getPositionKey(2, 4)).toBe('2-4');
    });
});
