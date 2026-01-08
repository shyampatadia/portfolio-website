// ===== ANALYTICS DASHBOARD =====

async function loadAnalyticsDashboard() {
  const content = document.getElementById('content-area');

  content.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
      <p class="text-gray-600 mt-1">Track your website and blog performance</p>
    </div>

    <div id="analytics-loading" class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
      <p class="mt-4 text-gray-600">Loading statistics...</p>
    </div>

    <div id="analytics-content" class="hidden"></div>
  `;

  try {
    const stats = await apiCall('/analytics/stats/overall');
    const recentActivity = await apiCall('/analytics/activity/recent?limit=10');

    displayAnalytics(stats, recentActivity);
  } catch (error) {
    console.error('Error loading analytics:', error);
    document.getElementById('analytics-loading').innerHTML = `
      <div class="text-red-600">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p class="font-semibold">Failed to load analytics</p>
        <p class="text-sm mt-2">${error.message}</p>
        <button onclick="loadAnalyticsDashboard()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    `;
  }
}

function displayAnalytics(stats, recentActivity) {
  document.getElementById('analytics-loading').classList.add('hidden');
  document.getElementById('analytics-content').classList.remove('hidden');

  document.getElementById('analytics-content').innerHTML = `
    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Total Page Views</p>
            <p class="text-3xl font-bold mt-2">${stats.total_page_views.toLocaleString()}</p>
          </div>
          <div class="bg-blue-400 bg-opacity-30 rounded-full p-3">
            <i class="fas fa-eye text-2xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Unique Visitors</p>
            <p class="text-3xl font-bold mt-2">${stats.unique_visitors_total.toLocaleString()}</p>
            <p class="text-green-100 text-xs mt-1">All time</p>
          </div>
          <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
            <i class="fas fa-users text-2xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">Blog Views</p>
            <p class="text-3xl font-bold mt-2">${stats.total_blog_views.toLocaleString()}</p>
            <p class="text-purple-100 text-xs mt-1">${stats.total_blog_visitors || 0} unique readers</p>
          </div>
          <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
            <i class="fas fa-blog text-2xl"></i>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Visitors Today</p>
            <p class="text-3xl font-bold mt-2">${stats.unique_visitors_today.toLocaleString()}</p>
            <p class="text-orange-100 text-xs mt-1">Last 7 days: ${stats.unique_visitors_week}</p>
          </div>
          <div class="bg-orange-400 bg-opacity-30 rounded-full p-3">
            <i class="fas fa-calendar-day text-2xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Tracking Section -->
    ${stats.tab_stats && stats.tab_stats.length > 0 ? `
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <i class="fas fa-layer-group text-indigo-500 mr-2"></i>
          Portfolio Tab Engagement
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          ${stats.tab_stats.map((tab, index) => `
            <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
              <div class="text-center">
                <h4 class="font-semibold text-gray-800 capitalize text-sm mb-2">${tab.tab_name}</h4>
                <p class="text-2xl font-bold text-indigo-600">${tab.total_visits}</p>
                <p class="text-xs text-gray-600">visits</p>
                <p class="text-sm text-gray-600 mt-2">
                  <i class="fas fa-user text-xs text-indigo-500"></i> ${tab.unique_visitors} unique
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Top Pages & Blog Posts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Top Pages -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <i class="fas fa-fire text-orange-500 mr-2"></i>
          Most Visited Pages
        </h3>
        <div class="space-y-3">
          ${stats.top_pages.slice(0, 5).map((page, index) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center flex-1">
                <span class="text-lg font-bold text-gray-400 w-8">${index + 1}</span>
                <div class="ml-3">
                  <p class="font-medium text-gray-900">${page.page_path}</p>
                  <p class="text-sm text-gray-500">${page.unique_visitors} unique visitors</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-blue-600">${page.total_views}</p>
                <p class="text-xs text-gray-500">views</p>
              </div>
            </div>
          `).join('')}
          ${stats.top_pages.length === 0 ? '<p class="text-gray-500 text-center py-4">No page views yet</p>' : ''}
        </div>
      </div>

      <!-- Top Blog Posts -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <i class="fas fa-trophy text-yellow-500 mr-2"></i>
          Popular Blog Posts
        </h3>
        <div class="space-y-3">
          ${stats.top_blog_posts.slice(0, 5).map((post, index) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center flex-1">
                <span class="text-lg font-bold text-gray-400 w-8">${index + 1}</span>
                <div class="ml-3">
                  <p class="font-medium text-gray-900">${post.title}</p>
                  <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span><i class="fas fa-users mr-1"></i>${post.unique_views} unique</span>
                    ${post.avg_time_spent ? `<span><i class="fas fa-clock mr-1"></i>${Math.round(post.avg_time_spent)}s avg</span>` : ''}
                    ${post.avg_scroll_depth ? `<span><i class="fas fa-scroll mr-1"></i>${Math.round(post.avg_scroll_depth)}% scroll</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-purple-600">${post.total_views}</p>
                <p class="text-xs text-gray-500">views</p>
              </div>
            </div>
          `).join('')}
          ${stats.top_blog_posts.length === 0 ? '<p class="text-gray-500 text-center py-4">No blog views yet</p>' : ''}
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-stream text-blue-500 mr-2"></i>
        Recent Activity
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${recentActivity.map(activity => `
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">
                  <span class="font-medium text-gray-900">${activity.page_title || activity.page_path}</span>
                  ${activity.page_title ? `<br><span class="text-xs text-gray-500">${activity.page_path}</span>` : ''}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div class="flex flex-col gap-1">
                    ${activity.device_type ? `<span class="text-xs"><i class="fas fa-${activity.device_type === 'mobile' ? 'mobile-alt' : activity.device_type === 'tablet' ? 'tablet-alt' : 'desktop'} mr-1 text-blue-500"></i>${activity.device_type}</span>` : ''}
                    ${activity.os ? `<span class="text-xs"><i class="fas fa-cog mr-1 text-gray-400"></i>${activity.os}</span>` : ''}
                    ${activity.browser ? `<span class="text-xs"><i class="fas fa-globe mr-1 text-green-500"></i>${activity.browser}</span>` : ''}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  ${activity.city && activity.country ? `<span>${activity.city}, ${activity.country}</span>` : activity.country ? `<span>${activity.country}</span>` : '<span class="text-gray-400">Unknown</span>'}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  ${formatTimeAgo(activity.created_at)}
                </td>
              </tr>
            `).join('')}
            ${recentActivity.length === 0 ? '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No recent activity</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
