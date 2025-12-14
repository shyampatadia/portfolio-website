# Project Structure Documentation

This document provides detailed information about the organization and architecture of the portfolio website.

## Architecture Overview

The project follows a **modular, component-based architecture** designed for:
- **Maintainability**: Separated concerns make updates easier
- **Scalability**: Easy to add new features and sections
- **Performance**: Optimized loading and efficient code organization
- **Reusability**: Shared components and styles

## Directory Structure

### Root Level

```
portfolio-website/
├── index.html              # Main entry point
├── index.html.backup       # Original file backup
├── README.md              # Main documentation
├── STRUCTURE.md           # This file
├── .gitignore            # Git ignore rules
├── blog/                 # Blog section
├── bookshelf/            # Bookshelf section
├── assets/               # Static assets
└── css/                  # Legacy CSS (kept for compatibility)
```

### Assets Directory

```
assets/
├── css/                  # Modular stylesheets
│   ├── base.css         # Foundation: resets, typography, base elements
│   ├── components.css   # Component styles: cards, buttons, navigation
│   ├── animations.css   # All animations and keyframes
│   ├── utilities.css    # Utility classes and responsive design
│   └── main.css        # Imports all CSS modules
├── js/                   # JavaScript modules
│   ├── config.js        # Tailwind CSS configuration
│   ├── alpine-data.js   # Alpine.js reactive state
│   └── app.js          # Main application logic
├── images/              # Image assets (to be populated)
└── data/                # JSON data files
    ├── blog-posts.json  # Blog post metadata
    └── books.json       # Book collection data
```

## CSS Architecture

### base.css
**Purpose**: Foundation styles that apply globally

**Contains**:
- CSS Reset (`* { margin: 0; padding: 0; box-sizing: border-box; }`)
- Body and typography styles
- Background patterns
- Base link styles
- List styling
- Grid layout utilities

**When to modify**:
- Changing global fonts
- Adjusting base colors
- Modifying background patterns
- Updating default spacing

### components.css
**Purpose**: Reusable component patterns

**Contains**:
- Main card styling
- Header section styles
- Profile container and photo frame
- Navigation tabs
- Content containers
- Card components (skill cards, project cards, etc.)
- Social links
- Badges and tags

**When to modify**:
- Updating component designs
- Adding new reusable components
- Changing hover effects
- Modifying component layouts

### animations.css
**Purpose**: All animation definitions and effects

**Contains**:
- Keyframe animations (gradient, shimmer, float, pulse)
- Animation utility classes
- Star field animations
- Floating bubble effects
- Transition effects

**When to modify**:
- Adding new animations
- Adjusting animation timing
- Creating custom keyframes
- Updating animation triggers

### utilities.css
**Purpose**: Helper classes and responsive design

**Contains**:
- Color utility classes
- Background color utilities
- Responsive breakpoints
- Media queries
- Helper classes

**When to modify**:
- Adding responsive breakpoints
- Creating new utility classes
- Adjusting mobile layouts
- Updating color utilities

### main.css
**Purpose**: Central import point for all CSS

**Structure**:
```css
@import url('base.css');
@import url('components.css');
@import url('animations.css');
@import url('utilities.css');
```

**Loading order matters**: Base → Components → Animations → Utilities

## JavaScript Architecture

### config.js
**Purpose**: Tailwind CSS configuration

**Contains**:
- Custom color palette (primary, secondary)
- Theme extensions
- Dark mode configuration

**When to modify**:
- Changing site colors
- Adding new color shades
- Updating theme configuration

### alpine-data.js
**Purpose**: Alpine.js reactive state management

**Contains**:
- `portfolioData` object
- `changeTab()` method
- `isActiveTab()` method

**When to modify**:
- Adding new interactive features
- Creating new reactive data
- Adding state management

**Usage in HTML**:
```html
<body x-data="portfolioData">
  <button @click="changeTab('skills')">Skills</button>
</body>
```

### app.js
**Purpose**: Main application logic and initialization

**Contains**:
- DOM initialization
- Skills filtering
- Smooth scrolling
- Lazy loading
- Utility functions (debounce)

**Functions**:
- `initializeSkillsFilter()`: Sets up skill category filtering
- `filterSkills(category)`: Filters skills by category
- `initializeSmoothScroll()`: Enables smooth anchor scrolling
- `initializeLazyLoading()`: Sets up image lazy loading
- `debounce(func, wait)`: Utility for debouncing functions

**When to modify**:
- Adding new interactive features
- Implementing new filters
- Adding event listeners
- Creating new utilities

## Data Architecture

### blog-posts.json
**Structure**:
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Post Title",
      "slug": "post-slug",
      "date": "2025-12-13",
      "excerpt": "Brief description",
      "content": "Full content",
      "tags": ["tag1", "tag2"],
      "category": "Category",
      "author": "Author Name",
      "readTime": "5 min"
    }
  ]
}
```

### books.json
**Structure**:
```json
{
  "books": [
    {
      "id": 1,
      "title": "Book Title",
      "author": "Author Name",
      "status": "read|reading|to-read",
      "rating": 5,
      "category": "Category",
      "review": "Review text",
      "dateFinished": "2024-03-15",
      "tags": ["tag1", "tag2"]
    }
  ],
  "stats": {
    "totalRead": 24,
    "currentlyReading": 3,
    "toRead": 12
  }
}
```

## Page Structure

### Main Portfolio (index.html)

**Sections**:
1. Header with profile information
2. Tabbed navigation
3. Content sections:
   - Summary
   - Skills
   - Experience
   - Education
   - Projects
   - Certifications
4. Footer with contact info

**State Management**:
- Uses Alpine.js for tab switching
- Active tab stored in `activeTab` variable
- Sections shown/hidden with `x-show`

### Blog (blog/index.html)

**Features**:
- Blog post listing
- Category filtering
- Tag system
- Pagination
- Navigation to main site

### Bookshelf (bookshelf/index.html)

**Features**:
- Book collection grid
- Status filtering (Read, Reading, To Read)
- Category organization
- Rating system
- Reading statistics

## Adding New Features

### Adding a New Page Section

1. **Create the HTML structure** in `index.html`:
   ```html
   <section x-show="activeTab === 'newsection'" class="content-container">
     <h2 class="text-blue-400">New Section</h2>
     <!-- Content here -->
   </section>
   ```

2. **Add a tab button**:
   ```html
   <button @click="changeTab('newsection')" class="tab-btn">
     <i class="fas fa-icon"></i> New Section
   </button>
   ```

3. **Style if needed** in `components.css`:
   ```css
   .newsection-card {
     /* Styles */
   }
   ```

### Adding a New Component

1. **Define styles** in `components.css`:
   ```css
   .my-component {
     background-color: #232a3a;
     border-radius: 0.5rem;
     padding: 1.5rem;
   }
   ```

2. **Use in HTML**:
   ```html
   <div class="my-component">
     <!-- Component content -->
   </div>
   ```

### Adding a New Animation

1. **Define keyframes** in `animations.css`:
   ```css
   @keyframes myAnimation {
     0% { transform: scale(1); }
     50% { transform: scale(1.1); }
     100% { transform: scale(1); }
   }
   ```

2. **Create utility class**:
   ```css
   .animate-my-animation {
     animation: myAnimation 2s ease-in-out infinite;
   }
   ```

3. **Apply to elements**:
   ```html
   <div class="animate-my-animation">Animated content</div>
   ```

## Best Practices

### CSS Organization
- Keep selectors specific but not overly complex
- Group related styles together
- Use meaningful class names
- Follow the established naming conventions
- Comment complex sections

### JavaScript Organization
- Keep functions small and focused
- Use meaningful variable names
- Comment complex logic
- Export functions that may be reused
- Initialize on DOMContentLoaded

### HTML Structure
- Use semantic HTML5 elements
- Keep nesting shallow when possible
- Use Alpine.js directives consistently
- Include ARIA attributes for accessibility
- Use data attributes for JavaScript hooks

### Performance
- Lazy load images below the fold
- Minimize inline styles
- Use CSS animations over JavaScript when possible
- Debounce scroll and resize handlers
- Minimize HTTP requests

## Deployment

### Static Hosting Options
- **GitHub Pages**: Free, easy setup
- **Netlify**: Automatic deployments from Git
- **Vercel**: Fast CDN, serverless functions
- **Cloudflare Pages**: Global CDN, analytics

### Pre-Deployment Checklist
- [ ] Test on multiple browsers
- [ ] Verify mobile responsiveness
- [ ] Check all links work
- [ ] Optimize images
- [ ] Update meta tags and SEO
- [ ] Test with slow network
- [ ] Verify analytics tracking
- [ ] Check accessibility

## Maintenance

### Regular Updates
- Update blog posts regularly
- Add new books to bookshelf
- Keep projects section current
- Update skills as you learn
- Refresh profile photo periodically

### Code Maintenance
- Review and refactor CSS quarterly
- Update dependencies (Tailwind, Alpine.js)
- Test across new browser versions
- Monitor performance metrics
- Address accessibility issues

---

## Questions or Issues?

If you have questions about the structure or need to make significant changes, refer to:
- `README.md` for general information
- Component-specific comments in CSS files
- Function documentation in JavaScript files
