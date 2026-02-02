// ===== ANALYTICS DASHBOARD =====
// Modern, sleek analytics overview

async function loadAnalyticsDashboard() {
  const content = document.getElementById('content-area');

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p class="text-gray-500 mt-1">Monitor your website performance at a glance</p>
        </div>
        <button onclick="loadAnalyticsDashboard()" class="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
          <i class="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      <!-- Loading State -->
      <div id="analytics-loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 animate-pulse">
            <i class="fas fa-chart-line text-white text-2xl"></i>
          </div>
          <p class="text-gray-500 font-medium">Loading analytics...</p>
        </div>
      </div>

      <div id="analytics-content" class="hidden space-y-6"></div>
    </div>
  `;

  try {
    const stats = await apiCall('/analytics/stats/overall');

    // Fetch resume stats separately (may not exist)
    let resumeStats = null;
    try {
      resumeStats = await apiCall('/analytics/stats/resume');
    } catch (e) {
      console.log('Resume stats not available:', e.message);
    }

    displayAnalytics(stats, resumeStats);
  } catch (error) {
    console.error('Error loading analytics:', error);
    document.getElementById('analytics-loading').innerHTML = `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
        </div>
        <p class="text-red-600 font-semibold mb-2">Failed to load analytics</p>
        <p class="text-gray-500 text-sm mb-4">${error.message}</p>
        <button onclick="loadAnalyticsDashboard()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-redo mr-2"></i>Try Again
        </button>
      </div>
    `;
  }
}

function displayAnalytics(stats, resumeStats) {
  document.getElementById('analytics-loading').classList.add('hidden');
  const contentDiv = document.getElementById('analytics-content');
  contentDiv.classList.remove('hidden');

  contentDiv.innerHTML = `
    <!-- Main Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Page Views -->
      <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">Page Views</p>
            <p class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ${stats.total_page_views.toLocaleString()}
            </p>
            <p class="text-xs text-gray-400 mt-2">All time</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <i class="fas fa-eye text-white"></i>
          </div>
        </div>
      </div>

      <!-- Unique Visitors -->
      <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">Unique Visitors</p>
            <p class="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              ${stats.unique_visitors_total.toLocaleString()}
            </p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                ${stats.unique_visitors_today} today
              </span>
            </div>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <i class="fas fa-users text-white"></i>
          </div>
        </div>
      </div>

      <!-- Blog Views -->
      <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">Blog Views</p>
            <p class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              ${stats.total_blog_views.toLocaleString()}
            </p>
            <p class="text-xs text-gray-400 mt-2">${stats.total_blog_visitors || 0} readers</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <i class="fas fa-book-open text-white"></i>
          </div>
        </div>
      </div>

      <!-- Weekly Visitors -->
      <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 mb-1">This Week</p>
            <p class="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              ${stats.unique_visitors_week.toLocaleString()}
            </p>
            <p class="text-xs text-gray-400 mt-2">${stats.unique_visitors_month} this month</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <i class="fas fa-calendar-week text-white"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Resume Stats (if available) -->
    ${resumeStats ? `
      <div class="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
            <i class="fas fa-file-alt text-white"></i>
          </div>
          <h3 class="text-lg font-semibold">Resume Analytics</h3>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p class="text-teal-100 text-xs font-medium mb-1">Total Views</p>
            <p class="text-2xl font-bold">${resumeStats.total_views}</p>
            <p class="text-teal-100 text-xs mt-1">${resumeStats.unique_viewers} unique</p>
          </div>
          <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p class="text-teal-100 text-xs font-medium mb-1">Downloads</p>
            <p class="text-2xl font-bold">${resumeStats.total_downloads}</p>
            <p class="text-teal-100 text-xs mt-1">${resumeStats.unique_downloaders} unique</p>
          </div>
          <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p class="text-teal-100 text-xs font-medium mb-1">Last Viewed</p>
            <p class="text-sm font-semibold">${resumeStats.last_viewed ? formatTimeAgo(resumeStats.last_viewed) : 'Never'}</p>
          </div>
          <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p class="text-teal-100 text-xs font-medium mb-1">Last Download</p>
            <p class="text-sm font-semibold">${resumeStats.last_downloaded ? formatTimeAgo(resumeStats.last_downloaded) : 'Never'}</p>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Tab Engagement -->
    ${stats.tab_stats && stats.tab_stats.length > 0 ? `
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-layer-group text-indigo-600"></i>
            </div>
            Tab Engagement
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            ${stats.tab_stats.map((tab, index) => {
              const colors = [
                'from-blue-500 to-indigo-500',
                'from-emerald-500 to-green-500',
                'from-purple-500 to-violet-500',
                'from-amber-500 to-orange-500',
                'from-pink-500 to-rose-500',
                'from-cyan-500 to-teal-500'
              ];
              const color = colors[index % colors.length];
              return `
                <div class="relative group">
                  <div class="absolute inset-0 bg-gradient-to-br ${color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative bg-gray-50 group-hover:bg-transparent rounded-xl p-4 text-center transition-colors duration-300">
                    <p class="text-xs font-medium text-gray-500 group-hover:text-white/80 capitalize mb-2 transition-colors">${tab.tab_name}</p>
                    <p class="text-2xl font-bold text-gray-900 group-hover:text-white transition-colors">${tab.total_visits}</p>
                    <p class="text-xs text-gray-400 group-hover:text-white/70 mt-1 transition-colors">
                      <i class="fas fa-user mr-1"></i>${tab.unique_visitors} unique
                    </p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Top Pages & Blog Posts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Pages -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-fire text-orange-600"></i>
            </div>
            Top Pages
          </h3>
        </div>
        <div class="divide-y divide-gray-50">
          ${stats.top_pages.slice(0, 5).map((page, index) => `
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span class="text-sm font-bold text-gray-600">${index + 1}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">${page.page_path}</p>
                  <p class="text-xs text-gray-500">${page.unique_visitors} unique visitors</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-lg font-bold text-blue-600">${page.total_views}</p>
                  <p class="text-xs text-gray-400">views</p>
                </div>
              </div>
            </div>
          `).join('')}
          ${stats.top_pages.length === 0 ? `
            <div class="px-6 py-8 text-center">
              <i class="fas fa-chart-bar text-gray-300 text-3xl mb-2"></i>
              <p class="text-gray-400">No page views yet</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Top Blog Posts -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-trophy text-yellow-600"></i>
            </div>
            Popular Posts
          </h3>
        </div>
        <div class="divide-y divide-gray-50">
          ${stats.top_blog_posts.slice(0, 5).map((post, index) => `
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 bg-gradient-to-br ${getMedalGradient(index)} rounded-lg flex items-center justify-center flex-shrink-0">
                  ${index < 3 ? `<i class="fas fa-medal text-white text-sm"></i>` : `<span class="text-sm font-bold text-gray-600">${index + 1}</span>`}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">${post.title}</p>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs text-gray-500">
                      <i class="fas fa-users mr-1"></i>${post.unique_views} unique
                    </span>
                    ${post.avg_time_spent ? `
                      <span class="text-xs text-gray-500">
                        <i class="fas fa-clock mr-1"></i>${Math.round(post.avg_time_spent)}s
                      </span>
                    ` : ''}
                    ${post.avg_scroll_depth ? `
                      <span class="text-xs text-gray-500">
                        <i class="fas fa-scroll mr-1"></i>${Math.round(post.avg_scroll_depth)}%
                      </span>
                    ` : ''}
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-lg font-bold text-purple-600">${post.total_views}</p>
                  <p class="text-xs text-gray-400">views</p>
                </div>
              </div>
            </div>
          `).join('')}
          ${stats.top_blog_posts.length === 0 ? `
            <div class="px-6 py-8 text-center">
              <i class="fas fa-book text-gray-300 text-3xl mb-2"></i>
              <p class="text-gray-400">No blog views yet</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold">Want more insights?</h3>
          <p class="text-gray-400 text-sm mt-1">Check out detailed visitor analytics and blog performance</p>
        </div>
        <div class="flex gap-3">
          <button onclick="document.querySelector('[data-tab=visitors]').click()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
            <i class="fas fa-users mr-2"></i>View Visitors
          </button>
          <button onclick="document.querySelector('[data-tab=blog-analytics]').click()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors">
            <i class="fas fa-chart-bar mr-2"></i>Blog Analytics
          </button>
        </div>
      </div>
    </div>
  `;
}

// Helper functions
function getMedalGradient(index) {
  const gradients = [
    'from-yellow-400 to-yellow-500', // Gold
    'from-gray-300 to-gray-400',     // Silver
    'from-amber-600 to-amber-700',   // Bronze
    'from-gray-100 to-gray-200',     // Others
    'from-gray-100 to-gray-200'
  ];
  return gradients[index] || gradients[3];
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}
