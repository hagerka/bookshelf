import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navigation',
  standalone: true,
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {
  @Input() page = 0;
  @Input() perPage = 10;
  @Input() listLength = 0;
  @Input() canGoPrevious = false;
  @Input() canGoNext = false;
  @Output() pageChange = new EventEmitter<number>();

  previousPage() {
    if (this.canGoPrevious) {
      this.pageChange.emit(this.page - 1);
    }
  }

  nextPage() {
    if (this.canGoNext) {
      this.pageChange.emit(this.page + 1);
    }
  }
}

