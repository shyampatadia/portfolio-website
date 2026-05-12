// Simplified Admin Dashboard JavaScript - Blog & Bookshelf Only
// API_BASE is loaded from config.js
let authToken = localStorage.getItem('admin_token');

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    showDashboard();
  } else {
    showLogin();
  }
});

// ===== LOGIN/LOGOUT =====

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Show loading state
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging in...';
  errorDiv.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid credentials');
    }

    const data = await response.json();
    authToken = data.access_token;
    localStorage.setItem('admin_token', authToken);

    // Success feedback
    submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Success!';
    submitBtn.classList.add('bg-green-600');
    setTimeout(() => showDashboard(), 500);

  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    submitBtn.classList.remove('bg-green-600');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  authToken = null;
  showLogin();
});

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadTab('analytics'); // Default to analytics tab
}

// ===== TAB NAVIGATION =====

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

  // Show loading indicator
  contentArea.innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
      <p class="text-gray-600">Loading...</p>
    </div>
  `;

  try {
    switch(tab) {
      case 'analytics':
        await loadAnalyticsDashboard();
        break;
      case 'visitors':
        await loadAnalyticsDashboard();
        break;
      case 'blog-analytics':
        await loadBlogAnalytics();
        break;
      case 'blog':
        await loadBlogPosts();
        break;
      case 'books':
        await loadBooks();
        break;
      default:
        await loadAnalyticsDashboard(); // Default to analytics dashboard
    }
  } catch (error) {
    contentArea.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <i class="fas fa-exclamation-circle text-red-600 text-3xl mb-3"></i>
        <h3 class="font-semibold text-red-900 mb-2">Error Loading Content</h3>
        <p class="text-sm text-red-700 mb-4">${error.message}</p>
        <button onclick="loadTab('${tab}')" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
          <i class="fas fa-redo mr-2"></i>Retry
        </button>
      </div>
    `;
    console.error('Tab load error:', error);
  }
}

// ===== API HELPER =====

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Only logout if it's a true auth failure, not a network issue
      const errorData = await response.json().catch(() => ({}));
      if (errorData.detail === 'Could not validate credentials' || errorData.detail === 'Token expired') {
        localStorage.removeItem('admin_token');
        authToken = null;
        showLogin();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(errorData.detail || 'Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'API request failed');
    }

    return response.status !== 204 ? response.json() : null;
  } catch (error) {
    // Don't logout on network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

// ===== FILE UPLOAD HELPER =====

async function uploadFile(file, type = 'blog') {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/storage/upload/${type}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return await response.json();
}

async function uploadMultipleFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch(`${API_BASE}/storage/upload/blog/multiple`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return await response.json();
}

// ===== MARKDOWN HELPER =====

function markdownToHtml(markdown) {
  if (!markdown) return '';

  let html = markdown
    // Headings
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
    // Code blocks
    .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br>');

  return html;
}

// ===== BLOG MANAGEMENT =====

async function loadBlogPosts() {
  const content = document.getElementById('content-area');
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';

  try {
    const data = await apiCall('/blog/posts?published_only=false');
    const posts = data.posts || [];

    // Check for localStorage draft
    const localDraft = loadDraft();
    const hasLocalDraft = localDraft && (localDraft.title || localDraft.content);

    console.log('Blog API response:', data);
    console.log('Posts loaded:', posts.length, posts);

    content.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Blog Posts (${posts.length})</h2>
          <button onclick="showBlogPostEditor()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>New Post
          </button>
        </div>

        ${hasLocalDraft ? `
          <div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <i class="fas fa-file-alt text-yellow-600"></i>
              </div>
              <div>
                <p class="font-semibold text-yellow-800">Unsaved Draft</p>
                <p class="text-sm text-yellow-600">"${localDraft.title || 'Untitled'}" - Last saved ${new Date(localDraft.savedAt).toLocaleString()}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="showBlogPostEditor()" class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                <i class="fas fa-edit mr-2"></i>Continue Editing
              </button>
              <button onclick="discardLocalDraft()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                <i class="fas fa-trash mr-2"></i>Discard
              </button>
            </div>
          </div>
        ` : ''}

        <div class="space-y-4">
          ${posts.length === 0 && !hasLocalDraft ? '<p class="text-gray-500 text-center py-8">No blog posts yet. Click "New Post" to create one.</p>' : ''}
          ${posts.map(post => `
            <div class="border rounded-lg p-4 flex justify-between items-start hover:border-blue-200 transition-colors ${!post.published ? 'bg-gray-50' : ''}">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-lg">${post.title}</h3>
                  <span class="px-2 py-0.5 ${post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded-full text-xs font-medium">
                    ${post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">${post.excerpt}</p>
                <div class="mt-2 flex gap-2 flex-wrap">
                  <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">${post.category}</span>
                  ${post.tags.map(tag => `<span class="px-2 py-1 bg-gray-100 rounded text-xs">${tag}</span>`).join('')}
                </div>
              </div>
              <div class="flex gap-2 ml-4">
                <button onclick="showBlogPostEditor('${post.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBlogPost('${post.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading blog posts:', error);
    content.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-red-600">
          <p class="font-semibold">Error loading blog posts:</p>
          <p>${error.message}</p>
          <button onclick="loadBlogPosts()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    `;
  }
}

// Auto-save functionality
const DRAFT_KEY = 'blog_draft';
let autoSaveInterval = null;

function saveDraft() {
  const draft = {
    title: document.getElementById('post-title')?.value || '',
    slug: document.getElementById('post-slug')?.value || '',
    excerpt: document.getElementById('post-excerpt')?.value || '',
    category: document.getElementById('post-category')?.value || '',
    tags: document.getElementById('post-tags')?.value || '',
    content: document.getElementById('post-content')?.value || '',
    image_url: document.getElementById('post-image-url')?.value || '',
    published: document.getElementById('post-published')?.checked || false,
    savedAt: new Date().toISOString()
  };

  // Only save if there's actual content
  if (draft.title || draft.content) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showAutoSaveIndicator('Draft saved');
  }
}

function loadDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function showAutoSaveIndicator(message) {
  let indicator = document.getElementById('autosave-indicator');
  if (!indicator) return;

  indicator.textContent = message;
  indicator.classList.remove('opacity-0');
  indicator.classList.add('opacity-100');

  setTimeout(() => {
    indicator.classList.remove('opacity-100');
    indicator.classList.add('opacity-0');
  }, 2000);
}

function startAutoSave() {
  // Save every 30 seconds
  autoSaveInterval = setInterval(saveDraft, 30000);

  // Also save on input changes (debounced)
  let debounceTimer;
  const debouncedSave = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveDraft, 5000); // Save 5 seconds after last input
  };

  document.getElementById('post-title')?.addEventListener('input', debouncedSave);
  document.getElementById('post-content')?.addEventListener('input', debouncedSave);
  document.getElementById('post-excerpt')?.addEventListener('input', debouncedSave);
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

// Paste image upload functionality
async function handlePasteUpload(event) {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();

      const file = item.getAsFile();
      if (!file) continue;

      // Show uploading indicator
      const textarea = document.getElementById('post-content');
      const cursorPos = textarea.selectionStart;
      const placeholder = `![Uploading image...](uploading)`;

      // Insert placeholder at cursor position
      const textBefore = textarea.value.substring(0, cursorPos);
      const textAfter = textarea.value.substring(cursorPos);
      textarea.value = textBefore + placeholder + textAfter;

      try {
        const result = await uploadFile(file, 'blog');

        if (result && result.url) {
          // Replace placeholder with actual markdown
          const markdown = `![${file.name || 'image'}](${result.url})`;
          textarea.value = textarea.value.replace(placeholder, markdown);

          // Update preview if visible
          if (document.getElementById('show-preview')?.checked) {
            updatePreview();
          }

          showAutoSaveIndicator('Image uploaded!');
        }
      } catch (error) {
        // Remove placeholder on error
        textarea.value = textarea.value.replace(placeholder, '');
        alert('Failed to upload image: ' + error.message);
      }

      break; // Only handle first image
    }
  }
}

async function showBlogPostEditor(postId = null) {
  const content = document.getElementById('content-area');
  let post = null;

  // Stop any existing auto-save
  stopAutoSave();

  // Load existing post if editing
  if (postId) {
    try {
      post = await apiCall(`/blog/posts/${postId}`);
    } catch (error) {
      alert('Error loading post: ' + error.message);
      return;
    }
  }

  // Check for unsaved draft if creating new post
  const draft = !postId ? loadDraft() : null;
  const hasDraft = draft && (draft.title || draft.content);

  const isEdit = !!post;

  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold text-white">${isEdit ? 'Edit' : 'Create New'} Blog Post</h2>
          <span id="autosave-indicator" class="text-sm text-blue-200 opacity-0 transition-opacity duration-300">
            <i class="fas fa-check mr-1"></i>Saved
          </span>
        </div>
        <button type="button" onclick="confirmLeaveEditor()" class="text-white hover:text-gray-200 transition">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      ${hasDraft ? `
        <div id="draft-recovery" class="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-yellow-800">
            <i class="fas fa-exclamation-triangle"></i>
            <span class="text-sm font-medium">You have an unsaved draft from ${new Date(draft.savedAt).toLocaleString()}</span>
          </div>
          <div class="flex gap-2">
            <button type="button" onclick="restoreDraft()" class="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition">
              <i class="fas fa-undo mr-1"></i>Restore
            </button>
            <button type="button" onclick="dismissDraft()" class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition">
              Dismiss
            </button>
          </div>
        </div>
      ` : ''}

      <form id="blog-post-form" class="p-6" data-post-id="${postId || ''}">
        <!-- Title & Metadata Section -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
            <i class="fas fa-heading mr-2 text-blue-600"></i>Post Details
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-2 text-gray-700">Title *</label>
              <input type="text" id="post-title" value="${post?.title || ''}"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition text-lg"
                placeholder="Enter an engaging title..." required>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-2 text-gray-700">Slug *</label>
                <input type="text" id="post-slug" value="${post?.slug || ''}"
                  class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition font-mono text-sm"
                  required>
                <p class="text-xs text-gray-500 mt-1">Auto-generated from title</p>
              </div>

              <div>
                <label class="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
                <input type="text" id="post-category" value="${post?.category || ''}"
                  class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="e.g., Technology, Tutorial" required>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 text-gray-700">Excerpt *</label>
              <textarea id="post-excerpt" rows="3"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                placeholder="Brief description that appears in the blog list..." required>${post?.excerpt || ''}</textarea>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 text-gray-700">Tags</label>
              <input type="text" id="post-tags" value="${post?.tags?.join(', ') || ''}"
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                placeholder="tag1, tag2, tag3">
              <p class="text-xs text-gray-500 mt-1">Separate with commas</p>
            </div>
          </div>
        </div>

        <!-- Featured Image Section -->
        <div class="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">
            <i class="fas fa-image mr-2 text-blue-600"></i>Featured Image
          </h3>
          <div class="flex gap-3">
            <input type="text" id="post-image-url" value="${post?.image_url || ''}"
              class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
              placeholder="https://... or upload below">
            <label class="bg-blue-600 text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition flex items-center">
              <i class="fas fa-upload mr-2"></i>Upload
              <input type="file" id="post-image-file" accept="image/*" class="hidden" onchange="handleBlogImageUpload(event)">
            </label>
          </div>
          <div id="image-preview" class="mt-3"></div>
        </div>

        <!-- Content Images Section -->
        <div class="mb-8 bg-blue-50 p-4 rounded-lg border-2 border-blue-100">
          <h3 class="text-lg font-semibold mb-3 text-gray-700">
            <i class="fas fa-images mr-2 text-blue-600"></i>Upload Images for Content
          </h3>
          <label class="bg-blue-600 text-white px-5 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition inline-flex items-center">
            <i class="fas fa-cloud-upload-alt mr-2"></i>Select Images (Max 10)
            <input type="file" id="multiple-images-file" accept="image/*" multiple class="hidden" onchange="handleMultipleImagesUpload(event)">
          </label>
          <p class="text-sm text-gray-600 mt-2">Click "Copy Markdown" after upload to insert into your content</p>
          <div id="multiple-images-preview" class="mt-4"></div>
        </div>

        <!-- Content Editor Section -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-700">
                <i class="fas fa-edit mr-2 text-blue-600"></i>Content (Markdown) *
              </h3>
              <p class="text-xs text-gray-500 mt-1">
                <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                Tip: Paste images directly (Ctrl+V) to auto-upload
              </p>
            </div>
            <label class="inline-flex items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
              <input type="checkbox" id="show-preview" class="mr-2 w-4 h-4">
              <span class="text-sm font-medium">Live Preview</span>
            </label>
          </div>

          <!-- Markdown Toolbar -->
          <div class="bg-gray-100 p-2 rounded-t-lg flex flex-wrap gap-2 border-2 border-gray-200 border-b-0">
            <button type="button" onclick="insertMarkdown('**', '**')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Bold (Ctrl+B)">
              <i class="fas fa-bold"></i>
            </button>
            <button type="button" onclick="insertMarkdown('*', '*')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Italic (Ctrl+I)">
              <i class="fas fa-italic"></i>
            </button>
            <button type="button" onclick="insertMarkdown('[', '](url)')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Link">
              <i class="fas fa-link"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\`', '\`')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Inline Code">
              <i class="fas fa-code"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\\n## ', '')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Heading">
              <i class="fas fa-heading"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\\n- ', '')" class="px-3 py-1 hover:bg-gray-200 rounded" title="List Item">
              <i class="fas fa-list-ul"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\\n> ', '')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Quote">
              <i class="fas fa-quote-right"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\\n\`\`\`\\n', '\\n\`\`\`')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Code Block">
              <i class="fas fa-file-code"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4" id="content-container">
            <textarea id="post-content" rows="20"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-b-lg focus:border-blue-500 focus:outline-none transition font-mono text-sm leading-relaxed resize-y"
              style="min-height: 400px;" placeholder="Write your blog content here using Markdown...&#10;&#10;Paste images directly with Ctrl+V to auto-upload!" required>${post?.content || ''}</textarea>
            <div id="preview-pane" class="hidden border-2 border-gray-200 rounded-lg p-6 bg-white overflow-auto blog-preview" style="max-height: 600px;">
              <div id="preview-content" class="prose max-w-none"></div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 border-t-2 gap-4">
          <input type="hidden" id="post-published" value="${post?.published ? 'true' : 'false'}">

          <button type="button" onclick="confirmLeaveEditor()"
            class="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium text-gray-600">
            <i class="fas fa-times mr-2"></i>Cancel
          </button>

          <div class="flex gap-3">
            <button type="button" onclick="saveAsDraft()"
              class="px-5 py-2.5 border-2 border-yellow-400 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition font-medium">
              <i class="fas fa-file-alt mr-2"></i>Save as Draft
            </button>
            <button type="submit"
              class="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-medium shadow-lg">
              <i class="fas fa-paper-plane mr-2"></i>${isEdit ? 'Update & Publish' : 'Publish'}
            </button>
          </div>
        </div>
      </form>
    </div>

    <style>
      .blog-preview {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      .blog-preview img {
        max-width: 800px;
        margin: 1.5rem auto;
        display: block;
      }
    </style>
  `;

  // Auto-generate slug from title
  document.getElementById('post-title').addEventListener('input', (e) => {
    if (!isEdit || !post.slug) {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      document.getElementById('post-slug').value = slug;
    }
  });

  // Preview toggle
  document.getElementById('show-preview').addEventListener('change', (e) => {
    const previewPane = document.getElementById('preview-pane');
    const container = document.getElementById('content-container');

    if (e.target.checked) {
      previewPane.classList.remove('hidden');
      container.classList.remove('md:grid-cols-1');
      container.classList.add('md:grid-cols-2');
      updatePreview();
    } else {
      previewPane.classList.add('hidden');
      container.classList.remove('md:grid-cols-2');
      container.classList.add('md:grid-cols-1');
    }
  });

  // Update preview on content change
  document.getElementById('post-content').addEventListener('input', () => {
    if (document.getElementById('show-preview').checked) {
      updatePreview();
    }
  });

  // Show image preview if URL exists
  if (post?.image_url) {
    showImagePreview(post.image_url);
  }

  // Add paste event listener for image upload
  document.getElementById('post-content').addEventListener('paste', handlePasteUpload);

  // Start auto-save and beforeunload handler (only for new posts)
  if (!postId) {
    startAutoSave();
  }

  // Add handler to save draft on accidental page close
  addBeforeUnloadHandler();

  // Form submit
  document.getElementById('blog-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveBlogPost(postId);
  });
}

// Confirm leaving editor - Cancel means discard
function confirmLeaveEditor() {
  const title = document.getElementById('post-title')?.value || '';
  const content = document.getElementById('post-content')?.value || '';

  if (title || content) {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      // Cancel = discard draft, don't save
      clearDraft();
      stopAutoSave();
      removeBeforeUnloadHandler();
      loadBlogPosts();
    }
  } else {
    clearDraft();
    stopAutoSave();
    removeBeforeUnloadHandler();
    loadBlogPosts();
  }
}

// Handler for accidental page close/refresh - save draft
function beforeUnloadHandler(e) {
  const title = document.getElementById('post-title')?.value || '';
  const content = document.getElementById('post-content')?.value || '';

  if (title || content) {
    saveDraft();
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Your draft has been saved.';
    return e.returnValue;
  }
}

function addBeforeUnloadHandler() {
  window.addEventListener('beforeunload', beforeUnloadHandler);
}

function removeBeforeUnloadHandler() {
  window.removeEventListener('beforeunload', beforeUnloadHandler);
}

// Restore draft to form
function restoreDraft() {
  const draft = loadDraft();
  if (!draft) return;

  document.getElementById('post-title').value = draft.title || '';
  document.getElementById('post-slug').value = draft.slug || '';
  document.getElementById('post-excerpt').value = draft.excerpt || '';
  document.getElementById('post-category').value = draft.category || '';
  document.getElementById('post-tags').value = draft.tags || '';
  document.getElementById('post-content').value = draft.content || '';
  document.getElementById('post-image-url').value = draft.image_url || '';
  document.getElementById('post-published').checked = draft.published || false;

  // Hide the draft recovery banner
  const banner = document.getElementById('draft-recovery');
  if (banner) banner.remove();

  showAutoSaveIndicator('Draft restored!');
}

// Dismiss draft without restoring
function dismissDraft() {
  clearDraft();
  const banner = document.getElementById('draft-recovery');
  if (banner) banner.remove();
}

// Discard local draft from blog posts list
function discardLocalDraft() {
  if (confirm('Are you sure you want to discard this draft? This cannot be undone.')) {
    clearDraft();
    loadBlogPosts();
  }
}

// Save as draft (unpublished) to database
async function saveAsDraft() {
  // Get the current post ID from the form if editing
  const form = document.getElementById('blog-post-form');
  const postId = form.dataset.postId || null;

  const submitBtn = document.querySelector('#blog-post-form button[onclick="saveAsDraft()"]');
  const originalText = submitBtn.innerHTML;

  // Show saving state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

  const postData = {
    title: document.getElementById('post-title').value,
    slug: document.getElementById('post-slug').value,
    excerpt: document.getElementById('post-excerpt').value,
    content: document.getElementById('post-content').value,
    category: document.getElementById('post-category').value,
    tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
    published: false, // Always save as draft
    image_url: document.getElementById('post-image-url').value || null
  };

  try {
    if (postId) {
      await apiCall(`/blog/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(postData)
      });
      alert('Draft saved successfully!');
    } else {
      await apiCall('/blog/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      alert('Draft saved successfully!');
    }

    // Clear localStorage draft and stop auto-save
    clearDraft();
    stopAutoSave();
    removeBeforeUnloadHandler();

    loadBlogPosts();
  } catch (error) {
    alert('Error saving draft: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function insertMarkdown(before, after) {
  const textarea = document.getElementById('post-content');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const replacement = before + selectedText + after;

  textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

  // Set cursor position
  const newPos = start + before.length + selectedText.length;
  textarea.selectionStart = newPos;
  textarea.selectionEnd = newPos;
  textarea.focus();

  // Update preview if visible
  if (document.getElementById('show-preview').checked) {
    updatePreview();
  }
}

function updatePreview() {
  const content = document.getElementById('post-content').value;
  const preview = document.getElementById('preview-content');

  if (!content) {
    preview.innerHTML = '<p class="text-gray-400 italic">Start typing to see preview...</p>';
    return;
  }

  try {
    // Configure marked.js - using simpler approach for compatibility
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    // Parse and render content
    let html = marked.parse(content);

    // Post-process images to add styling
    html = html.replace(/<img\s+([^>]*?)src="([^"]*)"([^>]*)>/gi, (match, before, src, after) => {
      const altMatch = match.match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : '';
      return `<figure class="my-6">
        <img src="${src}" alt="${alt}" class="max-w-full mx-auto block rounded-lg shadow-md" style="max-width: 800px;" loading="lazy" />
      </figure>`;
    });

    // Post-process links to open in new tab
    html = html.replace(/<a\s+href="([^"]*)"/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline"');

    // Add styling to code blocks
    html = html.replace(/<pre><code([^>]*)>/gi, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code$1>');

    // Add styling to inline code
    html = html.replace(/<code>([^<]*)<\/code>/gi, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');

    // Add styling to blockquotes
    html = html.replace(/<blockquote>/gi, '<blockquote class="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600">');

    // Add styling to headings
    html = html.replace(/<h1>/gi, '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">');
    html = html.replace(/<h2>/gi, '<h2 class="text-2xl font-bold mt-6 mb-3 text-gray-800">');
    html = html.replace(/<h3>/gi, '<h3 class="text-xl font-semibold mt-5 mb-2 text-gray-800">');
    html = html.replace(/<h4>/gi, '<h4 class="text-lg font-semibold mt-4 mb-2 text-gray-700">');

    // Add styling to lists
    html = html.replace(/<ul>/gi, '<ul class="list-disc list-inside my-4 space-y-2">');
    html = html.replace(/<ol>/gi, '<ol class="list-decimal list-inside my-4 space-y-2">');

    // Add styling to paragraphs
    html = html.replace(/<p>/gi, '<p class="my-4 leading-relaxed">');

    preview.innerHTML = html;
  } catch (error) {
    console.error('Preview rendering error:', error);
    preview.innerHTML = `<p class="text-red-500">Error rendering preview: ${error.message}</p>`;
  }
}

async function handleBlogImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log('Uploading featured image:', file.name);

  const uploadBtn = event.target.parentElement;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  uploadBtn.classList.add('opacity-50');

  try {
    const result = await uploadFile(file, 'blog');
    console.log('Upload result:', result);

    if (!result.url) {
      throw new Error('No URL returned from upload');
    }

    document.getElementById('post-image-url').value = result.url;
    showImagePreview(result.url);
    uploadBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Uploaded';
    setTimeout(() => {
      uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload';
      uploadBtn.classList.remove('opacity-50');
    }, 2000);
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload image: ' + error.message);
    uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload';
    uploadBtn.classList.remove('opacity-50');
  }
}

function showImagePreview(url) {
  const previewContainer = document.getElementById('image-preview');

  if (!previewContainer) {
    console.error('Preview container not found!');
    return;
  }

  if (!url) {
    previewContainer.innerHTML = '';
    return;
  }

  console.log('Showing preview for URL:', url);

  previewContainer.innerHTML = `
    <div class="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
      <p class="text-sm text-green-700 mb-2 font-medium">
        <i class="fas fa-check-circle mr-1"></i>Featured image uploaded successfully!
      </p>
      <img src="${url}" alt="Preview" class="max-w-sm rounded-lg border-2 border-gray-300 shadow-sm" onload="console.log('Image loaded successfully')" onerror="console.error('Failed to load image:', this.src)">
    </div>
  `;
}

async function handleMultipleImagesUpload(event) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  if (files.length > 10) {
    alert('Maximum 10 images allowed per upload');
    event.target.value = '';
    return;
  }

  const previewContainer = document.getElementById('multiple-images-preview');
  previewContainer.innerHTML = `
    <div class="text-blue-600">
      <i class="fas fa-spinner fa-spin mr-2"></i>Uploading ${files.length} image${files.length > 1 ? 's' : ''}...
    </div>
  `;

  try {
    const results = await uploadMultipleFiles(files);

    // Clear the file input
    event.target.value = '';

    // Display results
    previewContainer.innerHTML = `
      <div class="text-green-600 mb-3">
        <i class="fas fa-check mr-2"></i>${results.length} image${results.length > 1 ? 's' : ''} uploaded successfully!
      </div>
      <div class="space-y-2">
        ${results.map(img => `
          <div class="border rounded-lg p-3 bg-gray-50">
            <div class="flex items-start gap-3">
              <img src="${img.url}" alt="${img.original_name}" class="w-20 h-20 object-cover rounded">
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-700">${img.original_name}</div>
                <div class="text-xs text-gray-500">${img.size}</div>
                <div class="mt-2">
                  <button
                    onclick="copyMarkdown('${img.markdown.replace(/'/g, "\\'")}')"
                    class="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    <i class="fas fa-copy mr-1"></i>Copy Markdown
                  </button>
                </div>
              </div>
            </div>
            <div class="mt-2 text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
              ${img.markdown}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    previewContainer.innerHTML = `
      <div class="text-red-600">
        <i class="fas fa-exclamation-circle mr-2"></i>Upload failed: ${error.message}
      </div>
    `;
    event.target.value = '';
  }
}

function copyMarkdown(markdown) {
  navigator.clipboard.writeText(markdown).then(() => {
    // Show temporary success message
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
    btn.classList.add('bg-green-600');
    btn.classList.remove('bg-blue-600');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('bg-green-600');
      btn.classList.add('bg-blue-600');
    }, 1500);
  }).catch(err => {
    alert('Failed to copy: ' + err.message);
  });
}

async function saveBlogPost(postId) {
  const submitBtn = document.querySelector('#blog-post-form button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  // Show saving state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Publishing...';

  const postData = {
    title: document.getElementById('post-title').value,
    slug: document.getElementById('post-slug').value,
    excerpt: document.getElementById('post-excerpt').value,
    content: document.getElementById('post-content').value,
    category: document.getElementById('post-category').value,
    tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
    published: true, // Publish button always publishes
    image_url: document.getElementById('post-image-url').value || null
  };

  try {
    if (postId) {
      await apiCall(`/blog/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(postData)
      });
      alert('Post published successfully!');
    } else {
      await apiCall('/blog/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      alert('Post published successfully!');
    }

    // Clear draft, stop auto-save, and remove beforeunload handler on successful save
    clearDraft();
    stopAutoSave();
    removeBeforeUnloadHandler();

    loadBlogPosts();
  } catch (error) {
    alert('Error publishing post: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
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

// ===== BOOKSHELF MANAGEMENT =====

async function loadBooks() {
  const content = document.getElementById('content-area');
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';

  try {
    const books = await apiCall('/books?include_hidden=true');

    content.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Bookshelf Management</h2>
          <button onclick="showBookEditor()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>Add Book
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Author</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Rating</th>
                <th class="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th class="px-4 py-3 text-center text-sm font-semibold">Visible</th>
                <th class="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              ${books.length === 0 ? '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No books yet.</td></tr>' : ''}
              ${books.map(book => `
                <tr class="${!book.visible ? 'bg-gray-50 opacity-60' : ''}">
                  <td class="px-4 py-3">
                    <div class="font-medium">${book.title}</div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">${book.author}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${
                      book.status === 'read' ? 'bg-green-100 text-green-700' :
                      book.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }">${book.status}</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    ${book.rating ? '⭐'.repeat(Math.round(book.rating)) : '-'}
                  </td>
                  <td class="px-4 py-3 text-sm">${book.category}</td>
                  <td class="px-4 py-3 text-center">
                    <button
                      onclick="toggleBookVisibility('${book.id}', ${book.visible})"
                      class="px-3 py-1 rounded text-sm ${book.visible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}"
                      title="Click to toggle visibility"
                    >
                      <i class="fas fa-eye${book.visible ? '' : '-slash'}"></i>
                    </button>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button onclick="showBookEditor('${book.id}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteBook('${book.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="text-red-600">Error loading books: ${error.message}</div>`;
  }
}

async function showBookEditor(bookId = null) {
  const content = document.getElementById('content-area');
  let book = null;

  if (bookId) {
    try {
      book = await apiCall(`/books/${bookId}`);
    } catch (error) {
      alert('Error loading book: ' + error.message);
      return;
    }
  }

  const isEdit = !!book;

  content.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">${isEdit ? 'Edit' : 'Add'} Book</h2>
        <button onclick="loadBooks()" class="text-gray-600 hover:text-gray-800">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form id="book-form" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Title *</label>
            <input type="text" id="book-title" value="${book?.title || ''}" class="w-full px-4 py-2 border rounded-lg" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Author *</label>
            <input type="text" id="book-author" value="${book?.author || ''}" class="w-full px-4 py-2 border rounded-lg" required>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Status *</label>
            <select id="book-status" class="w-full px-4 py-2 border rounded-lg" required>
              <option value="to-read" ${book?.status === 'to-read' ? 'selected' : ''}>To Read</option>
              <option value="reading" ${book?.status === 'reading' ? 'selected' : ''}>Reading</option>
              <option value="read" ${book?.status === 'read' ? 'selected' : ''}>Read</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Rating (0-5)</label>
            <input type="number" id="book-rating" value="${book?.rating || ''}" min="0" max="5" step="0.5" class="w-full px-4 py-2 border rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Category *</label>
            <input type="text" id="book-category" value="${book?.category || ''}" class="w-full px-4 py-2 border rounded-lg" required>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Cover Image URL</label>
          <div class="flex gap-2">
            <input type="text" id="book-cover-url" value="${book?.cover_image_url || ''}" class="flex-1 px-4 py-2 border rounded-lg" placeholder="https://...">
            <label class="bg-gray-200 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-300">
              <i class="fas fa-upload mr-2"></i>Upload
              <input type="file" id="book-cover-file" accept="image/*" class="hidden" onchange="handleBookCoverUpload(event)">
            </label>
          </div>
          <div id="cover-preview" class="mt-2"></div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Tags (comma-separated)</label>
          <input type="text" id="book-tags" value="${book?.tags?.join(', ') || ''}" class="w-full px-4 py-2 border rounded-lg">
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Review</label>
          <textarea id="book-review" rows="4" class="w-full px-4 py-2 border rounded-lg">${book?.review || ''}</textarea>
        </div>

        <div class="flex items-center justify-between">
          <label class="inline-flex items-center cursor-pointer">
            <input type="checkbox" id="book-visible" ${book?.visible !== false ? 'checked' : ''} class="mr-2">
            <span class="text-sm font-medium">Visible on website</span>
          </label>

          <div class="flex gap-2">
            <button type="button" onclick="loadBooks()" class="px-4 py-2 border rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              ${isEdit ? 'Update' : 'Add'} Book
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  // Show cover preview if URL exists
  if (book?.cover_image_url) {
    showCoverPreview(book.cover_image_url);
  }

  // Form submit
  document.getElementById('book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveBook(bookId);
  });
}

async function handleBookCoverUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const uploadBtn = event.target.parentElement;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  uploadBtn.classList.add('opacity-50');

  try {
    const result = await uploadFile(file, 'book-cover');
    document.getElementById('book-cover-url').value = result.url;
    showCoverPreview(result.url);
    uploadBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Uploaded';
    setTimeout(() => {
      uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload';
      uploadBtn.classList.remove('opacity-50');
    }, 2000);
  } catch (error) {
    alert('Failed to upload cover: ' + error.message);
    uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload';
    uploadBtn.classList.remove('opacity-50');
  }
}

function showCoverPreview(url) {
  if (!url) {
    document.getElementById('cover-preview').innerHTML = '';
    return;
  }
  document.getElementById('cover-preview').innerHTML = `
    <img src="${url}" alt="Cover Preview" class="max-w-xs rounded-lg border">
  `;
}

async function saveBook(bookId) {
  const rating = document.getElementById('book-rating').value;
  const bookData = {
    title: document.getElementById('book-title').value,
    author: document.getElementById('book-author').value,
    status: document.getElementById('book-status').value,
    rating: rating ? parseFloat(rating) : null,
    category: document.getElementById('book-category').value,
    review: document.getElementById('book-review').value || null,
    tags: document.getElementById('book-tags').value.split(',').map(t => t.trim()).filter(t => t),
    cover_image_url: document.getElementById('book-cover-url').value || null,
    visible: document.getElementById('book-visible').checked
  };

  try {
    if (bookId) {
      await apiCall(`/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(bookData)
      });
      alert('Book updated successfully!');
    } else {
      await apiCall('/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
      });
      alert('Book added successfully!');
    }
    loadBooks();
  } catch (error) {
    alert('Error saving book: ' + error.message);
  }
}

async function toggleBookVisibility(bookId, currentVisible) {
  try {
    await apiCall(`/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify({ visible: !currentVisible })
    });
    loadBooks();
  } catch (error) {
    alert('Error toggling visibility: ' + error.message);
  }
}

async function deleteBook(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;

  try {
    await apiCall(`/books/${id}`, { method: 'DELETE' });
    alert('Book deleted successfully!');
    loadBooks();
  } catch (error) {
    alert('Error deleting book: ' + error.message);
  }
}
