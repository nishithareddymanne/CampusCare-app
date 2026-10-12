/* Administrator dashboard and complaint management. */
(function () {
  'use strict';
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const CATEGORY_COLORS = { CLASSROOM: '#3b82f6', HOSTEL: '#7c4dff', LABORATORY: '#0ea5b7', FACILITIES: '#e0a21a' };
  const DEPT_COLORS = ['#2457d6', '#0ea5b7', '#7c4dff', '#e0a21a', '#10a56f', '#d1324a'];

  function bars(el, map, colorFor) {
    const keys = Object.keys(map);
    const max = Math.max.apply(null, keys.map(function (k) { return map[k]; }).concat([1]));
    el.innerHTML = keys.map(function (k, i) {
      return '<div class="bar-row"><span>' + UI.esc(UI.label(k)) + '</span><div class="bar-track"><div class="bar-fill" style="width:' +
        (map[k] / max * 100) + '%;background:' + colorFor(k, i) + '"></div></div><span class="bar-val">' + map[k] + '</span></div>';
    }).join('');
  }

  function donut(el, map, total) {
    let acc = 0;
    const parts = [];
    Object.keys(map).forEach(function (k) {
      if (!map[k]) return;
      const from = acc / total * 100;
      acc += map[k];
      parts.push(UI.STATUS_COLOR[k] + ' ' + from + '% ' + (acc / total * 100) + '%');
    });
    const ring = total ? 'conic-gradient(' + parts.join(',') + ')' : '#edf1f9';
    el.innerHTML = '<div class="donut-wrap"><div class="donut" id="donutRing"><div class="donut-hole"><div>' + total + '<small>complaints</small></div></div></div><ul class="legend">' +
      Object.keys(map).map(function (k) {
        return '<li><i style="background:' + UI.STATUS_COLOR[k] + '"></i>' + UI.esc(UI.label(k)) + ' <strong>' + map[k] + '</strong></li>';
      }).join('') + '</ul></div>';
    $('#donutRing', el).style.background = ring;
  }

  /* ---------------- Dashboard ---------------- */
  async function initDashboard() {
    const user = await Auth.guard('ADMIN', 'admin-dashboard');
    if (!user) return;
    const statsEl = $('#stats'), charts = $('#charts');
    UI.loading(statsEl);

    async function load() {
      try {
        const d = await Api.get('/admin/dashboard');
        const s = d.byStatus;
        statsEl.innerHTML =
          UI.statCard('Total complaints', d.total, 'file', '#2457d6') +
          UI.statCard('Pending', s.PENDING, 'clock', '#e0a21a') +
          UI.statCard('Assigned', s.ASSIGNED, 'send', '#3b82f6') +
          UI.statCard('In progress', s.IN_PROGRESS, 'activity', '#7c4dff') +
          UI.statCard('Resolved', s.RESOLVED, 'check', '#10a56f') +
          UI.statCard('Rejected', s.REJECTED, 'xcircle', '#d1324a');
        charts.classList.remove('hidden');
        bars($('#catChart'), d.byCategory, function (k) { return CATEGORY_COLORS[k] || '#2457d6'; });
        bars($('#deptChart'), d.byDepartment, function (k, i) { return DEPT_COLORS[i % DEPT_COLORS.length]; });
        donut($('#statusChart'), d.byStatus, d.total);
      } catch (err) {
        charts.classList.add('hidden');
        UI.errorState(statsEl, err, load);
      }
    }
    load();
  }

  /* ---------------- Complaint management ---------------- */
  const VIEWS = {
    all: { title: 'All Complaints', sub: 'Search, filter and manage every complaint.' },
    pending: { title: 'Pending Complaints', sub: 'New complaints waiting for a department.' },
    assign: { title: 'Assign Department', sub: 'Pending and assigned complaints that can be routed to a department.' },
    status: { title: 'Update Status', sub: 'Move assigned complaints through to resolution.' },
    history: { title: 'Complaint History', sub: 'The most recent status changes across all complaints.' }
  };

  async function initComplaints() {
    const param = new URLSearchParams(location.search).get('view');
    const view = VIEWS[param] ? param : 'all';
    const user = await Auth.guard('ADMIN', view);
    if (!user) return;

    $('#pageTitle').textContent = VIEWS[view].title;
    $('#viewTitle').textContent = VIEWS[view].title;
    $('#viewSub').textContent = VIEWS[view].sub;

    const out = $('#list'), q = $('#q'), st = $('#statusFilter'), cat = $('#categoryFilter'), dept = $('#deptFilter');
    let departments = [];
    let rows = [];

    if (view !== 'all') st.classList.add('hidden');
    if (view === 'history') $('#filters').classList.add('hidden');

    try {
      departments = await Api.get('/admin/departments');
      dept.innerHTML = '<option value="">All departments</option>' + departments.map(function (d) {
        return '<option value="' + d.id + '">' + UI.esc(d.name) + '</option>';
      }).join('');
    } catch (err) { UI.toast(err.message, 'error'); }

    function actionLabel() { return view === 'assign' ? 'Assign' : view === 'status' ? 'Update' : view === 'pending' ? 'Assign' : 'Manage'; }

    function renderTable() {
      let list = rows;
      if (view === 'assign') list = rows.filter(function (c) { return c.status === 'PENDING' || c.status === 'ASSIGNED'; });
      if (view === 'status') list = rows.filter(function (c) { return c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS'; });
      if (!list.length) {
        UI.emptyState(out, 'No complaints found', 'Nothing matches the current view or filters.');
        return;
      }
      out.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Student</th><th>Category</th><th>Department</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody>' +
        list.map(function (c) {
          return '<tr><td class="id-cell">#' + c.id + '</td><td><div class="truncate">' + UI.esc(c.title) + '</div></td><td>' + UI.esc(c.studentName) +
            '</td><td>' + UI.esc(UI.label(c.category)) + '</td><td>' + UI.esc(c.department || '—') + '</td><td>' + UI.badge(c.status) +
            '</td><td>' + UI.esc(UI.fmtDate(c.createdAt, false)) + '</td><td><button type="button" class="btn btn-ghost btn-sm js-open" data-id="' + c.id + '">' + actionLabel() + '</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    function renderHistory(list) {
      if (!list.length) { UI.emptyState(out, 'No activity yet', 'Status changes will appear here.'); return; }
      out.innerHTML = '<div class="table-wrap"><table><thead><tr><th>When</th><th>Complaint</th><th>Change</th><th>Remark</th><th>Updated by</th><th></th></tr></thead><tbody>' +
        list.map(function (u) {
          return '<tr><td>' + UI.esc(UI.fmtDate(u.updatedAt)) + '</td><td><span class="id-cell">#' + u.complaintId + '</span> <div class="truncate" style="display:inline-block;vertical-align:bottom">' + UI.esc(u.complaintTitle) + '</div></td><td>' +
            (u.oldStatus ? UI.badge(u.oldStatus) + ' &rarr; ' : '') + UI.badge(u.newStatus) + '</td><td><div class="truncate">' + UI.esc(u.remark || '—') +
            '</div></td><td>' + UI.esc(u.updatedBy) + '</td><td><button type="button" class="btn btn-ghost btn-sm js-open" data-id="' + u.complaintId + '">Timeline</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    async function load() {
      UI.loading(out);
      try {
        if (view === 'history') { renderHistory(await Api.get('/admin/updates')); return; }
        const p = new URLSearchParams();
        if (q.value.trim()) p.set('q', q.value.trim());
        if (view === 'pending') p.set('status', 'PENDING'); else if (st.value) p.set('status', st.value);
        if (cat.value) p.set('category', cat.value);
        if (dept.value) p.set('departmentId', dept.value);
        rows = await Api.get('/admin/complaints' + (p.toString() ? '?' + p.toString() : ''));
        renderTable();
      } catch (err) { UI.errorState(out, err, load); }
    }

    let timer;
    q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(load, 300); });
    [st, cat, dept].forEach(function (el) { el.addEventListener('change', load); });
    out.addEventListener('click', function (e) {
      const b = e.target.closest('.js-open');
      if (b) openModal(parseInt(b.dataset.id, 10));
    });

    /* ----- modal ----- */
    function closeModal() {
      const m = $('.modal-backdrop');
      if (m) m.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') closeModal(); }

    async function openModal(id) {
      closeModal();
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="Complaint details"><div class="modal-head"><h3>Complaint #' + id +
        '</h3><button type="button" class="icon-btn" id="closeModal" aria-label="Close">' + UI.icon('x', 20) + '</button></div><div class="modal-body" id="modalBody"></div></div>';
      document.body.appendChild(wrap);
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeModal(); });
      $('#closeModal', wrap).addEventListener('click', closeModal);
      const body = $('#modalBody', wrap);
      UI.loading(body);
      try {
        renderModal(body, await Api.get('/admin/complaints/' + id));
      } catch (err) { UI.errorState(body, err); }
    }

    function renderModal(body, c) {
      const canAssign = c.status === 'PENDING' || c.status === 'ASSIGNED';
      const nextStatuses = c.allowedNext.filter(function (s) { return s !== 'ASSIGNED'; });
      const closed = c.allowedNext.length === 0;

      body.innerHTML =
        '<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap"><h3 style="margin:0">' + UI.esc(c.title) + '</h3>' + UI.badge(c.status) + '</div>' +
        '<dl class="detail-grid" style="margin-top:1rem"><div><dt>Student</dt><dd>' + UI.esc(c.studentName) + '</dd></div>' +
        '<div><dt>Email</dt><dd>' + UI.esc(c.studentEmail) + '</dd></div>' +
        '<div><dt>Category</dt><dd>' + UI.esc(UI.label(c.category)) + '</dd></div>' +
        '<div><dt>Location</dt><dd>' + UI.esc(c.location) + '</dd></div>' +
        '<div><dt>Department</dt><dd>' + UI.esc(c.department || 'Not assigned') + '</dd></div>' +
        '<div><dt>Submitted</dt><dd>' + UI.esc(UI.fmtDate(c.createdAt)) + '</dd></div></dl>' +
        '<h4>Description</h4><div class="desc">' + UI.esc(c.description) + '</div>' +
        (c.imageUrl ? '<a href="' + UI.esc(c.imageUrl) + '" target="_blank" rel="noopener"><img class="photo" alt="Complaint photo" src="' + UI.esc(c.imageUrl) + '"></a>' : '') +

        (canAssign ? '<div class="modal-section"><h4>' + (c.department ? 'Reassign department' : 'Assign department') + '</h4><form class="action-box" id="assignForm" novalidate>' +
          '<div class="form-row"><div class="field"><label for="aDept">Department</label><select id="aDept" name="departmentId"><option value="">Select department…</option>' +
          departments.map(function (d) { return '<option value="' + d.id + '"' + (c.departmentId === d.id ? ' selected' : '') + '>' + UI.esc(d.name) + '</option>'; }).join('') +
          '</select><div class="field-error" data-error-for="departmentId"></div></div>' +
          '<div class="field"><label for="aRemark">Remark (optional)</label><input id="aRemark" name="remark" maxlength="500" placeholder="Visible to the student"><div class="field-error" data-error-for="remark"></div></div></div>' +
          '<div id="assignAlert"></div><button class="btn btn-primary btn-sm" type="submit">Assign department</button></form></div>' : '') +

        (nextStatuses.length ? '<div class="modal-section"><h4>Update status</h4><form class="action-box" id="statusForm" novalidate>' +
          '<div class="form-row"><div class="field"><label for="sStatus">New status</label><select id="sStatus" name="status">' +
          nextStatuses.map(function (s) { return '<option value="' + s + '">' + UI.esc(UI.label(s)) + '</option>'; }).join('') +
          '</select><div class="field-error" data-error-for="status"></div></div>' +
          '<div class="field"><label for="sRemark">Progress remark</label><input id="sRemark" name="remark" maxlength="500" placeholder="Required when rejecting"><div class="field-error" data-error-for="remark"></div></div></div>' +
          '<div id="statusAlert"></div><button class="btn btn-primary btn-sm" type="submit">Update status</button></form></div>' : '') +

        (c.status === 'PENDING' && !nextStatuses.length ? '' : '') +
        (closed ? '<div class="alert alert-info" style="margin-top:1.2rem">This complaint is ' + UI.esc(UI.label(c.status).toLowerCase()) + ' and can no longer be changed.</div>' : '') +
        (c.status === 'PENDING' ? '<p class="muted" style="margin-top:1rem">Assign a department first to start working on this complaint, or reject it with a remark.</p>' : '') +
        '<div class="modal-section"><h4>Complaint history</h4>' + UI.timeline(c.history) + '</div>';

      bindForm($('#assignForm', body), '#assignAlert', function (f) {
        return Api.put('/admin/complaints/' + c.id + '/assign', { departmentId: f.departmentId.value ? parseInt(f.departmentId.value, 10) : null, remark: f.remark.value.trim() });
      }, 'Department assigned', body);
      bindForm($('#statusForm', body), '#statusAlert', function (f) {
        return Api.put('/admin/complaints/' + c.id + '/status', { status: f.status.value, remark: f.remark.value.trim() });
      }, 'Status updated', body);
    }

    function bindForm(form, alertSel, submit, okMessage, body) {
      if (!form) return;
      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        UI.clearErrors(form);
        const alertEl = $(alertSel, form), btn = $('button[type="submit"]', form);
        UI.alertBox(alertEl, '');
        UI.setBusy(btn, true, 'Saving…');
        try {
          const updated = await submit(form);
          UI.toast(okMessage, 'success');
          renderModal(body, updated);
          load();
        } catch (err) {
          UI.alertBox(alertEl, err.message);
          UI.showFieldErrors(form, err.fieldErrors);
          UI.setBusy(btn, false);
        }
      });
    }

    load();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page;
    if (page === 'admin-dashboard') initDashboard();
    else if (page === 'admin-complaints') initComplaints();
  });
})();
