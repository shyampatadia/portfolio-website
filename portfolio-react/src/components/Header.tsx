import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="header-section p-8 pb-12 bg-[#1a2235] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#1e3a70] to-transparent opacity-20"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
        
        {/* Floating bubbles */}
        <div className="floating-bubble absolute top-20 left-1/4 w-20 h-20 rounded-full bg-blue-primary animate-float-slow"></div>
        <div className="floating-bubble absolute bottom-24 right-1/5 w-32 h-32 rounded-full bg-blue-primary animate-float-medium"></div>
        <div className="floating-bubble absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-blue-primary animate-float-fast"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 md:gap-12">
          
          {/* Profile image */}
          <div className="profile-container relative animate-float mt-4 md:mt-0">
            {/* Glowing border animation */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-primary via-blue-secondary to-blue-primary rounded-full opacity-70 blur-sm animate-pulse-slow"></div>
            
            {/* Image container */}
            <div className="rounded-full border-4 border-blue-primary overflow-hidden w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 shadow-lg relative z-10">
              <img 
                src="https://avatars.githubusercontent.com/u/65619938?v=4" 
                alt="Shyam Patadia" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* Dev badge */}
            <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 bg-[#2f405e] text-[#c0d6f1] px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-md animate-bounce-subtle z-20">
              <i className="fas fa-code mr-1 sm:mr-2"></i>Dev
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-bold name-gradient mb-1">
              Shyam Patadia
            </h1>
            
            {/* Role */}
            <p className="text-blue-primary text-lg md:text-xl font-medium mb-5">
              Software Developer
            </p>
            
            {/* Skill badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
              <span className="badge-animated bg-[#2f405e] text-[#c0d6f1] px-3.5 py-2 rounded-md text-sm inline-flex items-center">
                <i className="fas fa-laptop-code mr-2"></i>Full Stack
              </span>
              <span className="badge-animated bg-[#2f405e] text-[#c0d6f1] px-3.5 py-2 rounded-md text-sm inline-flex items-center" style={{animationDelay: '0.2s'}}>
                <i className="fas fa-robot mr-2"></i>AI/ML
              </span>
              <span className="badge-animated bg-[#2f405e] text-[#c0d6f1] px-3.5 py-2 rounded-md text-sm inline-flex items-center" style={{animationDelay: '0.4s'}}>
                <i className="fas fa-cloud mr-2"></i>Azure
              </span>
            </div>
            
            {/* Bio */}
            <p className="text-gray-300 max-w-xl md:mx-0 text-base leading-relaxed mb-6 animate-fade-in">
              Passionate developer with expertise in automation, GxP compliance, and AI systems. 
              Specializing in building scalable solutions and optimizing development workflows.
            </p>
            
            {/* Social links */}
            <div className="flex justify-center md:justify-start gap-4 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <a 
                href="https://github.com/shyampatadia" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon bg-[#262f43] hover:bg-[#1e3a70] text-gray-300 hover:text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              >
                <i className="fab fa-github"></i>
              </a>
              <a 
                href="https://www.linkedin.com/in/shyampatadia/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon bg-[#262f43] hover:bg-[#1e3a70] text-gray-300 hover:text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a 
                href="https://twitter.com/shyam300420" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon bg-[#262f43] hover:bg-[#1e3a70] text-gray-300 hover:text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a 
                href="mailto:shyampatadia22@gmail.com" 
                className="social-icon bg-[#262f43] hover:bg-[#1e3a70] text-gray-300 hover:text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              >
                <i className="fas fa-envelope"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;