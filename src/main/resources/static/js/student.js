/* Student dashboard and profile page. */
(function () {
  'use strict';
  const $ = function (s) { return document.querySelector(s); };

  async function initDashboard() {
    const user = await Auth.guard('STUDENT', 'dashboard');
    if (!user) return;
    $('#welcome').textContent = 'Welcome back, ' + user.name.split(/\s+/)[0];
    const statsEl = $('#stats'), recentEl = $('#recent');
    UI.loading(statsEl); UI.loading(recentEl);

    async function load() {
      try {
        const results = await Promise.all([Api.get('/complaints/stats'), Api.get('/complaints/my')]);
        const s = results[0], list = results[1];
        statsEl.innerHTML =
          UI.statCard('Total complaints', s.total, 'file', '#2457d6') +
          UI.statCard('Pending', s.pending + s.assigned, 'clock', '#e0a21a') +
          UI.statCard('In progress', s.inProgress, 'activity', '#7c4dff') +
          UI.statCard('Resolved', s.resolved, 'check', '#10a56f') +
          UI.statCard('Rejected', s.rejected, 'xcircle', '#d1324a');
        renderRecent(list.slice(0, 5));
      } catch (err) {
        UI.errorState(statsEl, err, load);
        recentEl.innerHTML = '';
      }
    }

    function renderRecent(list) {
      if (!list.length) {
        UI.emptyState(recentEl, 'No complaints yet', 'Report a campus problem and track it here.',
          '<a class="btn btn-primary" href="/raise-complaint.html">Raise a complaint</a>');
        return;
      }
      recentEl.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Latest remark</th><th>Updated</th><th></th></tr></thead><tbody>' +
        list.map(function (c) {
          return '<tr><td class="id-cell">#' + c.id + '</td><td><div class="truncate">' + UI.esc(c.title) + '</div></td><td>' + UI.badge(c.status) +
            '</td><td><div class="truncate">' + UI.esc(c.latestRemark || '—') + '</div></td><td>' + UI.esc(UI.fmtDate(c.updatedAt, false)) +
            '</td><td><a class="btn btn-ghost btn-sm" href="/complaint-details.html?id=' + c.id + '">View Details</a></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    load();
  }

  async function initProfile() {
    const user = await Auth.guard('STUDENT', 'profile');
    if (!user) return;
    $('#profileCard').innerHTML =
      '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem"><div class="avatar" style="width:60px;height:60px;font-size:1.3rem">' +
      UI.esc(user.name.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase()) +
      '</div><div><h3 style="margin:0">' + UI.esc(user.name) + '</h3><span class="muted">Student</span></div></div>' +
      '<dl class="detail-grid"><div><dt>Full name</dt><dd>' + UI.esc(user.name) + '</dd></div>' +
      '<div><dt>College email</dt><dd>' + UI.esc(user.email) + '</dd></div>' +
      '<div><dt>Role</dt><dd>' + UI.esc(user.role) + '</dd></div>' +
      '<div><dt>Member since</dt><dd>' + UI.esc(UI.fmtDate(user.createdAt, false)) + '</dd></div></dl>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page;
    if (page === 'student-dashboard') initDashboard();
    else if (page === 'profile') initProfile();
  });
})();
