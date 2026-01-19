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
        await loadVisitorsDashboard();
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
        <div class="space-y-4">
          ${posts.length === 0 ? '<p class="text-gray-500 text-center py-8">No blog posts yet. Click "New Post" to create one.</p>' : ''}
          ${posts.map(post => `
            <div class="border rounded-lg p-4 flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">${post.title}</h3>
                <p class="text-sm text-gray-600">${post.excerpt}</p>
                <div class="mt-2 flex gap-2 flex-wrap">
                  <span class="px-2 py-1 bg-gray-100 rounded text-xs">${post.category}</span>
                  ${post.tags.map(tag => `<span class="px-2 py-1 bg-gray-100 rounded text-xs">${tag}</span>`).join('')}
                  <span class="px-2 py-1 ${post.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded text-xs">
                    ${post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button onclick="showBlogPostEditor('${post.id}')" class="text-blue-600 hover:text-blue-800" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBlogPost('${post.id}')" class="text-red-600 hover:text-red-800" title="Delete">
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

async function showBlogPostEditor(postId = null) {
  const content = document.getElementById('content-area');
  let post = null;

  // Load existing post if editing
  if (postId) {
    try {
      post = await apiCall(`/blog/posts/${postId}`);
    } catch (error) {
      alert('Error loading post: ' + error.message);
      return;
    }
  }

  const isEdit = !!post;

  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-white">${isEdit ? 'Edit' : 'Create New'} Blog Post</h2>
        <button onclick="loadBlogPosts()" class="text-white hover:text-gray-200 transition">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form id="blog-post-form" class="p-6">
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
            <h3 class="text-lg font-semibold text-gray-700">
              <i class="fas fa-edit mr-2 text-blue-600"></i>Content (Markdown) *
            </h3>
            <label class="inline-flex items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
              <input type="checkbox" id="show-preview" class="mr-2 w-4 h-4">
              <span class="text-sm font-medium">Live Preview</span>
            </label>
          </div>

          <!-- Markdown Toolbar -->
          <div class="bg-gray-100 p-2 rounded-t-lg flex gap-2 border-2 border-gray-200 border-b-0">
            <button type="button" onclick="insertMarkdown('**', '**')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Bold">
              <i class="fas fa-bold"></i>
            </button>
            <button type="button" onclick="insertMarkdown('*', '*')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Italic">
              <i class="fas fa-italic"></i>
            </button>
            <button type="button" onclick="insertMarkdown('[', '](url)')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Link">
              <i class="fas fa-link"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\\\`', '\\\`')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Code">
              <i class="fas fa-code"></i>
            </button>
            <button type="button" onclick="insertMarkdown('\\n## ', '')" class="px-3 py-1 hover:bg-gray-200 rounded" title="Heading">
              <i class="fas fa-heading"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4" id="content-container">
            <textarea id="post-content" rows="20"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-b-lg focus:border-blue-500 focus:outline-none transition font-mono text-sm leading-relaxed resize-y"
              style="min-height: 400px;" required>${post?.content || ''}</textarea>
            <div id="preview-pane" class="hidden border-2 border-gray-200 rounded-lg p-6 bg-white overflow-auto blog-preview" style="max-height: 600px;">
              <div id="preview-content" class="prose max-w-none"></div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-6 border-t-2">
          <label class="inline-flex items-center cursor-pointer bg-green-50 px-4 py-2 rounded-lg border-2 border-green-200">
            <input type="checkbox" id="post-published" ${post?.published ? 'checked' : ''} class="mr-2 w-5 h-5">
            <span class="text-sm font-semibold text-green-700">
              <i class="fas fa-check-circle mr-1"></i>Publish Immediately
            </span>
          </label>

          <div class="flex gap-3">
            <button type="button" onclick="loadBlogPosts()"
              class="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium">
              <i class="fas fa-times mr-2"></i>Cancel
            </button>
            <button type="submit"
              class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg">
              <i class="fas fa-save mr-2"></i>${isEdit ? 'Update' : 'Create'} Post
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

  // Form submit
  document.getElementById('blog-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveBlogPost(postId);
  });
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

  // Configure marked.js with same settings as blog post view
  const renderer = new marked.Renderer();

  renderer.image = function(token) {
    // Handle both old and new marked.js API
    const href = typeof token === 'string' ? token : (token.href || '');
    const title = typeof token === 'object' ? token.title : arguments[1];
    const text = typeof token === 'object' ? token.text : arguments[2];

    // Ensure href is a string
    const hrefStr = String(href || '');
    const titleStr = title && title !== 'undefined' ? String(title) : '';
    const textStr = text ? String(text) : '';

    const titleAttr = titleStr ? `title="${titleStr}"` : '';
    const caption = titleStr ? `<figcaption class="text-center text-sm text-gray-500 mt-2">${titleStr}</figcaption>` : '';

    return `<figure class="my-6">
      <img src="${hrefStr}" alt="${textStr}" ${titleAttr} class="max-w-full mx-auto block rounded-lg" style="max-width: 800px;" />
      ${caption}
    </figure>`;
  };

  renderer.link = function(token) {
    // Handle both old and new marked.js API
    const href = typeof token === 'string' ? token : (token.href || '');
    const title = typeof token === 'object' ? token.title : arguments[1];
    const text = typeof token === 'object' ? token.text : arguments[2];

    const hrefStr = String(href || '');
    const titleStr = title ? String(title) : '';
    const textStr = text ? String(text) : '';

    return `<a href="${hrefStr}" target="_blank" ${titleStr ? `title="${titleStr}"` : ''} class="text-blue-600 underline">${textStr}</a>`;
  };

  marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true
  });

  try {
    preview.innerHTML = marked.parse(content);
  } catch (error) {
    console.error('Preview rendering error:', error);
    preview.innerHTML = '<p class="text-red-500">Error rendering preview. Check console for details.</p>';
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
  const postData = {
    title: document.getElementById('post-title').value,
    slug: document.getElementById('post-slug').value,
    excerpt: document.getElementById('post-excerpt').value,
    content: document.getElementById('post-content').value,
    category: document.getElementById('post-category').value,
    tags: document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(t => t),
    published: document.getElementById('post-published').checked,
    image_url: document.getElementById('post-image-url').value || null
  };

  try {
    if (postId) {
      await apiCall(`/blog/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(postData)
      });
      alert('Post updated successfully!');
    } else {
      await apiCall('/blog/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      alert('Post created successfully!');
    }
    loadBlogPosts();
  } catch (error) {
    alert('Error saving post: ' + error.message);
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
