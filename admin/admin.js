// Admin Dashboard JavaScript
// API_BASE is now loaded from config.js
let authToken = localStorage.getItem('admin_token');

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    showDashboard();
  } else {
    showLogin();
  }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    authToken = data.access_token;
    localStorage.setItem('admin_token', authToken);
    showDashboard();
  } catch (error) {
    document.getElementById('login-error').textContent = error.message;
    document.getElementById('login-error').classList.remove('hidden');
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  authToken = null;
  showLogin();
});

// Show/Hide screens
function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadTab('profile');
}

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active', 'border-blue-500', 'text-blue-600');
      b.classList.add('border-transparent', 'text-gray-500');
    });
    btn.classList.add('active', 'border-blue-500', 'text-blue-600');
    btn.classList.remove('border-transparent', 'text-gray-500');

    const tab = btn.dataset.tab;
    loadTab(tab);
  });
});

// Load tab content
async function loadTab(tab) {
  const contentArea = document.getElementById('content-area');

  switch(tab) {
    case 'profile':
      await loadProfile();
      break;
    case 'blog':
      await loadBlogPosts();
      break;
    case 'skills':
      await loadSkills();
      break;
    case 'experience':
      await loadExperience();
      break;
    case 'projects':
      await loadProjects();
      break;
    case 'education':
      await loadEducation();
      break;
    case 'books':
      await loadBooks();
      break;
  }
}

// API helper
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    showLogin();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API request failed');
  }

  return response.status !== 204 ? response.json() : null;
}

// Profile Management
async function loadProfile() {
  const content = document.getElementById('content-area');
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';

  try {
    const profile = await apiCall('/profile');
    content.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-6">Profile Information</h2>
        <form id="profile-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Name</label>
              <input type="text" name="name" value="${profile.name}" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Title</label>
              <input type="text" name="title" value="${profile.title}" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Email</label>
              <input type="email" name="email" value="${profile.email}" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Phone</label>
              <input type="text" name="phone" value="${profile.phone || ''}" class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-2">Bio</label>
              <textarea name="bio" rows="4" class="w-full px-4 py-2 border rounded-lg" required>${profile.bio}</textarea>
            </div>
          </div>
          <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Save Changes
          </button>
        </form>
      </div>
    `;

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      try {
        await apiCall('/profile', {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        alert('Profile updated successfully!');
      } catch (error) {
        alert('Error updating profile: ' + error.message);
      }
    });
  } catch (error) {
    content.innerHTML = `<div class="text-red-600">Error loading profile: ${error.message}</div>`;
  }
}

// Blog Posts Management
async function loadBlogPosts() {
  const content = document.getElementById('content-area');
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';

  try {
    const data = await apiCall('/blog/posts?published_only=false');
    const posts = data.posts;

    content.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Blog Posts</h2>
          <button onclick="showNewBlogPost()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>New Post
          </button>
        </div>
        <div class="space-y-4">
          ${posts.length === 0 ? '<p class="text-gray-500">No blog posts yet.</p>' : ''}
          ${posts.map(post => `
            <div class="border rounded-lg p-4 flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">${post.title}</h3>
                <p class="text-sm text-gray-600">${post.excerpt}</p>
                <div class="mt-2 flex gap-2">
                  <span class="px-2 py-1 bg-gray-100 rounded text-xs">${post.category}</span>
                  <span class="px-2 py-1 ${post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded text-xs">
                    ${post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button onclick="editBlogPost('${post.id}')" class="text-blue-600 hover:text-blue-800">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBlogPost('${post.id}')" class="text-red-600 hover:text-red-800">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="text-red-600">Error loading blog posts: ${error.message}</div>`;
  }
}

// Skills, Experience, Projects, etc. - Similar pattern
async function loadSkills() {
  const content = document.getElementById('content-area');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Skills Management</h2>
      <p class="text-gray-600">Skills management interface - coming soon</p>
    </div>
  `;
}

async function loadExperience() {
  const content = document.getElementById('content-area');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Experience Management</h2>
      <p class="text-gray-600">Experience management interface - coming soon</p>
    </div>
  `;
}

async function loadProjects() {
  const content = document.getElementById('content-area');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Projects Management</h2>
      <p class="text-gray-600">Projects management interface - coming soon</p>
    </div>
  `;
}

async function loadEducation() {
  const content = document.getElementById('content-area');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Education Management</h2>
      <p class="text-gray-600">Education management interface - coming soon</p>
    </div>
  `;
}

async function loadBooks() {
  const content = document.getElementById('content-area');
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Bookshelf Management</h2>
      <p class="text-gray-600">Bookshelf management interface - coming soon</p>
    </div>
  `;
}

// Blog post CRUD operations
function showNewBlogPost() {
  // Implement blog post editor
  alert('Blog post editor - to be implemented');
}

function editBlogPost(id) {
  alert(`Edit post ${id} - to be implemented`);
}

async function deleteBlogPost(id) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  try {
    await apiCall(`/blog/posts/${id}`, { method: 'DELETE' });
    alert('Post deleted successfully!');
    loadBlogPosts();
  } catch (error) {
    alert('Error deleting post: ' + error.message);
  }
}
