from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="Portfolio API", 
    description="API for Shyam Patadia's Portfolio", 
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class PersonalInfo(BaseModel):
    name: str
    title: str
    bio: str
    location: str
    languages: List[str]
    experience_years: str
    email: str
    github: str
    linkedin: str
    twitter: str

class Skill(BaseModel):
    name: str
    level: int

class SkillCategory(BaseModel):
    title: str
    icon: str
    skills: List[Skill]

class Experience(BaseModel):
    title: str
    company: str
    period: str
    location: str
    responsibilities: List[str]
    skills: List[str]

class Education(BaseModel):
    degree: str
    institution: str
    period: str
    location: str
    grade: str
    coursework: List[str]

class Project(BaseModel):
    title: str
    description: str
    icon: str
    responsibilities: List[str]
    technologies: List[str]
    github: Optional[str] = None
    featured: bool = False

class Certification(BaseModel):
    title: str
    issuer: str
    issued: str
    expiration: str
    description: str
    technologies: List[str]
    verify_url: str
    icon: str

# Sample Data
personal_info = PersonalInfo(
    name="Shyam Patadia",
    title="Software Developer",
    bio="Passionate developer with expertise in automation, GxP compliance, and AI systems.",
    location="Rajkot, Gujarat, India",
    languages=["English", "Hindi", "Gujarati"],
    experience_years="3.5+ Years Experience",
    email="shyampatadia22@gmail.com",
    github="https://github.com/shyampatadia",
    linkedin="https://www.linkedin.com/in/shyampatadia/",
    twitter="https://twitter.com/shyam300420"
)

skill_categories = [
    SkillCategory(
        title="Development",
        icon="fas fa-code",
        skills=[
            Skill(name="Python", level=5),
            Skill(name="C#", level=4),
            Skill(name="SQL", level=4),
            Skill(name="MongoDB", level=3),
        ]
    ),
    SkillCategory(
        title="Testing & Automation",
        icon="fas fa-vial",
        skills=[
            Skill(name="Selenium", level=5),
            Skill(name="Playwright", level=5),
            Skill(name="xUnit", level=4),
            Skill(name="SpecFlow", level=4),
        ]
    ),
    SkillCategory(
        title="DevOps & Cloud",
        icon="fas fa-server",
        skills=[
            Skill(name="Azure DevOps", level=5),
            Skill(name="Docker", level=4),
            Skill(name="Git", level=4),
            Skill(name="CI/CD", level=4),
        ]
    ),
]

experiences = [
    Experience(
        title="Software Engineer",
        company="Thermo Fisher Scientific",
        period="2021 - Present",
        location="Bangalore, India",
        responsibilities=[
            "Developed test automation infrastructure using Selenium Grid and integrated CI/CD pipelines",
            "Implemented GxP-compliant software development life cycle (SDLC) processes",
            "Created end-to-end test automation suits for web, desktop, and API applications"
        ],
        skills=["Python", "C#", "Selenium", "Docker", "Azure DevOps"]
    )
]

education_list = [
    Education(
        degree="Bachelor of Engineering in Computer Science",
        institution="Gujarat Technological University",
        period="2017 - 2021",
        location="Gujarat, India",
        grade="CGPA: 8.5/10",
        coursework=["Data Structures", "Software Engineering", "Database Management", "Machine Learning"]
    )
]

projects = [
    Project(
        title="AI-Powered Web Navigation Agent",
        description="An intelligent agent that autonomously navigates web applications for testing purposes.",
        icon="fas fa-robot",
        responsibilities=["Managed end-to-end product development", "Created system architecture"],
        technologies=["AI/ML", "Python", "Selenium", "LLMs"],
        featured=True
    )
]

certifications = [
    Certification(
        title="Azure DevOps - AZ-900",
        issuer="Microsoft",
        issued="2024",
        expiration="No Expiration",
        description="Gained foundational knowledge of Azure services and cloud concepts.",
        technologies=["Azure", "Cloud"],
        verify_url="https://learn.microsoft.com/api/credentials/share/en-us/shyampatadia-8140/29B59629A9ED3204",
        icon="fas fa-cloud"
    )
]

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint returning API information"""
    return {"message": "Portfolio API", "version": "1.0.0", "status": "running"}

@app.get("/api/personal-info", response_model=PersonalInfo)
async def get_personal_info():
    """Get personal information"""
    try:
        return personal_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching personal info: {str(e)}")

@app.get("/api/skills", response_model=List[SkillCategory])
async def get_skills():
    """Get skills and categories"""
    try:
        return skill_categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching skills: {str(e)}")

@app.get("/api/experience", response_model=List[Experience])
async def get_experience():
    """Get work experience"""
    try:
        return experiences
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching experience: {str(e)}")

@app.get("/api/education", response_model=List[Education])
async def get_education():
    """Get education information"""
    try:
        return education_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching education: {str(e)}")

@app.get("/api/projects", response_model=List[Project])
async def get_projects():
    """Get projects"""
    try:
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@app.get("/api/certifications", response_model=List[Certification])
async def get_certifications():
    """Get certifications"""
    try:
        return certifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching certifications: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)