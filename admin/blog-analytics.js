// ===== BLOG ANALYTICS DASHBOARD =====

async function loadBlogAnalytics() {
  const content = document.getElementById('content-area');

  content.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Blog Post Analytics</h2>
      <p class="text-gray-600 mt-1">Detailed performance metrics for each blog post</p>
    </div>

    <div id="blog-analytics-loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
      <p class="mt-4 text-gray-600">Loading blog analytics...</p>
    </div>

    <div id="blog-analytics-content" class="hidden"></div>
  `;

  try {
    const blogsData = await apiCall('/analytics/blogs/all');
    displayBlogAnalytics(blogsData);
  } catch (error) {
    console.error('Error loading blog analytics:', error);
    document.getElementById('blog-analytics-loading').innerHTML = `
      <div class="text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p class="font-semibold">Failed to load blog analytics</p>
        <p class="text-sm mt-2">${error.message}</p>
        <button onclick="loadBlogAnalytics()" class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-redo mr-2"></i>Retry
        </button>
      </div>
    `;
  }
}

function displayBlogAnalytics(blogs) {
  document.getElementById('blog-analytics-loading').classList.add('hidden');
  document.getElementById('blog-analytics-content').classList.remove('hidden');

  if (!blogs || blogs.length === 0) {
    document.getElementById('blog-analytics-content').innerHTML = `
      <div class="text-center py-16">
        <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">No blog posts found</p>
        <p class="text-gray-400 text-sm mt-2">Create your first blog post to see analytics here</p>
      </div>
    `;
    return;
  }

  const blogsHTML = blogs.map((blog, index) => `
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6 hover:shadow-xl transition-shadow border border-gray-200">
      <!-- Blog header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl font-bold text-gray-400">#${index + 1}</span>
            <h3 class="text-xl font-bold text-gray-900">${blog.title}</h3>
          </div>
          <p class="text-sm text-gray-500 flex items-center gap-4">
            <span><i class="fas fa-link mr-1"></i>${blog.slug}</span>
            ${blog.published_at ? `<span><i class="far fa-calendar mr-1"></i>${new Date(blog.published_at).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}</span>` : '<span class="text-orange-500"><i class="fas fa-draft mr-1"></i>Draft</span>'}
          </p>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
          <div class="flex items-center justify-center mb-2">
            <i class="fas fa-eye text-blue-600 text-xl"></i>
          </div>
          <p class="text-3xl font-bold text-blue-700">${blog.total_views}</p>
          <p class="text-xs text-gray-600 mt-1">Total Views</p>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
          <div class="flex items-center justify-center mb-2">
            <i class="fas fa-users text-green-600 text-xl"></i>
          </div>
          <p class="text-3xl font-bold text-green-700">${blog.unique_visitors}</p>
          <p class="text-xs text-gray-600 mt-1">Unique Visitors</p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
          <div class="flex items-center justify-center mb-2">
            <i class="fas fa-clock text-purple-600 text-xl"></i>
          </div>
          <p class="text-3xl font-bold text-purple-700">${blog.avg_time_spent ? Math.round(blog.avg_time_spent) + 's' : 'N/A'}</p>
          <p class="text-xs text-gray-600 mt-1">Avg Time</p>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
          <div class="flex items-center justify-center mb-2">
            <i class="fas fa-heart text-orange-600 text-xl"></i>
          </div>
          <p class="text-3xl font-bold text-orange-700">${blog.total_reactions}</p>
          <p class="text-xs text-gray-600 mt-1">Reactions</p>
        </div>
      </div>

      <!-- Additional metrics -->
      ${blog.avg_scroll_depth ? `
        <div class="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600"><i class="fas fa-scroll mr-2"></i>Average Scroll Depth</span>
            <span class="text-sm font-bold text-gray-800">${Math.round(blog.avg_scroll_depth)}%</span>
          </div>
          <div class="mt-2 bg-gray-200 rounded-full h-2">
            <div class="bg-indigo-600 rounded-full h-2" style="width: ${Math.round(blog.avg_scroll_depth)}%"></div>
          </div>
        </div>
      ` : ''}

      <!-- Reactions breakdown -->
      ${blog.reactions && blog.reactions.length > 0 ? `
        <div class="border-t pt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-chart-bar mr-2 text-indigo-500"></i>
            Reaction Breakdown
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${blog.reactions.map(r => {
              const emoji = getReactionEmoji(r.reaction_type);
              const label = getReactionLabel(r.reaction_type);
              const color = getReactionColor(r.reaction_type);
              return `
                <div class="bg-gradient-to-br ${color} rounded-lg p-3 text-center border-2 border-opacity-50 hover:scale-105 transition-transform" title="${label}">
                  <span class="text-2xl block mb-1">${emoji}</span>
                  <p class="text-lg font-bold text-gray-800">${r.count}</p>
                  <p class="text-xs text-gray-600 truncate">${label}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div class="border-t pt-4">
          <p class="text-sm text-gray-500 italic text-center py-3">
            <i class="fas fa-inbox mr-2"></i>No reactions yet
          </p>
        </div>
      `}
    </div>
  `).join('');

  document.getElementById('blog-analytics-content').innerHTML = `
    <div class="space-y-4">
      ${blogsHTML}
    </div>
  `;
}

function getReactionEmoji(type) {
  const emojis = {
    gem: '💎',
    learned: '💡',
    clarity: '🤔',
    issues: '🐛'
  };
  return emojis[type] || '❓';
}

function getReactionLabel(type) {
  const labels = {
    gem: 'Gem',
    learned: 'Learned',
    clarity: 'Needs clarity',
    issues: 'Found issues'
  };
  return labels[type] || type;
}

function getReactionColor(type) {
  const colors = {
    gem: 'from-purple-50 to-purple-100 border-purple-300',
    learned: 'from-yellow-50 to-yellow-100 border-yellow-300',
    clarity: 'from-blue-50 to-blue-100 border-blue-300',
    issues: 'from-orange-50 to-orange-100 border-orange-300'
  };
  return colors[type] || 'from-gray-50 to-gray-100 border-gray-300';
}
