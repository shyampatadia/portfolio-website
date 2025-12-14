"""
Content API routes (skills, projects, experience, education, certifications)
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.content import (
    SkillCreate, SkillUpdate, SkillResponse,
    ExperienceCreate, ExperienceUpdate, ExperienceResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    EducationCreate, EducationUpdate, EducationResponse,
    CertificationCreate, CertificationUpdate, CertificationResponse
)
from app.core.security import get_current_user
from app.core.supabase import supabase_client


router = APIRouter(prefix="/api/content", tags=["Content"])


# ===== SKILLS =====
@router.get("/skills", response_model=List[SkillResponse])
async def get_skills():
    """Get all skills"""
    response = supabase_client.table("skills").select("*").order("order").execute()
    return response.data


@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(skill: SkillCreate, current_user: dict = Depends(get_current_user)):
    """Create a new skill (authenticated)"""
    response = supabase_client.table("skills").insert(skill.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create skill")
    return response.data[0]


@router.put("/skills/{skill_id}", response_model=SkillResponse)
async def update_skill(skill_id: str, skill: SkillUpdate, current_user: dict = Depends(get_current_user)):
    """Update a skill (authenticated)"""
    update_data = skill.model_dump(exclude_unset=True)
    response = supabase_client.table("skills").update(update_data).eq("id", skill_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Skill not found")
    return response.data[0]


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(skill_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a skill (authenticated)"""
    response = supabase_client.table("skills").delete().eq("id", skill_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Skill not found")
    return None


# ===== EXPERIENCE =====
@router.get("/experience", response_model=List[ExperienceResponse])
async def get_experience():
    """Get all experience"""
    response = supabase_client.table("experience").select("*").order("order").execute()
    return response.data


@router.post("/experience", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(exp: ExperienceCreate, current_user: dict = Depends(get_current_user)):
    """Create new experience (authenticated)"""
    response = supabase_client.table("experience").insert(exp.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create experience")
    return response.data[0]


@router.put("/experience/{exp_id}", response_model=ExperienceResponse)
async def update_experience(exp_id: str, exp: ExperienceUpdate, current_user: dict = Depends(get_current_user)):
    """Update experience (authenticated)"""
    update_data = exp.model_dump(exclude_unset=True)
    response = supabase_client.table("experience").update(update_data).eq("id", exp_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    return response.data[0]


@router.delete("/experience/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(exp_id: str, current_user: dict = Depends(get_current_user)):
    """Delete experience (authenticated)"""
    response = supabase_client.table("experience").delete().eq("id", exp_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Experience not found")
    return None


# ===== PROJECTS =====
@router.get("/projects", response_model=List[ProjectResponse])
async def get_projects():
    """Get all projects"""
    response = supabase_client.table("projects").select("*").order("order").execute()
    return response.data


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    """Create new project (authenticated)"""
    response = supabase_client.table("projects").insert(project.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create project")
    return response.data[0]


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    """Update project (authenticated)"""
    update_data = project.model_dump(exclude_unset=True)
    response = supabase_client.table("projects").update(update_data).eq("id", project_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return response.data[0]


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Delete project (authenticated)"""
    response = supabase_client.table("projects").delete().eq("id", project_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ===== EDUCATION =====
@router.get("/education", response_model=List[EducationResponse])
async def get_education():
    """Get all education"""
    response = supabase_client.table("education").select("*").order("order").execute()
    return response.data


@router.post("/education", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
async def create_education(edu: EducationCreate, current_user: dict = Depends(get_current_user)):
    """Create new education (authenticated)"""
    response = supabase_client.table("education").insert(edu.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create education")
    return response.data[0]


@router.put("/education/{edu_id}", response_model=EducationResponse)
async def update_education(edu_id: str, edu: EducationUpdate, current_user: dict = Depends(get_current_user)):
    """Update education (authenticated)"""
    update_data = edu.model_dump(exclude_unset=True)
    response = supabase_client.table("education").update(update_data).eq("id", edu_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Education not found")
    return response.data[0]


@router.delete("/education/{edu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(edu_id: str, current_user: dict = Depends(get_current_user)):
    """Delete education (authenticated)"""
    response = supabase_client.table("education").delete().eq("id", edu_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Education not found")
    return None


# ===== CERTIFICATIONS =====
@router.get("/certifications", response_model=List[CertificationResponse])
async def get_certifications():
    """Get all certifications"""
    response = supabase_client.table("certifications").select("*").order("order").execute()
    return response.data


@router.post("/certifications", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
async def create_certification(cert: CertificationCreate, current_user: dict = Depends(get_current_user)):
    """Create new certification (authenticated)"""
    response = supabase_client.table("certifications").insert(cert.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create certification")
    return response.data[0]


@router.put("/certifications/{cert_id}", response_model=CertificationResponse)
async def update_certification(cert_id: str, cert: CertificationUpdate, current_user: dict = Depends(get_current_user)):
    """Update certification (authenticated)"""
    update_data = cert.model_dump(exclude_unset=True)
    response = supabase_client.table("certifications").update(update_data).eq("id", cert_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Certification not found")
    return response.data[0]


@router.delete("/certifications/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certification(cert_id: str, current_user: dict = Depends(get_current_user)):
    """Delete certification (authenticated)"""
    response = supabase_client.table("certifications").delete().eq("id", cert_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Certification not found")
    return None
