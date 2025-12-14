"""
Content schemas for skills, projects, experience, etc.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date


# Skills
class SkillBase(BaseModel):
    name: str
    category: str
    proficiency: Optional[int] = None  # 1-5
    order: Optional[int] = 0


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    proficiency: Optional[int] = None
    order: Optional[int] = None


class SkillResponse(SkillBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True


# Experience
class ExperienceBase(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    current: bool = False
    description: str
    technologies: List[str] = []
    order: Optional[int] = 0


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    current: Optional[bool] = None
    description: Optional[str] = None
    technologies: Optional[List[str]] = None
    order: Optional[int] = None


class ExperienceResponse(ExperienceBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True


# Projects
class ProjectBase(BaseModel):
    title: str
    description: str
    technologies: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    image_url: Optional[str] = None
    featured: bool = False
    order: Optional[int] = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[List[str]] = None
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    image_url: Optional[str] = None
    featured: Optional[bool] = None
    order: Optional[int] = None


class ProjectResponse(ProjectBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True


# Education
class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: date
    end_date: Optional[date] = None
    current: bool = False
    grade: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = 0


class EducationCreate(EducationBase):
    pass


class EducationUpdate(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    current: Optional[bool] = None
    grade: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class EducationResponse(EducationBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True


# Certifications
class CertificationBase(BaseModel):
    name: str
    issuer: str
    issue_date: date
    expiry_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    order: Optional[int] = 0


class CertificationCreate(CertificationBase):
    pass


class CertificationUpdate(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    order: Optional[int] = None


class CertificationResponse(CertificationBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True
