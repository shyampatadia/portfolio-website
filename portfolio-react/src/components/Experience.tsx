import React from 'react';

const Experience: React.FC = () => {
  const experiences = [
    {
      title: 'Software Engineer',
      company: 'Thermo Fisher Scientific',
      period: '2021 - Present',
      location: 'Bangalore, India',
      responsibilities: [
        'Developed test automation infrastructure using Selenium Grid and integrated CI/CD pipelines',
        'Implemented GxP-compliant software development life cycle (SDLC) processes',
        'Created end-to-end test automation suits for web, desktop, and API applications',
        'Proficient in containerization with Docker and Azure DevOps to streamline deployment processes',
        'Skilled in creating automation scripts for data processing using PowerShell and Python',
      ],
      skills: ['Python', 'C#', 'Selenium', 'Docker', 'Azure DevOps', 'PowerShell'],
    },
    {
      title: 'AI/ML Research Intern',
      company: 'Independent Research',
      period: '2020 - 2021',
      location: 'Remote',
      responsibilities: [
        'Built an intraday trading system based on news sentiment analysis and technical indicators',
        'Adapted BERT model for financial sentiment classification, achieving ~2.6% average daily return',
        'Developed AI-powered web navigation agent for autonomous testing and validation',
        'Created system architecture and led cross-functional team through agile sprints',
      ],
      skills: ['Python', 'AI/ML', 'BERT', 'NLP', 'Finance', 'System Design'],
    },
  ];

  return (
    <section className="text-gray-300">
      <div className="section-header mb-6">
        <h2 className="text-2xl font-bold text-white relative inline-block">
          <span className="relative z-10">Work Experience</span>
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-primary to-transparent"></span>
        </h2>
      </div>
      
      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <div key={index} className="bg-[#1c222f] rounded-lg border border-[#232a3a] overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{exp.title}</h3>
                  <p className="text-blue-primary font-medium">{exp.company}</p>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className="text-gray-400 text-sm">{exp.period}</p>
                  <p className="text-gray-400 text-sm">{exp.location}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                  <i className="fas fa-tasks mr-2"></i>
                  <span>Key Responsibilities</span>
                </h4>
                <ul className="space-y-2 pl-6">
                  {exp.responsibilities.map((responsibility, respIndex) => (
                    <li key={respIndex} className="flex items-start">
                      <i className="fas fa-check-circle text-blue-primary mt-1 mr-2 text-sm"></i>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {exp.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="bg-[#232a3a] px-3 py-1 rounded-full text-xs text-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Experience;