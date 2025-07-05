import React from 'react';

const Certifications: React.FC = () => {
  const certifications = [
    {
      title: 'Azure DevOps - AZ-900',
      issuer: 'Microsoft',
      issued: '2024',
      expiration: 'No Expiration',
      description: 'Gained foundational knowledge of Azure services, cloud concepts, and core Azure DevOps principles, which enhanced my ability to manage CI/CD pipelines and cloud resources effectively.',
      technologies: ['Azure', 'Cloud'],
      verifyUrl: 'https://learn.microsoft.com/api/credentials/share/en-us/shyampatadia-8140/29B59629A9ED3204?sharingId=E0BA6AFC4738A529',
      icon: 'fas fa-cloud',
    },
    {
      title: 'Certified Scrum Developer',
      issuer: 'Scrum Alliance',
      issued: '2022',
      expiration: 'Valid for 2 years',
      description: 'Acquired practical skills in Agile methodologies, Scrum practices, and teamwork, enabling me to contribute effectively to agile development teams and deliver high-quality software iteratively.',
      technologies: ['Agile', 'Scrum'],
      verifyUrl: 'https://www.linkedin.com/in/shyampatadia/details/certifications/1727168532659/single-media-viewer/?type=DOCUMENT&profileId=ACoAABwgP5MBGig335e2bdKco_sWHOZKwbBuM9g',
      icon: 'fas fa-users-cog',
    },
    {
      title: 'Software Development Processes',
      issuer: 'Coursera',
      issued: '2021',
      expiration: 'No Expiration',
      description: 'Enhanced understanding of various software development lifecycles, best practices, and methodologies, enabling me to optimize project workflows and improve code quality through structured processes.',
      technologies: ['SDLC', 'Methodology'],
      verifyUrl: 'https://coursera.org/verify/LYMPLSJXAM5P',
      icon: 'fas fa-code-branch',
    },
  ];

  const timeline = [
    { title: 'Azure DevOps', year: '2024' },
    { title: 'Scrum Developer', year: '2022' },
    { title: 'SDLC Processes', year: '2021' },
  ];

  return (
    <section className="text-gray-300">
      <div className="section-header mb-6">
        <h2 className="text-2xl font-bold text-white relative inline-block">
          <span className="relative z-10">Certifications</span>
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-primary to-transparent"></span>
        </h2>
        <p className="text-gray-400 mt-2 text-sm max-w-3xl">
          Professional certifications that validate my expertise in cloud computing, agile methodologies, and software development best practices.
        </p>
      </div>
      
      {/* Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {certifications.map((cert, index) => (
          <div key={index} className="bg-[#1c222f] rounded-lg border border-[#232a3a] overflow-hidden shadow-lg group hover:border-blue-primary transition-all duration-300 h-full flex flex-col">
            {/* Certificate Header */}
            <div className="bg-[#232a3a] p-4 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-primary to-[#1e3a70]"></div>
              <div className="flex items-center">
                <div className="p-3 bg-[#1e3a70] rounded-lg shadow-md mr-4 group-hover:bg-blue-primary transition-all duration-300">
                  <i className={`${cert.icon} text-xl text-white`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{cert.title}</h3>
                  <p className="text-blue-primary text-sm mt-1">{cert.issuer}</p>
                </div>
              </div>
            </div>
            
            {/* Certificate Content */}
            <div className="p-5 flex-grow flex flex-col">
              <div className="mb-2 pb-2 border-b border-[#354056]">
                <div className="flex items-center text-sm text-gray-400">
                  <i className="fas fa-calendar-alt text-blue-primary mr-2"></i>
                  <span>Issued: {cert.issued}</span>
                  <span className="mx-2">•</span>
                  <span>{cert.expiration}</span>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 text-sm flex-grow">{cert.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-wrap gap-2">
                  {cert.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className="bg-[#1e3a70] bg-opacity-40 px-2 py-0.5 rounded-full text-xs text-blue-200">
                      {tech}
                    </span>
                  ))}
                </div>
                
                <a 
                  href={cert.verifyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-primary hover:text-white transition-colors duration-200 text-sm"
                >
                  <span>Verify</span>
                  <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Certification Journey */}
      <div className="bg-[#1c222f] rounded-lg border border-[#232a3a] p-6 shadow-lg mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <i className="fas fa-graduation-cap text-blue-primary mr-3"></i>
          <span>Certification Journey</span>
        </h3>
        
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-full md:w-2/3">
            <p className="text-gray-300 mb-4">
              My certification journey reflects my commitment to continuous learning and professional growth in the fields of software development, cloud computing, and agile methodologies. Each certification has helped me enhance my skills and deliver more value in my professional roles.
            </p>
            
            <div className="bg-[#232a3a] rounded-lg p-4 border border-[#354056]">
              <h4 className="text-blue-primary font-medium mb-3 flex items-center">
                <i className="fas fa-lightbulb mr-2"></i>
                <span>Key Learnings</span>
              </h4>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="mr-3 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-primary"></div>
                  <span className="text-sm">Modern cloud architecture and services deployment on Azure</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-primary"></div>
                  <span className="text-sm">Agile and Scrum methodologies for team collaboration and efficient software delivery</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-primary"></div>
                  <span className="text-sm">Software development lifecycle optimization and best practices</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 bg-[#232a3a] bg-opacity-50 rounded-lg p-4 border border-[#354056]">
            <h4 className="text-blue-primary font-medium mb-3 text-center">Certification Timeline</h4>
            
            <div className="relative pl-8 before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-[#1e3a70]">
              {timeline.map((item, index) => (
                <div key={index} className="relative mb-4">
                  <div className="absolute left-[-20px] top-1 w-4 h-4 rounded-full bg-blue-primary"></div>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm">{item.title}</p>
                    <span className="text-blue-200 text-xs">{item.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Future Plans */}
      <div className="bg-[#232a3a] rounded-lg p-5 border border-[#354056] text-center">
        <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-[#1e3a70] mb-3">
          <i className="fas fa-rocket text-xl text-blue-primary"></i>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Future Certification Goals</h3>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          I'm constantly looking to expand my knowledge and skills. My next certification goals include 
          advanced Azure certifications, AI/ML specializations, and deepening my expertise in modern software architecture.
        </p>
      </div>
    </section>
  );
};

export default Certifications;