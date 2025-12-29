"""
Tests for blog API endpoints
"""
import pytest
from unittest.mock import patch, Mock
from fastapi import status


class TestBlogPostCreation:
    """Tests for creating blog posts"""

    @patch('app.api.blog.supabase_admin')
    def test_create_blog_post_success(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        sample_blog_post,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test successful blog post creation"""
        # Mock the Supabase insert response
        mock_table = Mock()
        mock_insert = Mock()
        mock_execute = Mock()

        mock_execute.return_value = mock_supabase_response([sample_blog_post_response])
        mock_insert.execute = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase_admin.table.return_value = mock_table

        # Make the request
        response = client.post(
            "/api/blog/posts",
            json=sample_blog_post,
            headers=auth_headers
        )

        # Assertions
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == sample_blog_post["title"]
        assert data["author_id"] == "00000000-0000-0000-0000-000000000000"
        assert data["read_time"] == "1 min"

        # Verify the insert was called with author_id
        call_args = mock_table.insert.call_args[0][0]
        assert "author_id" in call_args
        assert call_args["author_id"] == "00000000-0000-0000-0000-000000000000"

    @patch('app.api.blog.supabase_admin')
    def test_create_blog_post_author_id_not_none(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        sample_blog_post,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test that author_id is never None when creating a blog post"""
        # Mock the Supabase insert response
        mock_table = Mock()
        mock_insert = Mock()
        mock_execute = Mock()

        mock_execute.return_value = mock_supabase_response([sample_blog_post_response])
        mock_insert.execute = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase_admin.table.return_value = mock_table

        # Make the request
        response = client.post(
            "/api/blog/posts",
            json=sample_blog_post,
            headers=auth_headers
        )

        # Verify the insert was called
        assert mock_table.insert.called
        insert_data = mock_table.insert.call_args[0][0]

        # Critical assertion: author_id must not be None
        assert insert_data["author_id"] is not None
        assert insert_data["author_id"] == "00000000-0000-0000-0000-000000000000"

    def test_create_blog_post_unauthorized(self, client, sample_blog_post):
        """Test that creating a blog post without authentication fails"""
        response = client.post(
            "/api/blog/posts",
            json=sample_blog_post
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_blog_post_invalid_token(self, client, sample_blog_post):
        """Test that creating a blog post with invalid token fails"""
        response = client.post(
            "/api/blog/posts",
            json=sample_blog_post,
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.api.blog.supabase_admin')
    def test_create_blog_post_calculates_read_time(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        mock_supabase_response
    ):
        """Test that read time is calculated correctly"""
        # Create a post with exactly 400 words (should be 2 min read time)
        content = " ".join(["word"] * 400)
        blog_post = {
            "title": "Read Time Test",
            "slug": "read-time-test",
            "excerpt": "Testing read time calculation",
            "content": content,
            "category": "Test",
            "tags": ["test"],
            "published": False
        }

        response_data = {
            **blog_post,
            "id": "123",
            "author_id": "00000000-0000-0000-0000-000000000000",
            "read_time": "2 min",
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "published_at": None
        }

        mock_table = Mock()
        mock_insert = Mock()
        mock_execute = Mock()
        mock_execute.return_value = mock_supabase_response([response_data])
        mock_insert.execute = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase_admin.table.return_value = mock_table

        response = client.post(
            "/api/blog/posts",
            json=blog_post,
            headers=auth_headers
        )

        # Check that read_time was calculated
        insert_data = mock_table.insert.call_args[0][0]
        assert insert_data["read_time"] == "2 min"

    @patch('app.api.blog.supabase_admin')
    def test_create_blog_post_sets_published_at(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        sample_blog_post,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test that published_at is set when post is published"""
        mock_table = Mock()
        mock_insert = Mock()
        mock_execute = Mock()
        mock_execute.return_value = mock_supabase_response([sample_blog_post_response])
        mock_insert.execute = mock_execute
        mock_table.insert.return_value = mock_insert
        mock_supabase_admin.table.return_value = mock_table

        response = client.post(
            "/api/blog/posts",
            json=sample_blog_post,
            headers=auth_headers
        )

        # Check that published_at was set
        insert_data = mock_table.insert.call_args[0][0]
        assert "published_at" in insert_data
        assert insert_data["published_at"] is not None


class TestBlogPostRetrieval:
    """Tests for retrieving blog posts"""

    @patch('app.api.blog.supabase_client')
    def test_get_blog_posts(
        self,
        mock_supabase_client,
        client,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test retrieving blog posts list"""
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        mock_order = Mock()
        mock_range = Mock()

        mock_range.execute.return_value = mock_supabase_response([sample_blog_post_response], count=1)
        mock_order.range.return_value = mock_range
        mock_eq.order.return_value = mock_order
        mock_select.eq.return_value = mock_eq
        mock_table.select.return_value = mock_select
        mock_supabase_client.table.return_value = mock_table

        response = client.get("/api/blog/posts")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert data["total"] == 1

    @patch('app.api.blog.supabase_admin')
    def test_get_blog_post_by_id(
        self,
        mock_supabase_admin,
        client,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test retrieving a single blog post by ID (uses admin client to access unpublished posts)"""
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()

        mock_eq.execute.return_value = mock_supabase_response([sample_blog_post_response])
        mock_select.eq.return_value = mock_eq
        mock_table.select.return_value = mock_select
        mock_supabase_admin.table.return_value = mock_table

        response = client.get(f"/api/blog/posts/{sample_blog_post_response['id']}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_blog_post_response["id"]

    @patch('app.api.blog.supabase_admin')
    def test_get_blog_post_not_found(self, mock_supabase_admin, client, mock_supabase_response):
        """Test retrieving a non-existent blog post"""
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()

        mock_eq.execute.return_value = mock_supabase_response([])
        mock_select.eq.return_value = mock_eq
        mock_table.select.return_value = mock_select
        mock_supabase_admin.table.return_value = mock_table

        response = client.get("/api/blog/posts/nonexistent-id")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestBlogPostUpdate:
    """Tests for updating blog posts"""

    @patch('app.api.blog.supabase_admin')
    def test_update_blog_post(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test updating a blog post (uses admin client for both fetch and update)"""
        # Need to mock table() being called twice - once for select, once for update
        mock_table_calls = []

        # First call: select existing post
        mock_select_table = Mock()
        mock_select = Mock()
        mock_select_eq = Mock()
        mock_select_eq.execute.return_value = mock_supabase_response([sample_blog_post_response])
        mock_select.eq.return_value = mock_select_eq
        mock_select_table.select.return_value = mock_select
        mock_table_calls.append(mock_select_table)

        # Second call: update post
        updated_post = {**sample_blog_post_response, "title": "Updated Title"}
        mock_update_table = Mock()
        mock_update = Mock()
        mock_update_eq = Mock()
        mock_update_eq.execute.return_value = mock_supabase_response([updated_post])
        mock_update.eq.return_value = mock_update_eq
        mock_update_table.update.return_value = mock_update
        mock_table_calls.append(mock_update_table)

        # Return different mocks for each call
        mock_supabase_admin.table.side_effect = mock_table_calls

        response = client.put(
            f"/api/blog/posts/{sample_blog_post_response['id']}",
            json={"title": "Updated Title"},
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"


class TestBlogPostDeletion:
    """Tests for deleting blog posts"""

    @patch('app.api.blog.supabase_admin')
    def test_delete_blog_post(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        sample_blog_post_response,
        mock_supabase_response
    ):
        """Test deleting a blog post"""
        mock_table = Mock()
        mock_delete = Mock()
        mock_eq = Mock()
        mock_eq.execute.return_value = mock_supabase_response([sample_blog_post_response])
        mock_delete.eq.return_value = mock_eq
        mock_table.delete.return_value = mock_delete
        mock_supabase_admin.table.return_value = mock_table

        response = client.delete(
            f"/api/blog/posts/{sample_blog_post_response['id']}",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @patch('app.api.blog.supabase_admin')
    def test_delete_blog_post_not_found(
        self,
        mock_supabase_admin,
        client,
        auth_headers,
        mock_supabase_response
    ):
        """Test deleting a non-existent blog post"""
        mock_table = Mock()
        mock_delete = Mock()
        mock_eq = Mock()
        mock_eq.execute.return_value = mock_supabase_response([])
        mock_delete.eq.return_value = mock_eq
        mock_table.delete.return_value = mock_delete
        mock_supabase_admin.table.return_value = mock_table

        response = client.delete(
            "/api/blog/posts/nonexistent-id",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
