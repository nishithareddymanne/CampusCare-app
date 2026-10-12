/* CampusCare shared helpers: icons, API client (Fetch), UI utilities. */
(function (global) {
  'use strict';

  const ICONS = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    plus: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    xcircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    history: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'
  };

  function icon(name, size) {
    size = size || 18;
    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------------- API client ---------------- */
  class ApiError extends Error {
    constructor(status, message, fieldErrors) {
      super(message);
      this.status = status;
      this.fieldErrors = fieldErrors || {};
    }
  }

  function csrfToken() {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  async function request(method, url, opts) {
    opts = opts || {};
    const headers = { Accept: 'application/json' };
    const init = { method: method, headers: headers, credentials: 'same-origin' };
    if (method !== 'GET') {
      const t = csrfToken();
      if (t) headers['X-XSRF-TOKEN'] = t;
    }
    if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.json);
    } else if (opts.form) {
      init.body = opts.form; // FormData: browser sets the multipart boundary
    }

    let res;
    try {
      res = await fetch(url, init);
    } catch (e) {
      throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
    }
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }

    if (res.ok) return data;

    const msg = data && data.message;
    if (res.status === 401) {
      if (!opts.skipAuthRedirect) location.href = '/login.html';
      throw new ApiError(401, msg || 'Please log in to continue.');
    }
    if (res.status === 403) {
      throw new ApiError(403, 'You do not have permission to do that. If this keeps happening, refresh the page and log in again.');
    }
    if (res.status >= 500) {
      throw new ApiError(res.status, 'Something went wrong on the server. Please try again later.');
    }
    throw new ApiError(res.status, msg || 'The request failed.', data && data.fieldErrors);
  }

  const Api = {
    get: (url, o) => request('GET', url, o),
    post: (url, json, o) => request('POST', url, Object.assign({ json: json === undefined ? {} : json }, o)),
    put: (url, json, o) => request('PUT', url, Object.assign({ json: json }, o)),
    postForm: (url, form, o) => request('POST', url, Object.assign({ form: form }, o))
  };

  /* ---------------- UI helpers ---------------- */
  const STATUS_LABEL = { PENDING: 'Pending', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', REJECTED: 'Rejected' };
  const STATUS_COLOR = { PENDING: '#e0a21a', ASSIGNED: '#3b82f6', IN_PROGRESS: '#7c4dff', RESOLVED: '#10a56f', REJECTED: '#d1324a' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function label(k) {
    return STATUS_LABEL[k] || String(k || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function fmtDate(iso, withTime) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    let s = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    if (withTime !== false) s += ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return s;
  }
  function badge(status) {
    return '<span class="badge st-' + esc(status) + '">' + esc(label(status)) + '</span>';
  }
  function toast(message, type) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = message;
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, 4500);
  }
  function setBusy(btn, busy, text) {
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> ' + esc(text || 'Please wait…');
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    }
  }
  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(function (e) { e.textContent = ''; });
    form.querySelectorAll('.invalid').forEach(function (e) { e.classList.remove('invalid'); });
  }
  function showFieldErrors(form, errors) {
    Object.keys(errors || {}).forEach(function (name) {
      const out = form.querySelector('[data-error-for="' + name + '"]');
      if (out) out.textContent = errors[name];
      const input = form.querySelector('[name="' + name + '"]');
      if (input) input.classList.add('invalid');
    });
  }
  function alertBox(el, message, type) {
    if (!el) return;
    if (!message) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="alert alert-' + (type || 'error') + '" role="alert">' + esc(message) + '</div>';
  }
  function loading(el, text) {
    el.innerHTML = '<div class="loader"><span class="spinner"></span> ' + esc(text || 'Loading…') + '</div>';
  }
  function emptyState(el, title, text, actionHtml) {
    el.innerHTML = '<div class="empty">' + icon('file', 40) + '<h3>' + esc(title) + '</h3><p>' + esc(text || '') + '</p>' + (actionHtml || '') + '</div>';
  }
  function errorState(el, err, retry) {
    el.innerHTML = '<div class="alert alert-error" role="alert">' + esc(err.message || 'Something went wrong.') +
      (retry ? ' <button class="btn btn-ghost btn-sm" id="retryBtn" type="button">Try again</button>' : '') + '</div>';
    if (retry) { const b = el.querySelector('#retryBtn'); if (b) b.addEventListener('click', retry); }
  }
  function statCard(l, value, iconName, color) {
    return '<div class="stat"><div class="stat-icon" style="background:' + color + '1f;color:' + color + '">' + icon(iconName, 22) +
      '</div><div><div class="stat-value">' + esc(value) + '</div><div class="stat-label">' + esc(l) + '</div></div></div>';
  }
  function timeline(history) {
    if (!history || !history.length) return '<p class="muted">No history yet.</p>';
    return '<ol class="timeline">' + history.map(function (h) {
      const title = h.oldStatus ? esc(label(h.oldStatus)) + ' &rarr; ' + badge(h.newStatus) : 'Submitted ' + badge(h.newStatus);
      return '<li style="--dot:' + (STATUS_COLOR[h.newStatus] || '#2457d6') + '"><div class="tl-title">' + title + '</div>' +
        (h.remark ? '<div class="tl-remark">' + esc(h.remark) + '</div>' : '') +
        '<div class="tl-meta">' + esc(h.updatedBy) + ' &middot; ' + esc(fmtDate(h.updatedAt)) + '</div></li>';
    }).join('') + '</ol>';
  }
  function logo() {
    return '<span class="logo">' + icon('shield', 20) + '</span>';
  }
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = icon(el.dataset.icon, parseInt(el.dataset.size || '20', 10));
    });
  }

  const UI = {
    esc: esc, label: label, fmtDate: fmtDate, badge: badge, toast: toast, setBusy: setBusy,
    clearErrors: clearErrors, showFieldErrors: showFieldErrors, alertBox: alertBox, loading: loading,
    emptyState: emptyState, errorState: errorState, statCard: statCard, timeline: timeline, logo: logo,
    hydrateIcons: hydrateIcons, icon: icon, STATUS_COLOR: STATUS_COLOR, STATUS_LABEL: STATUS_LABEL
  };

  global.Api = Api;
  global.ApiError = ApiError;
  global.UI = UI;
  document.addEventListener('DOMContentLoaded', function () { hydrateIcons(); });
})(window);
