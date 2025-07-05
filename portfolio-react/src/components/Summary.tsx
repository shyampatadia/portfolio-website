import React from 'react';

const Summary: React.FC = () => {
  return (
    <section className="text-gray-300">
      <div className="section-header mb-6">
        <h2 className="text-2xl font-bold text-white relative inline-block">
          <span className="relative z-10">About Me</span>
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-primary to-transparent"></span>
        </h2>
      </div>
      
      <div className="summary-content">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-3">
            <div className="bg-[#232a3a] rounded-lg p-5 shadow-md border border-gray-800">
              <p className="mb-4">
                Software Engineer with experience in developing test automation infrastructure using Selenium Grid and integrating CI/CD pipelines. Proficient in containerization with Docker and Azure DevOps to streamline deployment processes.
              </p>
              <p className="mb-4">
                Experienced in implementing GxP-compliant software development life cycle (SDLC) processes and developing end-to-end test automation suits for web, desktop, and API applications.
              </p>
              <p className="mb-4">
                Skilled in creating automation scripts for data processing using PowerShell and Python. Certified in Azure DevOps, Scrum methodologies, and committed to best practices in software development.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-[#232a3a] rounded-lg p-5 shadow-md border border-gray-800 h-full">
              <h3 className="text-blue-400 font-semibold mb-3 flex items-center">
                <i className="fas fa-certificate mr-2"></i>Quick Facts
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <i className="fas fa-map-marker-alt text-blue-400 mt-1 mr-2"></i>
                  <span>Rajkot, Gujarat, India</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-language text-blue-400 mt-1 mr-2"></i>
                  <span>English, Hindi, Gujarati</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-clock text-blue-400 mt-1 mr-2"></i>
                  <span>3.5+ Years Experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Summary;