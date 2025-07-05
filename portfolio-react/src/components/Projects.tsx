import React from 'react';

const Projects: React.FC = () => {
  const featuredProject = {
    title: 'AI-Powered Web Navigation Agent',
    description: 'An intelligent agent that autonomously navigates web applications for testing and validation purposes. Built with state-of-the-art LLM technologies to improve efficiency and reduce manual testing efforts.',
    icon: 'fas fa-robot',
    responsibilities: [
      'Managed end-to-end product development from concept to implementation, including agent coding',
      'Created system architecture and led a cross-functional team through agile sprints',
      'Integrated LLM technologies to improve web application testing efficiency',
    ],
    technologies: ['AI/ML', 'Python', 'Selenium', 'LLMs'],
    featured: true,
  };

  const otherProjects = [
    {
      title: 'GxP-Compliant Agile Development Service',
      description: 'A comprehensive service built on Atlassian Jira to enable GxP-compliant Agile sprint development, balancing regulatory requirements with Agile methodologies.',
      icon: 'fas fa-clipboard-check',
      responsibilities: [
        'Developed a comprehensive service on Atlassian Jira for GxP-based Agile sprint development',
        'Ensured compliance with regulatory requirements while maintaining Agile principles',
      ],
      technologies: ['Jira', 'GxP', 'Agile'],
    },
    {
      title: 'Sentiment-Based Trading System',
      description: 'An innovative intraday trading system leveraging news sentiment analysis and technical indicators to make informed trading decisions, achieving impressive returns.',
      icon: 'fas fa-chart-line',
      responsibilities: [
        'Built an intraday trading system based on news sentiment analysis and technical indicators',
        'Adapted BERT model for financial sentiment classification, achieving ~2.6% average daily return',
      ],
      technologies: ['Python', 'BERT', 'NLP', 'Finance'],
    },
    {
      title: 'Wikipedia Content Extractor',
      description: 'A Python utility that efficiently extracts and organizes content from Wikipedia pages, outputting structured JSON data for further use in applications or research.',
      icon: 'fas fa-code',
      responsibilities: [
        'Wrote a Python script to extract and organize Wikipedia content',
        'Created JSON output with URLs and associated content',
      ],
      technologies: ['Python', 'Web Scraping', 'JSON'],
      github: 'https://github.com/shyampatadia/Wikipedia_Extractor',
    },
  ];

  return (
    <section className="text-gray-300">
      <div className="section-header mb-6">
        <h2 className="text-2xl font-bold text-white relative inline-block">
          <span className="relative z-10">Featured Projects</span>
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-primary to-transparent"></span>
        </h2>
      </div>
      
      {/* Featured Project */}
      <div className="mb-8 bg-[#1c222f] rounded-lg border border-[#232a3a] overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-[#1e3a70] bg-opacity-30 flex items-center justify-center p-8">
            <div className="w-32 h-32 rounded-full bg-[#232a3a] flex items-center justify-center shadow-lg">
              <i className={`${featuredProject.icon} text-5xl text-blue-primary`}></i>
            </div>
          </div>
          
          <div className="md:w-2/3 p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-2xl font-bold text-white">{featuredProject.title}</h3>
              <span className="ml-auto bg-[#1e3a70] text-blue-200 px-3 py-1 rounded-full text-sm">Featured</span>
            </div>
            
            <p className="text-gray-300 mb-4">{featuredProject.description}</p>
            
            <div className="mb-4">
              <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                <i className="fas fa-tasks mr-2"></i>
                <span>Key Responsibilities</span>
              </h4>
              <ul className="space-y-2 pl-6">
                {featuredProject.responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start">
                    <i className="fas fa-check-circle text-blue-primary mt-1 mr-2 text-sm"></i>
                    <span>{responsibility}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {featuredProject.technologies.map((tech, index) => (
                <span key={index} className="bg-[#232a3a] px-3 py-1 rounded-full text-xs text-blue-200">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Other Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {otherProjects.map((project, index) => (
          <div key={index} className="bg-[#1c222f] rounded-lg border border-[#232a3a] overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-[#232a3a] rounded-lg mr-4">
                  <i className={`${project.icon} text-xl text-blue-primary`}></i>
                </div>
                <h3 className="text-xl font-semibold text-white">{project.title}</h3>
              </div>
              
              <p className="text-gray-300 mb-4">{project.description}</p>
              
              <div className="mb-4">
                <ul className="space-y-2">
                  {project.responsibilities.map((responsibility, respIndex) => (
                    <li key={respIndex} className="flex items-start">
                      <i className="fas fa-check-circle text-blue-primary mt-1 mr-2 text-sm"></i>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, techIndex) => (
                  <span key={techIndex} className="bg-[#232a3a] px-3 py-1 rounded-full text-xs text-blue-200">
                    {tech}
                  </span>
                ))}
              </div>
              
              {project.github && (
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-primary hover:text-white transition-colors duration-200"
                >
                  <i className="fab fa-github mr-2"></i>
                  <span>View on GitHub</span>
                  <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                </a>
              )}
            </div>
          </div>
        ))}
        
        {/* More Projects Card */}
        <div className="bg-[#1c222f] rounded-lg border border-[#232a3a] overflow-hidden shadow-lg">
          <div className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#232a3a] flex items-center justify-center mb-4">
              <i className="fas fa-rocket text-2xl text-blue-primary"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">More Projects</h3>
            <p className="text-gray-400 mb-4">Additional projects and open source contributions coming soon!</p>
            
            <a 
              href="https://github.com/shyampatadia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-[#232a3a] hover:bg-[#1e3a70] text-blue-primary hover:text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <i className="fab fa-github mr-2"></i>
              <span>Follow on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;