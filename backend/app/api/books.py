"""
Books/Bookshelf API routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.schemas.book import BookCreate, BookUpdate, BookResponse, BookStatsResponse
from app.core.security import get_current_user
from app.core.supabase import supabase_client


router = APIRouter(prefix="/api/books", tags=["Books"])


@router.get("", response_model=List[BookResponse])
async def get_books(status_filter: str = None):
    """
    Get all books, optionally filtered by status
    """
    query = supabase_client.table("books").select("*")

    if status_filter:
        query = query.eq("status", status_filter)

    response = query.order("created_at", desc=True).execute()
    return response.data


@router.get("/stats", response_model=BookStatsResponse)
async def get_book_stats():
    """
    Get reading statistics
    """
    response = supabase_client.rpc("reading_stats").execute()

    if response.data and len(response.data) > 0:
        stats = response.data[0]
        return BookStatsResponse(
            total_read=stats.get("total_read", 0),
            currently_reading=stats.get("currently_reading", 0),
            to_read=stats.get("to_read", 0)
        )

    # Fallback: calculate manually
    all_books = supabase_client.table("books").select("status").execute()
    total_read = sum(1 for book in all_books.data if book["status"] == "read")
    currently_reading = sum(1 for book in all_books.data if book["status"] == "reading")
    to_read = sum(1 for book in all_books.data if book["status"] == "to-read")

    return BookStatsResponse(
        total_read=total_read,
        currently_reading=currently_reading,
        to_read=to_read
    )


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: str):
    """
    Get a single book by ID
    """
    response = supabase_client.table("books").select("*").eq("id", book_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Book not found")

    return response.data[0]


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book: BookCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new book (authenticated users only)
    """
    response = supabase_client.table("books").insert(book.model_dump()).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create book")

    return response.data[0]


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: str,
    book: BookUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a book (authenticated users only)
    """
    update_data = book.model_dump(exclude_unset=True)

    response = supabase_client.table("books").update(update_data).eq("id", book_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Book not found")

    return response.data[0]


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a book (authenticated users only)
    """
    response = supabase_client.table("books").delete().eq("id", book_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Book not found")

    return None
