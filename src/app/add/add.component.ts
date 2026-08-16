import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './add.component.html',
})
export class AddComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    form = {
        title: '',
        author_first_name: '',
        author_last_name: '',
        isbn: '',
        date_read: '',
        rating: '',
        notes: '',
    };

    closeModal(): void {
        this.close.emit();
    }

    submitBook(): void {
        const firstName = this.form.author_first_name?.trim();
        const lastName = this.form.author_last_name?.trim();

        if (!this.form.title?.trim() || (!firstName && !lastName)) {
            return;
        }

        const authorName = [lastName, firstName].filter(Boolean).join(', ');

        this.save.emit({
            ...this.form,
            author: authorName,
        });

        this.form = {
            title: '',
            author_first_name: '',
            author_last_name: '',
            isbn: '',
            date_read: '',
            rating: '',
            notes: '',
        };
    }
}