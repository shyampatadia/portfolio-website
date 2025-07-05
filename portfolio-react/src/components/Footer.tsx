import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-10 text-center relative">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="text-3xl font-bold text-white mb-4">Let's Connect</div>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Looking for a developer with expertise in automation, AI, and GxP compliance? 
              I'm open to discussing new opportunities and collaborations.
            </p>
            
            <div className="flex justify-center gap-4 mb-8">
              <a 
                href="mailto:shyampatadia22@gmail.com" 
                className="bg-gradient-to-r from-blue-primary to-[#3490d9] text-white font-medium py-2 px-6 rounded-md hover:shadow-lg transition-all duration-300 flex items-center"
              >
                <i className="fas fa-envelope mr-2"></i> Email Me
              </a>
              <a 
                href="https://www.linkedin.com/in/shyampatadia/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#232a3a] text-blue-primary border border-blue-primary font-medium py-2 px-6 rounded-md hover:bg-[#1e3a70] hover:text-white transition-all duration-300 flex items-center"
              >
                <i className="fab fa-linkedin-in mr-2"></i> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] to-transparent opacity-70"></div>
      </div>
    </footer>
  );
};

export default Footer;