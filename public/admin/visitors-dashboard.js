// ===== VISITORS DASHBOARD =====
// Detailed visitor tracking and insights

async function loadVisitorsDashboard() {
  const content = document.getElementById('content-area');

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Visitor Insights</h2>
          <p class="text-gray-500 mt-1">Track and analyze your website visitors</p>
        </div>
        <button onclick="loadVisitorsDashboard()" class="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
          <i class="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      <!-- Loading State -->
      <div id="visitors-loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 animate-pulse">
            <i class="fas fa-users text-white text-2xl"></i>
          </div>
          <p class="text-gray-500 font-medium">Loading visitor data...</p>
        </div>
      </div>

      <div id="visitors-content" class="hidden space-y-6"></div>
    </div>
  `;

  try {
    const recentActivity = await apiCall('/analytics/activity/recent?limit=200');
    displayVisitorsDashboard(recentActivity);
  } catch (error) {
    console.error('Error loading visitors:', error);
    document.getElementById('visitors-loading').innerHTML = `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
        </div>
        <p class="text-red-600 font-semibold mb-2">Failed to load visitor data</p>
        <p class="text-gray-500 text-sm mb-4">${error.message}</p>
        <button onclick="loadVisitorsDashboard()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <i class="fas fa-redo mr-2"></i>Try Again
        </button>
      </div>
    `;
  }
}

function displayVisitorsDashboard(recentActivity) {
  document.getElementById('visitors-loading').classList.add('hidden');
  const contentDiv = document.getElementById('visitors-content');
  contentDiv.classList.remove('hidden');

  // Keep unknown/local rows visible. Backend KPIs filter internal noise; this tab is for debugging actual capture.
  const visibleActivity = recentActivity.filter(activity => activity.visitor_id && activity.page_path);
  const internalActivityCount = visibleActivity.filter(isInternalActivity).length;

  // Group visitors by visitor_id for unique visitor analysis
  const visitorMap = new Map();
  visibleActivity.forEach(activity => {
    if (!visitorMap.has(activity.visitor_id)) {
      visitorMap.set(activity.visitor_id, {
        ...activity,
        pageViews: 1,
        pages: [activity.page_path]
      });
    } else {
      const existing = visitorMap.get(activity.visitor_id);
      existing.pageViews++;
      if (!existing.pages.includes(activity.page_path)) {
        existing.pages.push(activity.page_path);
      }
    }
  });

  const uniqueVisitors = Array.from(visitorMap.values());

  // Get device stats
  const deviceStats = { mobile: 0, tablet: 0, desktop: 0 };
  const browserStats = {};
  const countryStats = {};

  visibleActivity.forEach(activity => {
    // Device
    if (activity.device_type) {
      deviceStats[activity.device_type] = (deviceStats[activity.device_type] || 0) + 1;
    }
    // Browser
    if (activity.browser) {
      browserStats[activity.browser] = (browserStats[activity.browser] || 0) + 1;
    }
    // Country
    if (activity.country) {
      countryStats[activity.country] = (countryStats[activity.country] || 0) + 1;
    }
  });

  const totalViews = visibleActivity.length;
  const totalDevices = Object.values(deviceStats).reduce((a, b) => a + b, 0);

  contentDiv.innerHTML = `
    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Visitors</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">${uniqueVisitors.length}</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-user-friends text-white"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Page Views</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">${totalViews}</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-eye text-white"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Countries</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">${Object.keys(countryStats).length}</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-globe text-white"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Avg Pages/Visit</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">${uniqueVisitors.length > 0 ? (totalViews / uniqueVisitors.length).toFixed(1) : '0'}</p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-file-alt text-white"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Device & Location Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Devices -->
      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-laptop text-indigo-500 mr-2"></i>Devices
        </h3>
        <div class="space-y-4">
          ${renderDeviceBar('Desktop', deviceStats.desktop || 0, totalDevices, 'from-blue-500 to-blue-600', 'fa-desktop')}
          ${renderDeviceBar('Mobile', deviceStats.mobile || 0, totalDevices, 'from-green-500 to-green-600', 'fa-mobile-alt')}
          ${renderDeviceBar('Tablet', deviceStats.tablet || 0, totalDevices, 'from-purple-500 to-purple-600', 'fa-tablet-alt')}
        </div>
      </div>

      <!-- Browsers -->
      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-globe text-indigo-500 mr-2"></i>Browsers
        </h3>
        <div class="space-y-3">
          ${Object.entries(browserStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([browser, count]) => renderBrowserItem(browser, count, totalViews))
            .join('')}
          ${Object.keys(browserStats).length === 0 ? '<p class="text-gray-400 text-sm text-center py-4">No data yet</p>' : ''}
        </div>
      </div>

      <!-- Countries -->
      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-map-marker-alt text-indigo-500 mr-2"></i>Top Countries
        </h3>
        <div class="space-y-3">
          ${Object.entries(countryStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, count], index) => renderCountryItem(country, count, totalViews, index))
            .join('')}
          ${Object.keys(countryStats).length === 0 ? '<p class="text-gray-400 text-sm text-center py-4">No data yet</p>' : ''}
        </div>
      </div>
    </div>

    <!-- Recent Visitors Table -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <i class="fas fa-clock text-indigo-500 mr-2"></i>Recent Visitors
        </h3>
        <span class="text-sm text-gray-500">${visibleActivity.length} visits${internalActivityCount ? ` (${internalActivityCount} local/unknown)` : ''}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visitor</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Page</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${visibleActivity.slice(0, 30).map((activity, index) => `
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br ${getVisitorGradient(index)} flex items-center justify-center text-white font-medium text-sm">
                      ${getVisitorInitial(activity.visitor_id)}
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">${activity.visitor_id.substring(0, 12)}...</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="max-w-xs truncate">
                    <p class="text-sm font-medium text-gray-900">${activity.page_title || 'Untitled'}</p>
                    <p class="text-xs text-gray-500 truncate">${activity.page_path}</p>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    ${activity.device_type ? `
                      <span class="inline-flex items-center text-xs text-gray-600">
                        <i class="fas fa-${getDeviceIcon(activity.device_type)} mr-1.5 text-indigo-400"></i>
                        ${activity.device_type}
                      </span>
                    ` : ''}
                    ${activity.browser ? `
                      <span class="inline-flex items-center text-xs text-gray-500">
                        <i class="fas fa-globe mr-1.5 text-gray-400"></i>
                        ${activity.browser}
                      </span>
                    ` : ''}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center text-sm">
                    ${activity.city || activity.country ? `
                      <i class="fas fa-map-marker-alt mr-2 text-red-400"></i>
                      <span class="text-gray-700">${activity.city ? `${activity.city}, ` : ''}${activity.country || ''}</span>
                    ` : `<span class="text-gray-400">${isInternalActivity(activity) ? 'Local / private' : 'Unknown'}</span>`}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-500">${formatTimeAgo(activity.created_at)}</span>
                </td>
              </tr>
            `).join('')}
            ${visibleActivity.length === 0 ? `
              <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                  <div class="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-3">
                    <i class="fas fa-users text-gray-400"></i>
                  </div>
                  <p class="text-gray-500">No visitor data yet</p>
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Helper functions for visitors dashboard
function renderDeviceBar(label, count, total, gradient, icon) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return `
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center flex-shrink-0">
        <i class="fas ${icon} text-white text-xs"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-medium text-gray-700">${label}</span>
          <span class="text-sm text-gray-500">${count}</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
        </div>
      </div>
    </div>
  `;
}

function renderBrowserItem(browser, count, total) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const browserIcons = {
    'Chrome': 'fab fa-chrome text-yellow-500',
    'Safari': 'fab fa-safari text-blue-500',
    'Firefox': 'fab fa-firefox-browser text-orange-500',
    'Edge': 'fab fa-edge text-blue-600',
    'Opera': 'fab fa-opera text-red-500'
  };
  const icon = browserIcons[browser] || 'fas fa-globe text-gray-400';

  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="${icon}"></i>
        <span class="text-sm text-gray-700">${browser}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-900">${count}</span>
        <span class="text-xs text-gray-400">(${percentage}%)</span>
      </div>
    </div>
  `;
}

function renderCountryItem(country, count, total, index) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];

  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 ${colors[index % colors.length]} rounded-full"></div>
        <span class="text-sm text-gray-700">${country}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-900">${count}</span>
        <span class="text-xs text-gray-400">(${percentage}%)</span>
      </div>
    </div>
  `;
}

function getVisitorGradient(index) {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-teal-600'
  ];
  return gradients[index % gradients.length];
}

function getVisitorInitial(visitorId) {
  return visitorId.substring(2, 4).toUpperCase();
}

function getDeviceIcon(deviceType) {
  const icons = {
    'mobile': 'mobile-alt',
    'tablet': 'tablet-alt',
    'desktop': 'desktop'
  };
  return icons[deviceType] || 'laptop';
}

function isInternalActivity(activity) {
  const ip = activity.ip_address || '';
  return !activity.country ||
         ip === '127.0.0.1' ||
         ip === '::1' ||
         ip.startsWith('10.') ||
         ip.startsWith('172.16.') ||
         ip.startsWith('172.17.') ||
         ip.startsWith('172.18.') ||
         ip.startsWith('172.19.') ||
         ip.startsWith('172.20.') ||
         ip.startsWith('172.21.') ||
         ip.startsWith('172.22.') ||
         ip.startsWith('172.23.') ||
         ip.startsWith('172.24.') ||
         ip.startsWith('172.25.') ||
         ip.startsWith('172.26.') ||
         ip.startsWith('172.27.') ||
         ip.startsWith('172.28.') ||
         ip.startsWith('172.29.') ||
         ip.startsWith('172.30.') ||
         ip.startsWith('172.31.') ||
         ip.startsWith('192.168.');
}
