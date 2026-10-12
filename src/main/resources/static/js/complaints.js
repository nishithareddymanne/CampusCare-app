/* Student complaint pages: raise, list (search/filter), details. */
(function () {
  'use strict';
  const $ = function (s) { return document.querySelector(s); };
  const MAX_BYTES = 5 * 1024 * 1024;
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /* ---------------- Raise complaint ---------------- */
  async function initRaise() {
    const user = await Auth.guard('STUDENT', 'raise');
    if (!user) return;
    const form = $('#complaintForm'), box = $('#formAlert'), btn = $('#submitBtn');
    const fileInput = $('#image'), previewBox = $('#preview'), drop = $('#dropzone');
    const desc = form.description, counter = $('#descCount');

    desc.addEventListener('input', function () { counter.textContent = desc.value.length + ' / 2000'; });
    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });

    function clearImage() {
      fileInput.value = '';
      previewBox.innerHTML = '';
      form.querySelector('[data-error-for="image"]').textContent = '';
    }
    fileInput.addEventListener('change', function () {
      const f = fileInput.files[0];
      const err = form.querySelector('[data-error-for="image"]');
      err.textContent = '';
      previewBox.innerHTML = '';
      if (!f) return;
      if (TYPES.indexOf(f.type) === -1) { err.textContent = 'Only JPEG, PNG or WebP images are allowed.'; fileInput.value = ''; return; }
      if (f.size > MAX_BYTES) { err.textContent = 'Image must be 5 MB or smaller.'; fileInput.value = ''; return; }
      const url = URL.createObjectURL(f);
      previewBox.innerHTML = '<div class="preview"><img alt="Selected photo preview" src="' + url + '"><button type="button" class="btn btn-danger btn-sm" id="removeImg">Remove</button></div>';
      $('#removeImg').addEventListener('click', clearImage);
    });

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      UI.clearErrors(form); UI.alertBox(box, '');
      const v = {
        title: form.elements.title.value.trim(), category: form.category.value,
        location: form.location.value.trim(), description: form.description.value.trim()
      };
      const errs = {};
      if (v.title.length < 5 || v.title.length > 150) errs.title = 'Title must be between 5 and 150 characters.';
      if (!v.category) errs.category = 'Please choose a category.';
      if (v.location.length < 2) errs.location = 'Please enter the campus location.';
      if (v.description.length < 10) errs.description = 'Please describe the problem (at least 10 characters).';
      if (Object.keys(errs).length) { UI.showFieldErrors(form, errs); return; }

      const fd = new FormData();
      Object.keys(v).forEach(function (k) { fd.append(k, v[k]); });
      if (fileInput.files[0]) fd.append('image', fileInput.files[0]);

      UI.setBusy(btn, true, 'Submitting…');
      try {
        const c = await Api.postForm('/complaints', fd);
        $('#formWrap').classList.add('hidden');
        const ok = $('#successBox');
        ok.classList.remove('hidden');
        ok.innerHTML = '<div class="big">' + UI.icon('check', 32) + '</div><h3>Complaint submitted</h3>' +
          '<p class="muted">Your complaint ID is <strong>#' + c.id + '</strong>. Its status is Pending until an administrator assigns it.</p>' +
          '<a class="btn btn-primary" href="/complaint-details.html?id=' + c.id + '">Track this complaint</a> ' +
          '<a class="btn btn-ghost" href="/raise-complaint.html">Raise another</a>';
        UI.toast('Complaint submitted successfully', 'success');
      } catch (err) {
        UI.alertBox(box, err.message);
        UI.showFieldErrors(form, err.fieldErrors);
        UI.setBusy(btn, false);
      }
    });
  }

  /* ---------------- My complaints ---------------- */
  async function initMy() {
    const user = await Auth.guard('STUDENT', 'my');
    if (!user) return;
    const out = $('#list'), q = $('#q'), st = $('#statusFilter'), cat = $('#categoryFilter');
    let all = [];

    function render() {
      const text = q.value.trim().toLowerCase().replace('#', '');
      const rows = all.filter(function (c) {
        return (!st.value || c.status === st.value) && (!cat.value || c.category === cat.value) &&
          (!text || String(c.id) === text || c.title.toLowerCase().indexOf(text) !== -1);
      });
      if (!all.length) {
        UI.emptyState(out, 'You have not raised any complaints', 'Found a problem on campus? Report it and follow its progress here.',
          '<a class="btn btn-primary" href="/raise-complaint.html">Raise Complaint</a>');
        return;
      }
      if (!rows.length) { UI.emptyState(out, 'No matching complaints', 'Try a different search or clear the filters.'); return; }
      out.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Location</th><th>Submitted</th><th>Department</th><th>Status</th><th>Latest remark</th><th></th></tr></thead><tbody>' +
        rows.map(function (c) {
          return '<tr><td class="id-cell">#' + c.id + '</td><td><div class="truncate">' + UI.esc(c.title) + '</div></td><td>' + UI.esc(UI.label(c.category)) +
            '</td><td><div class="truncate">' + UI.esc(c.location) + '</div></td><td>' + UI.esc(UI.fmtDate(c.createdAt, false)) +
            '</td><td>' + UI.esc(c.department || 'Not assigned') + '</td><td>' + UI.badge(c.status) +
            '</td><td><div class="truncate">' + UI.esc(c.latestRemark || '—') + '</div></td>' +
            '<td><a class="btn btn-ghost btn-sm" href="/complaint-details.html?id=' + c.id + '">View Details</a></td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    async function load() {
      UI.loading(out);
      try { all = await Api.get('/complaints/my'); render(); } catch (err) { UI.errorState(out, err, load); }
    }
    [q, st, cat].forEach(function (el) { el.addEventListener('input', render); });
    load();
  }

  /* ---------------- Complaint details ---------------- */
  async function initDetails() {
    const user = await Auth.guard('STUDENT', 'my');
    if (!user) return;
    const out = $('#detail');
    const id = new URLSearchParams(location.search).get('id');
    if (!id || !/^\d+$/.test(id)) { UI.errorState(out, { message: 'Invalid complaint link.' }); return; }

    async function load() {
      UI.loading(out);
      try {
        const c = await Api.get('/complaints/' + id);
        $('#pageTitle').textContent = 'Complaint #' + c.id;
        out.innerHTML =
          '<div class="card"><div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start"><h3 style="margin:0">' + UI.esc(c.title) + '</h3>' + UI.badge(c.status) + '</div>' +
          '<dl class="detail-grid" style="margin-top:1.2rem"><div><dt>Category</dt><dd>' + UI.esc(UI.label(c.category)) + '</dd></div>' +
          '<div><dt>Location</dt><dd>' + UI.esc(c.location) + '</dd></div>' +
          '<div><dt>Assigned department</dt><dd>' + UI.esc(c.department || 'Not assigned yet') + '</dd></div>' +
          '<div><dt>Submitted</dt><dd>' + UI.esc(UI.fmtDate(c.createdAt)) + '</dd></div>' +
          '<div><dt>Last updated</dt><dd>' + UI.esc(UI.fmtDate(c.updatedAt)) + '</dd></div>' +
          '<div><dt>Latest remark</dt><dd>' + UI.esc(c.latestRemark || '—') + '</dd></div></dl>' +
          '<h4>Description</h4><div class="desc">' + UI.esc(c.description) + '</div>' +
          (c.imageUrl ? '<a href="' + UI.esc(c.imageUrl) + '" target="_blank" rel="noopener"><img class="photo" alt="Photo attached to the complaint" src="' + UI.esc(c.imageUrl) + '"></a>' : '') +
          '</div><div class="card" style="margin-top:1rem"><h3>Progress history</h3>' + UI.timeline(c.history) + '</div>';
      } catch (err) {
        if (err.status === 404) UI.emptyState(out, 'Complaint not found', 'It may not exist, or it belongs to another student.', '<a class="btn btn-ghost" href="/my-complaints.html">Back to my complaints</a>');
        else UI.errorState(out, err, load);
      }
    }
    load();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page;
    if (page === 'raise-complaint') initRaise();
    else if (page === 'my-complaints') initMy();
    else if (page === 'complaint-details') initDetails();
  });
})();
