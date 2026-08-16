import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-search',
    standalone: true,
    templateUrl: './search.component.html',
    styleUrl: './search.component.css'

})
export class SearchComponent {
    @Input() searchTerm = '';
    @Output() search = new EventEmitter<string>();

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchTerm = input.value;
    }

    submitSearch(): void {
        this.search.emit(this.searchTerm.trim());
    }
}