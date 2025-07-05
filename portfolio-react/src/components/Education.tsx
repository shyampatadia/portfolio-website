import React from 'react';

const Education: React.FC = () => {
  const education = [
    {
      degree: 'Bachelor of Engineering in Computer Science',
      institution: 'Gujarat Technological University',
      period: '2017 - 2021',
      location: 'Gujarat, India',
      grade: 'CGPA: 8.5/10',
      coursework: [
        'Data Structures and Algorithms',
        'Software Engineering',
        'Database Management Systems',
        'Computer Networks',
        'Machine Learning',
        'Web Development',
      ],
    },
  ];

  return (
    <section className="text-gray-300">
      <div className="section-header mb-6">
        <h2 className="text-2xl font-bold text-white relative inline-block">
          <span className="relative z-10">Education</span>
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-primary to-transparent"></span>
        </h2>
      </div>
      
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div key={index} className="bg-[#1c222f] rounded-lg border border-[#232a3a] overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">{edu.degree}</h2>
                  <h3 className="text-blue-primary font-medium">{edu.institution}</h3>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className="text-gray-400 text-sm">{edu.period}</p>
                  <p className="text-gray-400 text-sm">{edu.location}</p>
                  <p className="text-blue-200 text-sm font-medium">{edu.grade}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                  <i className="fas fa-book mr-2"></i>
                  <span>Relevant Coursework</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {edu.coursework.map((course, courseIndex) => (
                    <span
                      key={courseIndex}
                      className="bg-[#232a3a] px-3 py-1 rounded-full text-xs text-blue-200"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Education;