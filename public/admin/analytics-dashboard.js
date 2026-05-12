// ===== ANALYTICS DASHBOARD =====
// Unified analytics + visitor intelligence dashboard.

async function loadAnalyticsDashboard() {
  const content = document.getElementById('content-area');

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p class="text-gray-500 mt-1">Public traffic, visitor quality, and content engagement in one view</p>
        </div>
        <button onclick="loadAnalyticsDashboard()" class="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
          <i class="fas fa-sync-alt mr-2"></i>Refresh
        </button>
      </div>

      <div id="analytics-loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-900 to-indigo-700 rounded-2xl mb-4 animate-pulse">
            <i class="fas fa-chart-line text-white text-2xl"></i>
          </div>
          <p class="text-gray-500 font-medium">Loading analytics...</p>
        </div>
      </div>

      <div id="analytics-content" class="hidden space-y-6"></div>
    </div>
  `;

  try {
    const [stats, recentActivity, resumeStats] = await Promise.all([
      apiCall('/analytics/stats/overall'),
      apiCall('/analytics/activity/recent?limit=200'),
      apiCall('/analytics/stats/resume').catch(() => null),
    ]);

    displayAnalytics(stats, recentActivity, resumeStats);
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

function displayAnalytics(stats, recentActivity, resumeStats) {
  document.getElementById('analytics-loading').classList.add('hidden');
  const contentDiv = document.getElementById('analytics-content');
  contentDiv.classList.remove('hidden');

  const visitors = buildVisitorInsights(recentActivity || []);
  const topCountry = Object.entries(visitors.countryStats).sort((a, b) => b[1] - a[1])[0];
  const topBrowser = Object.entries(visitors.browserStats).sort((a, b) => b[1] - a[1])[0];
  const returningVisitors = visitors.uniqueVisitors.filter(visitor => visitor.pageViews > 1).length;
  const returningRate = visitors.uniqueVisitors.length
    ? Math.round((returningVisitors / visitors.uniqueVisitors.length) * 100)
    : 0;

  contentDiv.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      ${renderKpiCard('Public Page Views', stats.total_page_views, 'Excludes admin/local traffic', 'fa-eye', 'from-blue-600 to-indigo-600')}
      ${renderKpiCard('Known Visitors', stats.unique_visitors_total, `${stats.unique_visitors_today} today`, 'fa-users', 'from-emerald-600 to-green-600')}
      ${renderKpiCard('7-Day Visitors', stats.unique_visitors_week, `${stats.unique_visitors_month} in last 30 days`, 'fa-calendar-week', 'from-amber-600 to-orange-600')}
      ${renderKpiCard('Blog Reads', stats.total_blog_views, `${stats.total_blog_visitors || 0} readers`, 'fa-book-open', 'from-purple-600 to-violet-600')}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section class="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Visitor Quality</h3>
            <p class="text-sm text-gray-500">Based on the latest ${visitors.totalViews} captured visits</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            ${visitors.internalActivityCount} local/unknown rows
          </span>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
          ${renderMiniMetric('Recent Visitors', visitors.uniqueVisitors.length, 'latest 200 rows')}
          ${renderMiniMetric('Avg Pages/Visitor', visitors.avgPagesPerVisitor, 'recent sample')}
          ${renderMiniMetric('Returning Rate', `${returningRate}%`, `${returningVisitors} multi-page visitors`)}
          ${renderMiniMetric('Countries', Object.keys(visitors.countryStats).length, topCountry ? topCountry[0] : 'no location yet')}
        </div>
      </section>

      <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Fast Read</h3>
        <div class="space-y-4">
          ${renderInsightLine('Top country', topCountry ? `${topCountry[0]} (${topCountry[1]})` : 'Unknown')}
          ${renderInsightLine('Top browser', topBrowser ? `${topBrowser[0]} (${topBrowser[1]})` : 'Unknown')}
          ${renderInsightLine('Mobile share', `${visitors.mobileShare}%`)}
          ${renderInsightLine('Last visit', visitors.latestVisit ? formatTimeAgo(visitors.latestVisit.created_at) : 'No visits')}
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-laptop text-indigo-500 mr-2"></i>Devices
        </h3>
        <div class="space-y-4">
          ${renderDeviceBar('Desktop', visitors.deviceStats.desktop || 0, visitors.totalDevices, 'from-blue-500 to-blue-600', 'fa-desktop')}
          ${renderDeviceBar('Mobile', visitors.deviceStats.mobile || 0, visitors.totalDevices, 'from-green-500 to-green-600', 'fa-mobile-alt')}
          ${renderDeviceBar('Tablet', visitors.deviceStats.tablet || 0, visitors.totalDevices, 'from-purple-500 to-purple-600', 'fa-tablet-alt')}
        </div>
      </section>

      <section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-globe text-indigo-500 mr-2"></i>Browsers
        </h3>
        <div class="space-y-3">
          ${Object.entries(visitors.browserStats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([browser, count]) => renderBrowserItem(browser, count, visitors.totalViews)).join('')}
          ${Object.keys(visitors.browserStats).length === 0 ? '<p class="text-gray-400 text-sm text-center py-4">No data yet</p>' : ''}
        </div>
      </section>

      <section class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas fa-map-marker-alt text-indigo-500 mr-2"></i>Countries
        </h3>
        <div class="space-y-3">
          ${Object.entries(visitors.countryStats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count], index) => renderCountryItem(country, count, visitors.totalViews, index)).join('')}
          ${Object.keys(visitors.countryStats).length === 0 ? '<p class="text-gray-400 text-sm text-center py-4">No country data yet</p>' : ''}
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      ${renderTopPages(stats.top_pages || [])}
      ${renderRecentVisitors(visitors.visibleActivity)}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      ${renderTabEngagement(stats.tab_stats || [])}
      ${renderPopularPosts(stats.top_blog_posts || [])}
    </div>

    ${resumeStats ? renderResumeStats(resumeStats) : ''}
  `;
}

function buildVisitorInsights(recentActivity) {
  const visibleActivity = recentActivity.filter(activity => activity.visitor_id && activity.page_path);
  const internalActivityCount = visibleActivity.filter(isInternalActivity).length;
  const visitorMap = new Map();
  const deviceStats = { mobile: 0, tablet: 0, desktop: 0 };
  const browserStats = {};
  const countryStats = {};

  visibleActivity.forEach(activity => {
    if (!visitorMap.has(activity.visitor_id)) {
      visitorMap.set(activity.visitor_id, { ...activity, pageViews: 1, pages: [activity.page_path] });
    } else {
      const existing = visitorMap.get(activity.visitor_id);
      existing.pageViews += 1;
      if (!existing.pages.includes(activity.page_path)) existing.pages.push(activity.page_path);
    }

    if (activity.device_type) deviceStats[activity.device_type] = (deviceStats[activity.device_type] || 0) + 1;
    if (activity.browser) browserStats[activity.browser] = (browserStats[activity.browser] || 0) + 1;
    if (activity.country) countryStats[activity.country] = (countryStats[activity.country] || 0) + 1;
  });

  const uniqueVisitors = Array.from(visitorMap.values());
  const totalViews = visibleActivity.length;
  const totalDevices = Object.values(deviceStats).reduce((sum, count) => sum + count, 0);
  const avgPagesPerVisitor = uniqueVisitors.length ? (totalViews / uniqueVisitors.length).toFixed(1) : '0';
  const mobileShare = totalDevices ? Math.round(((deviceStats.mobile || 0) / totalDevices) * 100) : 0;

  return {
    visibleActivity,
    uniqueVisitors,
    internalActivityCount,
    deviceStats,
    browserStats,
    countryStats,
    totalViews,
    totalDevices,
    avgPagesPerVisitor,
    mobileShare,
    latestVisit: visibleActivity[0] || null,
  };
}

function renderKpiCard(label, value, caption, icon, gradient) {
  return `
    <div class="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">${label}</p>
          <p class="text-3xl font-bold text-gray-950">${Number(value || 0).toLocaleString()}</p>
          <p class="text-xs text-gray-400 mt-2">${caption}</p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <i class="fas ${icon} text-white"></i>
        </div>
      </div>
    </div>
  `;
}

function renderMiniMetric(label, value, caption) {
  return `
    <div class="p-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">${label}</p>
      <p class="mt-2 text-2xl font-bold text-gray-950">${value}</p>
      <p class="mt-1 text-xs text-gray-500 truncate">${caption}</p>
    </div>
  `;
}

function renderInsightLine(label, value) {
  return `
    <div class="flex items-center justify-between gap-4">
      <span class="text-sm text-gray-500">${label}</span>
      <span class="text-sm font-semibold text-gray-900 text-right">${value}</span>
    </div>
  `;
}

function renderTopPages(pages) {
  return `
    <section class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <i class="fas fa-fire text-orange-500 mr-2"></i>Top Pages
        </h3>
      </div>
      <div class="divide-y divide-gray-50">
        ${pages.slice(0, 6).map((page, index) => `
          <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
        ${pages.length === 0 ? renderEmptyState('fa-chart-bar', 'No page views yet') : ''}
      </div>
    </section>
  `;
}

function renderRecentVisitors(activity) {
  return `
    <section class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <i class="fas fa-clock text-indigo-500 mr-2"></i>Recent Visitors
        </h3>
        <span class="text-sm text-gray-500">${activity.length} recent visits</span>
      </div>
      <div class="divide-y divide-gray-50 max-h-[31rem] overflow-auto">
        ${activity.slice(0, 12).map((item, index) => `
          <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br ${getVisitorGradient(index)} flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                ${getVisitorInitial(item.visitor_id)}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p class="text-sm font-semibold text-gray-900">${item.visitor_id.substring(0, 12)}...</p>
                  <span class="text-xs text-gray-400">${formatTimeAgo(item.created_at)}</span>
                </div>
                <p class="text-sm text-gray-700 truncate mt-1">${item.page_title || 'Untitled'}</p>
                <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span><i class="fas fa-${getDeviceIcon(item.device_type)} mr-1"></i>${item.device_type || 'unknown'}</span>
                  <span><i class="fas fa-globe mr-1"></i>${item.browser || 'unknown'}</span>
                  <span><i class="fas fa-map-marker-alt mr-1"></i>${formatLocation(item)}</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
        ${activity.length === 0 ? renderEmptyState('fa-users', 'No visitor data yet') : ''}
      </div>
    </section>
  `;
}

function renderTabEngagement(tabs) {
  return `
    <section class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <i class="fas fa-layer-group text-indigo-500 mr-2"></i>Tab Engagement
        </h3>
      </div>
      <div class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        ${tabs.slice(0, 6).map(tab => `
          <div class="rounded-xl bg-gray-50 p-4">
            <p class="text-xs font-medium text-gray-500 capitalize mb-2">${tab.tab_name}</p>
            <p class="text-2xl font-bold text-gray-900">${tab.total_visits}</p>
            <p class="text-xs text-gray-400 mt-1">${tab.unique_visitors} unique</p>
          </div>
        `).join('')}
        ${tabs.length === 0 ? '<p class="text-gray-400 text-sm">No tab data yet</p>' : ''}
      </div>
    </section>
  `;
}

function renderPopularPosts(posts) {
  return `
    <section class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
          <i class="fas fa-trophy text-yellow-500 mr-2"></i>Popular Posts
        </h3>
      </div>
      <div class="divide-y divide-gray-50">
        ${posts.slice(0, 5).map((post, index) => `
          <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 bg-gradient-to-br ${getMedalGradient(index)} rounded-lg flex items-center justify-center flex-shrink-0">
                ${index < 3 ? '<i class="fas fa-medal text-white text-sm"></i>' : `<span class="text-sm font-bold text-gray-600">${index + 1}</span>`}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">${post.title}</p>
                <p class="text-xs text-gray-500 mt-1">${post.unique_views} unique${post.avg_time_spent ? ` · ${Math.round(post.avg_time_spent)}s avg` : ''}</p>
              </div>
              <p class="text-lg font-bold text-purple-600">${post.total_views}</p>
            </div>
          </div>
        `).join('')}
        ${posts.length === 0 ? renderEmptyState('fa-book', 'No blog views yet') : ''}
      </div>
    </section>
  `;
}

function renderResumeStats(resumeStats) {
  return `
    <section class="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
      <h3 class="text-lg font-semibold mb-4 flex items-center"><i class="fas fa-file-alt mr-2"></i>Resume Analytics</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${renderResumeMetric('Views', resumeStats.total_views, `${resumeStats.unique_viewers} unique`)}
        ${renderResumeMetric('Downloads', resumeStats.total_downloads, `${resumeStats.unique_downloaders} unique`)}
        ${renderResumeMetric('Last Viewed', resumeStats.last_viewed ? formatTimeAgo(resumeStats.last_viewed) : 'Never', '')}
        ${renderResumeMetric('Last Download', resumeStats.last_downloaded ? formatTimeAgo(resumeStats.last_downloaded) : 'Never', '')}
      </div>
    </section>
  `;
}

function renderResumeMetric(label, value, caption) {
  return `
    <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
      <p class="text-cyan-100 text-xs font-medium mb-1">${label}</p>
      <p class="text-2xl font-bold">${value}</p>
      ${caption ? `<p class="text-cyan-100 text-xs mt-1">${caption}</p>` : ''}
    </div>
  `;
}

function renderEmptyState(icon, text) {
  return `
    <div class="px-6 py-8 text-center">
      <i class="fas ${icon} text-gray-300 text-3xl mb-2"></i>
      <p class="text-gray-400">${text}</p>
    </div>
  `;
}

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
          <div class="h-full bg-gradient-to-r ${gradient} rounded-full" style="width: ${percentage}%"></div>
        </div>
      </div>
    </div>
  `;
}

function renderBrowserItem(browser, count, total) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const browserIcons = {
    Chrome: 'fab fa-chrome text-yellow-500',
    Safari: 'fab fa-safari text-blue-500',
    Firefox: 'fab fa-firefox-browser text-orange-500',
    Edge: 'fab fa-edge text-blue-600',
    Opera: 'fab fa-opera text-red-500',
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

function formatLocation(activity) {
  if (activity.city || activity.country) {
    return `${activity.city ? `${activity.city}, ` : ''}${activity.country || ''}`;
  }
  return isInternalActivity(activity) ? 'Local/private' : 'Unknown';
}

function getVisitorGradient(index) {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-teal-600',
  ];
  return gradients[index % gradients.length];
}

function getVisitorInitial(visitorId) {
  return String(visitorId || 'visitor').substring(2, 4).toUpperCase() || 'V';
}

function getDeviceIcon(deviceType) {
  const icons = {
    mobile: 'mobile-alt',
    tablet: 'tablet-alt',
    desktop: 'desktop',
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

function getMedalGradient(index) {
  const gradients = [
    'from-yellow-400 to-yellow-500',
    'from-gray-300 to-gray-400',
    'from-amber-600 to-amber-700',
    'from-gray-100 to-gray-200',
  ];
  return gradients[index] || gradients[3];
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now - date) / 1000));

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}
