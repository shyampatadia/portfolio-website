from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Portfolio API", description="API for Shyam Patadia's Portfolio", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
]

@app.get("/")
async def root():
    return {"message": "Portfolio API", "version": "1.0.0"}

@app.get("/api/personal-info", response_model=PersonalInfo)
async def get_personal_info():
    return personal_info

@app.get("/api/skills", response_model=List[SkillCategory])
async def get_skills():
    return skill_categories

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)