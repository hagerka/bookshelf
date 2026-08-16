import { Component } from '@angular/core';

@Component({
    selector: 'app-site-header',
    standalone: true,
    template: `
    <header class="site-header">
      <div class="site-header__content">
        <h1>Welcome to the Arrangeable Bookshelf</h1>
        <p>This is a simple bookshelf app that allows you to arrange your books in any order you like.</p>
        <p>You can add, remove, and rearrange your books as you see fit.</p>
      </div>
    </header>
  `,
    styles: `
    .site-header {
      background: linear-gradient(180deg, #1a2b22 0%, #132018 100%);
      border-bottom: 1px solid rgba(181, 122, 58, 0.65);
      padding: 1.25rem 2rem;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
    }

    .site-header__content {
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 0.75rem;
      color: #f2e7d2;
      font-size: 2rem;
      font-family: Georgia, 'Times New Roman', serif;
      letter-spacing: 0.04em;
    }

    p {
      margin: 0.3rem 0;
      color: rgba(242, 231, 210, 0.9);
      font-size: 1.05rem;
      line-height: 1.5;
    }
  `
})
export class SiteHeaderComponent { }
