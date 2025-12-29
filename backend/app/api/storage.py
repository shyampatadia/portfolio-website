"""Storage API routes for image uploads to Supabase Storage"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from app.core.security import get_current_user
from app.core.supabase import supabase_client, supabase_admin
import uuid
from typing import Dict, List

router = APIRouter(prefix="/storage", tags=["Storage"])

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image_file(file: UploadFile) -> None:
    """Validate file type and extension"""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )

    ext = '.' + file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )


@router.post("/upload/blog", status_code=status.HTTP_201_CREATED)
async def upload_blog_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Upload an image for blog posts

    - Requires authentication
    - Max file size: 5MB
    - Allowed formats: jpg, jpeg, png, gif, webp
    - Uploads to: portfolio-images/blog/
    """
    validate_image_file(file)

    # Read file contents
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )

    # Generate unique filename
    ext = '.' + file.filename.split('.')[-1].lower()
    unique_filename = f"blog/{uuid.uuid4()}{ext}"

    try:
        # Upload to Supabase Storage
        supabase_admin.storage.from_("portfolio-images").upload(
            unique_filename,
            contents,
            file_options={"content-type": file.content_type}
        )

        # Get public URL
        public_url = supabase_admin.storage.from_("portfolio-images").get_public_url(unique_filename)

        return {
            "url": public_url,
            "filename": unique_filename,
            "size": f"{len(contents) / 1024:.2f} KB"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/upload/book-cover", status_code=status.HTTP_201_CREATED)
async def upload_book_cover(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Upload a book cover image

    - Requires authentication
    - Max file size: 5MB
    - Allowed formats: jpg, jpeg, png, gif, webp
    - Uploads to: portfolio-images/books/
    """
    validate_image_file(file)

    # Read file contents
    contents = await file.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )

    # Generate unique filename
    ext = '.' + file.filename.split('.')[-1].lower()
    unique_filename = f"books/{uuid.uuid4()}{ext}"

    try:
        # Upload to Supabase Storage
        supabase_admin.storage.from_("portfolio-images").upload(
            unique_filename,
            contents,
            file_options={"content-type": file.content_type}
        )

        # Get public URL
        public_url = supabase_admin.storage.from_("portfolio-images").get_public_url(unique_filename)

        return {
            "url": public_url,
            "filename": unique_filename,
            "size": f"{len(contents) / 1024:.2f} KB"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/upload/blog/multiple", status_code=status.HTTP_201_CREATED)
async def upload_multiple_blog_images(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, str]]:
    """
    Upload multiple images for blog posts

    - Requires authentication
    - Max file size per image: 5MB
    - Max files: 10
    - Allowed formats: jpg, jpeg, png, gif, webp
    - Returns: List of URLs that can be inserted into blog content
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images per upload"
        )

    uploaded_images = []
    errors = []

    for file in files:
        try:
            validate_image_file(file)

            # Read file contents
            contents = await file.read()

            # Validate file size
            if len(contents) > MAX_FILE_SIZE:
                errors.append(f"{file.filename}: File too large (max 5MB)")
                continue

            # Generate unique filename
            ext = '.' + file.filename.split('.')[-1].lower()
            unique_filename = f"blog/{uuid.uuid4()}{ext}"

            # Upload to Supabase Storage
            supabase_admin.storage.from_("portfolio-images").upload(
                unique_filename,
                contents,
                file_options={"content-type": file.content_type}
            )

            # Get public URL
            public_url = supabase_admin.storage.from_("portfolio-images").get_public_url(unique_filename)

            uploaded_images.append({
                "url": public_url,
                "filename": unique_filename,
                "original_name": file.filename,
                "size": f"{len(contents) / 1024:.2f} KB",
                "markdown": f"![{file.filename}]({public_url})"  # Ready-to-use markdown
            })
        except HTTPException as e:
            errors.append(f"{file.filename}: {e.detail}")
        except Exception as e:
            errors.append(f"{file.filename}: Upload failed - {str(e)}")

    if not uploaded_images and errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All uploads failed: {'; '.join(errors)}"
        )

    # Return successful uploads (and log errors if any)
    if errors:
        print(f"[WARNING] Some uploads failed: {errors}")

    return uploaded_images


@router.delete("/delete/{path:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    path: str,
    current_user: dict = Depends(get_current_user)
) -> None:
    """
    Delete an image from storage

    - Requires authentication
    - path: Full path to the file (e.g., "blog/uuid.jpg" or "books/uuid.png")
    """
    try:
        supabase_admin.storage.from_("portfolio-images").remove([path])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete image: {str(e)}"
        )
