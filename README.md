# Portfolio Website - Shyam Patadia

A modern, optimized personal portfolio website built with HTML, CSS (Tailwind CSS), and Alpine.js. This portfolio showcases professional experience, skills, projects, and includes dedicated sections for a blog and bookshelf.

## Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI/UX**: Smooth animations, interactive elements, and clean design
- **Modular Architecture**: Organized CSS and JavaScript for maintainability
- **Blog Section**: Share thoughts, tutorials, and insights
- **Bookshelf**: Showcase reading list and book reviews
- **Performance Optimized**: Fast loading with lazy loading and efficient code

## Project Structure

```
portfolio-website/
├── index.html                  # Main portfolio page
├── index.html.backup           # Backup of original file
├── blog/                       # Blog section
│   └── index.html             # Blog listing page
├── bookshelf/                  # Bookshelf section
│   └── index.html             # Book collection page
├── assets/                     # All static assets
│   ├── css/                   # Modular stylesheets
│   │   ├── base.css          # Base styles and resets
│   │   ├── components.css     # Reusable component styles
│   │   ├── animations.css     # Animation keyframes
│   │   ├── utilities.css      # Utility classes
│   │   └── main.css          # Main stylesheet (imports all)
│   ├── js/                    # JavaScript modules
│   │   ├── config.js         # Tailwind configuration
│   │   ├── alpine-data.js    # Alpine.js reactive data
│   │   └── app.js            # Main application logic
│   ├── images/                # Image assets
│   └── data/                  # JSON data files
│       ├── blog-posts.json   # Blog post data
│       └── books.json        # Book collection data
├── css/                        # Legacy CSS (for backwards compatibility)
│   └── styles.css
├── README.md                   # This file
└── STRUCTURE.md               # Detailed structure documentation
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, for development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd portfolio-website
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js (http-server)
   npx http-server

   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000` in your browser

## Development

### Modifying Styles

The CSS is organized into modular files in `assets/css/`:

- **base.css**: Modify foundational styles (typography, resets, base elements)
- **components.css**: Update component-specific styles (cards, buttons, navigation)
- **animations.css**: Add or modify animations and keyframes
- **utilities.css**: Add utility classes and responsive breakpoints

All CSS is imported via `main.css`, which is loaded in the HTML.

### Adding JavaScript Functionality

JavaScript is organized into modules in `assets/js/`:

- **config.js**: Tailwind CSS configuration
- **alpine-data.js**: Alpine.js reactive state and methods
- **app.js**: Main application logic and initialization

### Adding Blog Posts

1. Create a new entry in `assets/data/blog-posts.json`
2. Add corresponding HTML article in `blog/index.html`
3. Optionally create a dedicated post page in `blog/posts/`

### Adding Books

1. Add book details to `assets/data/books.json`
2. Update the books grid in `bookshelf/index.html`
3. Update reading statistics if needed

## Sections

### Main Portfolio
- **Summary**: Professional overview and introduction
- **Skills**: Technical skills organized by category
- **Experience**: Professional work history
- **Education**: Academic background
- **Projects**: Notable projects and contributions
- **Certifications**: Professional certifications

### Blog
Located at `/blog/index.html`
- Write about technical topics, tutorials, and insights
- Organized by categories and tags
- Includes search and filter functionality

### Bookshelf
Located at `/bookshelf/index.html`
- Track reading progress (Read, Reading, To Read)
- Rate and review books
- Organize by categories
- Display reading statistics

## Customization

### Colors and Theme

Update colors in `assets/js/config.js`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: { /* your colors */ },
        secondary: { /* your colors */ }
      }
    }
  }
};
```

### Profile Information

Edit `index.html` to update:
- Name and title
- Bio and summary
- Social media links
- Contact information

### Adding New Sections

To add new sections to the main page:

1. Add a new tab button in the navigation
2. Create a new section in the content area
3. Update Alpine.js data if needed for tab switching

## Performance Optimization

- **Lazy Loading**: Images use lazy loading via Intersection Observer
- **Modular CSS**: Only load what you need
- **CDN Resources**: External libraries loaded from CDNs
- **Minification**: Consider minifying CSS/JS for production

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] Add dark mode toggle
- [ ] Implement blog post pages with markdown support
- [ ] Add RSS feed for blog
- [ ] Implement search functionality
- [ ] Add animations on scroll
- [ ] Create contact form with backend
- [ ] Add analytics tracking
- [ ] Set up automated deployment

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid
- **Tailwind CSS**: Utility-first CSS framework
- **Alpine.js**: Lightweight JavaScript framework
- **Font Awesome**: Icon library
- **Google Fonts**: Inter font family

## License

© 2025 Shyam Patadia. All rights reserved.

## Contact

- Email: shyampatadia22@gmail.com
- LinkedIn: [linkedin.com/in/shyampatadia](https://www.linkedin.com/in/shyampatadia/)
- GitHub: [github.com/shyampatadia](https://github.com/shyampatadia)

---

**Note**: This is a static website. For dynamic features like blog comments or contact forms, you'll need to integrate backend services or third-party APIs.
