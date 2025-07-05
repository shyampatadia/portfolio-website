# React + FastAPI Portfolio

A modern, reactive portfolio website built with React, TypeScript, Tailwind CSS, and FastAPI backend. This project converts a beautiful static HTML portfolio into a dynamic, component-based React application with a RESTful API backend.

## 🚀 Features

- **Modern React App**: Built with TypeScript for type safety
- **Beautiful UI**: Sophisticated dark theme with animations and gradients
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Tabs**: Smooth navigation between different sections
- **Animations**: Custom CSS animations and hover effects
- **FastAPI Backend**: RESTful API for portfolio data
- **Professional Design**: Based on the original HTML portfolio with enhanced interactivity

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Font Awesome** for icons
- **Custom CSS animations**
- **Responsive design principles**

### Backend
- **FastAPI** for the REST API
- **Pydantic** for data validation
- **CORS** support for frontend integration
- **Uvicorn** ASGI server

## 📁 Project Structure

```
/
├── portfolio-react/          # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Header.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   ├── Summary.tsx
│   │   │   ├── Skills.tsx
│   │   │   ├── Experience.tsx
│   │   │   ├── Education.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Certifications.tsx
│   │   │   └── Footer.tsx
│   │   ├── App.tsx           # Main App component
│   │   ├── index.css         # Tailwind CSS + custom styles
│   │   └── index.tsx         # Entry point
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js    # Tailwind configuration
├── backend/                  # FastAPI backend
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── README.md           # Backend documentation
├── index.html              # Original static website
├── css/                    # Original CSS files
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### Frontend Setup (React)

1. **Navigate to the React app:**
   ```bash
   cd portfolio-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Backend Setup (FastAPI)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   python main.py
   ```

5. **API Documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## 🎯 Key Features & Improvements

### React Conversion Benefits

1. **Component-Based Architecture**: Modular, reusable components
2. **Type Safety**: TypeScript for better development experience
3. **State Management**: React hooks for interactive features
4. **Performance**: Optimized rendering and bundle splitting
5. **Developer Experience**: Hot reloading, ESLint, and modern tooling

### Enhanced Interactivity

1. **Smooth Animations**: Framer Motion for advanced animations
2. **Responsive Tab Navigation**: Dynamic content switching
3. **Interactive Elements**: Hover effects and micro-interactions
4. **Progressive Enhancement**: Works without JavaScript

### API Integration Ready

1. **RESTful Backend**: FastAPI for data management
2. **Type-Safe API**: Pydantic models for data validation
3. **CORS Support**: Ready for production deployment
4. **Extensible**: Easy to add new endpoints and features

## 🎨 Design Features

- **Dark Theme**: Professional dark color scheme
- **Gradient Accents**: Beautiful blue gradient highlights
- **Custom Animations**: CSS animations for floating elements
- **Typography**: Inter font for modern readability
- **Icons**: Font Awesome for consistent iconography
- **Responsive Grid**: Tailwind CSS for responsive layouts

## 📱 Responsive Design

The portfolio is fully responsive and works perfectly on:
- **Desktop** (1200px and above)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 🚀 Deployment

### Frontend Deployment
```bash
cd portfolio-react
npm run build
# Deploy the 'build' folder to your hosting service
```

### Backend Deployment
```bash
cd backend
# Install dependencies in production
pip install -r requirements.txt
# Run with production ASGI server
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🔧 Customization

### Adding New Sections
1. Create a new component in `src/components/`
2. Add the tab to `TabNavigation.tsx`
3. Include it in the `App.tsx` switch statement
4. Add corresponding API endpoint in `backend/main.py`

### Styling Customization
- Modify `tailwind.config.js` for theme changes
- Update `src/index.css` for custom styles
- Adjust color scheme in the Tailwind configuration

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

## 📞 Contact

**Shyam Patadia**
- Email: shyampatadia22@gmail.com
- LinkedIn: [shyampatadia](https://www.linkedin.com/in/shyampatadia/)
- GitHub: [shyampatadia](https://github.com/shyampatadia)

---

⭐ **Star this repository if you found it helpful!**