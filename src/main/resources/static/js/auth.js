/* Authentication pages (login/register), page guard, sidebar shell and logout. */
(function (global) {
  'use strict';
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pwRe = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

  const NAV = {
    STUDENT: [
      { key: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/student-dashboard.html' },
      { key: 'raise', label: 'Raise Complaint', icon: 'plus', href: '/raise-complaint.html' },
      { key: 'my', label: 'My Complaints', icon: 'list', href: '/my-complaints.html' },
      { key: 'profile', label: 'Profile', icon: 'user', href: '/profile.html' }
    ],
    ADMIN: [
      { key: 'admin-dashboard', label: 'Dashboard', icon: 'grid', href: '/admin-dashboard.html' },
      { key: 'all', label: 'All Complaints', icon: 'list', href: '/admin-complaints.html?view=all' },
      { key: 'pending', label: 'Pending Complaints', icon: 'clock', href: '/admin-complaints.html?view=pending' },
      { key: 'assign', label: 'Assign Department', icon: 'send', href: '/admin-complaints.html?view=assign' },
      { key: 'status', label: 'Update Status', icon: 'edit', href: '/admin-complaints.html?view=status' },
      { key: 'history', label: 'Complaint History', icon: 'history', href: '/admin-complaints.html?view=history' }
    ]
  };

  function dashboardFor(role) { return role === 'ADMIN' ? '/admin-dashboard.html' : '/student-dashboard.html'; }

  async function logout() {
    try { await Api.post('/auth/logout', {}, { skipAuthRedirect: true }); } catch (e) { /* ignore */ }
    location.href = '/login.html';
  }

  function renderShell(user, role, active) {
    const items = NAV[role].map(function (n) {
      return '<a class="nav-link' + (n.key === active ? ' active' : '') + '" href="' + n.href + '">' + UI.icon(n.icon) + '<span>' + n.label + '</span></a>';
    }).join('');
    const initials = user.name.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
    $('#sidebar').innerHTML =
      '<a class="brand" href="' + dashboardFor(role) + '">' + UI.logo() + '<span>Campus<b>Care</b></span></a>' +
      '<nav class="nav" aria-label="Main">' + items + '<div class="nav-sep"></div>' +
      '<button class="nav-link" id="logoutBtn" type="button">' + UI.icon('logout') + '<span>Logout</span></button></nav>' +
      '<div class="sidebar-foot"><div class="avatar">' + UI.esc(initials) + '</div><div><strong>' + UI.esc(user.name) + '</strong><small>' +
      (role === 'ADMIN' ? 'Administrator' : 'Student') + '</small></div></div>';
    const top = $('#topUser');
    if (top) top.textContent = user.email;

    const sidebar = $('#sidebar'), overlay = $('#overlay'), menuBtn = $('#menuBtn');
    function toggle(open) { sidebar.classList.toggle('open', open); overlay.classList.toggle('show', open); }
    if (menuBtn) menuBtn.addEventListener('click', function () { toggle(!sidebar.classList.contains('open')); });
    if (overlay) overlay.addEventListener('click', function () { toggle(false); });
    $('#logoutBtn').addEventListener('click', logout);
  }

  /** Verifies the session on the server, checks the role, and renders the sidebar. Returns the user or null. */
  async function guard(role, active) {
    try {
      const user = await Api.get('/auth/me');
      if (user.role !== role) { location.replace(dashboardFor(user.role)); return null; }
      renderShell(user, role, active);
      return user;
    } catch (e) {
      return null; // 401 -> Api already redirected to the login page
    }
  }

  /* ---------------- Login ---------------- */
  async function initLogin() {
    const form = $('#loginForm'), box = $('#formAlert'), btn = $('#submitBtn');
    const params = new URLSearchParams(location.search);
    if (params.get('registered')) UI.alertBox(box, 'Account created. Please log in.', 'success');

    try {
      const me = await Api.get('/auth/me', { skipAuthRedirect: true });
      location.replace(dashboardFor(me.role));
      return;
    } catch (e) { /* not logged in */ }

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      UI.clearErrors(form); UI.alertBox(box, '');
      const email = form.email.value.trim(), password = form.password.value;
      const errs = {};
      if (!emailRe.test(email)) errs.email = 'Please enter a valid email address.';
      if (!password) errs.password = 'Password is required.';
      if (Object.keys(errs).length) { UI.showFieldErrors(form, errs); return; }
      UI.setBusy(btn, true, 'Logging in…');
      try {
        const user = await Api.post('/auth/login', { email: email, password: password }, { skipAuthRedirect: true });
        location.href = dashboardFor(user.role);
      } catch (err) {
        UI.alertBox(box, err.message);
        UI.showFieldErrors(form, err.fieldErrors);
        UI.setBusy(btn, false);
      }
    });
  }

  /* ---------------- Register ---------------- */
  function initRegister() {
    const form = $('#registerForm'), box = $('#formAlert'), btn = $('#submitBtn');
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      UI.clearErrors(form); UI.alertBox(box, '');
      const data = {
        name: form.elements.name.value.trim(), email: form.email.value.trim(),
        password: form.password.value, confirmPassword: form.confirmPassword.value
      };
      const errs = {};
      if (data.name.length < 2) errs.name = 'Please enter your full name.';
      if (!emailRe.test(data.email)) errs.email = 'Please enter a valid college email.';
      if (!pwRe.test(data.password)) errs.password = 'Use 8-72 characters with at least one letter and one number.';
      if (data.password !== data.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
      if (Object.keys(errs).length) { UI.showFieldErrors(form, errs); return; }
      UI.setBusy(btn, true, 'Creating account…');
      try {
        await Api.post('/auth/signup', data, { skipAuthRedirect: true });
        location.href = '/login.html?registered=1';
      } catch (err) {
        UI.alertBox(box, err.message);
        UI.showFieldErrors(form, err.fieldErrors);
        UI.setBusy(btn, false);
      }
    });
  }

  /* ---------------- Landing page ---------------- */
  async function initLanding() {
    const loginLink = $('#navLogin'), cta = $('#navCta');
    const toggle = $('#navToggle'), links = $('#navLinks');
    try {
      const me = await Api.get('/auth/me', { skipAuthRedirect: true });
      if (loginLink) loginLink.classList.add('hidden');
      if (cta) { cta.textContent = 'Open dashboard'; cta.href = dashboardFor(me.role); }
      document.querySelectorAll('.js-start').forEach(function (a) { a.href = dashboardFor(me.role); });
    } catch (e) { /* visitor */ }
    if (toggle && links) toggle.addEventListener('click', function () { links.classList.toggle('hidden'); });
  }

  global.Auth = { guard: guard, dashboardFor: dashboardFor, logout: logout };

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page;
    if (page === 'login') initLogin();
    else if (page === 'register') initRegister();
    else if (page === 'landing') initLanding();
  });
})(window);
