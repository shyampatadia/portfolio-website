import React from 'react';

const Skills: React.FC = () => {
  const skillCategories = [
    {
      title: 'Development',
      icon: 'fas fa-code',
      skills: [
        { name: 'Python', level: 5 },
        { name: 'C#', level: 4 },
        { name: 'SQL', level: 4 },
        { name: 'MongoDB', level: 3 },
      ],
    },
    {
      title: 'Testing & Automation',
      icon: 'fas fa-vial',
      skills: [
        { name: 'Selenium', level: 5 },
        { name: 'Playwright', level: 5 },
        { name: 'xUnit', level: 4 },
        { name: 'SpecFlow', level: 4 },
      ],
    },
    {
      title: 'DevOps & Cloud',
      icon: 'fas fa-server',
      skills: [
        { name: 'Azure DevOps', level: 5 },
        { name: 'Docker', level: 4 },
        { name: 'Git', level: 4 },
        { name: 'CI/CD', level: 4 },
      ],
    },
  ];

  const renderSkillLevel = (level: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < level ? 'bg-blue-primary' : 'bg-[#232a3a]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="text-gray-300">
      <div className="section-header mb-6">
        <h2 className="text-2xl font-bold text-white relative inline-block">
          <span className="relative z-10">Technical Skills</span>
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-primary to-transparent"></span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {skillCategories.map((category, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-[#1e3a70] to-[#1c222f] rounded-lg p-6 shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="text-center mb-3">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-[#232a3a] border-2 border-blue-primary mb-3">
                <i className={`${category.icon} text-2xl text-blue-primary`}></i>
              </div>
              <h3 className="text-lg font-semibold text-white">{category.title}</h3>
            </div>
            <div className="space-y-2">
              {category.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">{skill.name}</span>
                  {renderSkillLevel(skill.level)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;