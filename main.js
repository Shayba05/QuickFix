/* QuickFix Pro – App Logic (resilient Firestore + no stuck spinners)
 * - Firestore transport forced to long-poll; no persistence while debugging
 * - All Firestore calls are timeboxed or fire-and-forget so UI never hangs
 * - Signup/Login still close modals + toast even if Firestore is offline
 * - Uploads: fail fast, clear progress UI, readable errors
 */

(function () {
  const init = () => {
    // ---- Firebase init ----
    const firebaseConfig = {
      apiKey: "AIzaSyBYlkzJFlUWEACtLZ_scg_XWSt5fkv0cGM",
      authDomain: "quickfix-cee4a.firebaseapp.com",
      projectId: "quickfix-cee4a",
      storageBucket: "quickfix-cee4a.appspot.com",
      messagingSenderId: "1075514949479",
      appId: "1:1075514949479:web:83906b6cd54eeaa48cb9c2",
      measurementId: "G-XS4LDTFRSH"
    };

    // You’re using the v8 compat style in code. That’s fine as long as the compat bundle is loaded.
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    try { firebase.analytics(); } catch (_) {}

    // Cap Firebase Storage automatic retries so "Uploading…" doesn't hang forever
    try {
      storage.setMaxUploadRetryTime(15000);
      storage.setMaxOperationRetryTime(15000);
    } catch (_) {}

    // ---------- Firestore: force safe transport & avoid persistence while debugging ----------
    try {
      if (db?.settings) {
        db.settings({
          ignoreUndefinedProperties: true,
          // These two avoid the flaky streaming transport that’s 400’ing on your network
          experimentalAutoDetectLongPolling: true,
          experimentalForceLongPolling: true,
          useFetchStreams: false
        });
      }

      // IMPORTANT: while you’re seeing 400s, don’t enable persistence (it can mask connection issues).
      // If you previously had it on, clear the tab and hard-reload.
      // If you later want it back: db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    } catch (_) {}

    // ---- Helpers ----
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));
    const show = (el) => el && el.classList.remove('hidden');
    const hide = (el) => el && el.classList.add('hidden');
    const pruneUndefined = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined));

    const withTimeout = (promise, ms = 8000, label = 'Operation timed out') =>
      Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms))]);

    function setLoading(btn, isLoading, loadingLabel, defaultHTML) {
      if (!btn) return;
      if (isLoading) {
        if (btn.dataset.busy === '1') return;
        btn.dataset.busy = '1';
        btn.dataset.prevHtml = defaultHTML ?? btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingLabel || 'Working...'}`;
      } else {
        btn.dataset.busy = '0';
        btn.disabled = false;
        btn.innerHTML = defaultHTML ?? btn.dataset.prevHtml ?? 'Done';
      }
    }

    const toastEl = $('#toast');
    function toast(msg, type = 'success', ms = 2400) {
      if (!toastEl) { console.log(`[toast:${type}]`, msg); return; }
      toastEl.textContent = msg;
      toastEl.className = '';
      toastEl.id = 'toast';
      toastEl.classList.add('show', type);
      show(toastEl);
      setTimeout(() => { toastEl.classList.remove('show'); hide(toastEl); }, ms);
    }

    // Human-friendly Firebase error text
    function mapFirebaseError(err) {
      const code = String(err?.code || '').toLowerCase();
      if (code.includes('storage/unauthorized')) return 'Not allowed to upload: check Firebase Storage rules.';
      if (code.includes('permission-denied'))    return 'Permission denied by Firestore/Storage rules.';
      if (code.includes('retry-limit-exceeded')) return 'Network unstable; please try again.';
      if (code.includes('unavailable'))          return 'Couldn’t reach Firestore. Network/proxy is blocking it.';
      if (code.includes('canceled'))             return 'Upload canceled.';
      return err?.message || 'Operation failed';
    }

    // --- NEW: quick preflight reachability check for Firestore ---
    async function canReachFirestore() {
      try {
        await withTimeout(db.collection('_ping').limit(1).get(), 8000, 'firestore-timeout');
        return true;
      } catch (_) { return false; }
    }

    // Extra visibility while debugging
    window.addEventListener('offline', () => toast('You are offline. Check your connection.', 'error', 3000));
    window.addEventListener('online', () => toast('Back online', 'success', 1500));
    console.info('[QuickFix] navigator.onLine =', navigator.onLine);

    const views = {
      customer: $('#customerView'),
      professional: $('#professionalView'),
      admin: $('#adminView'),
      settings: $('#settingsView'),
    };

    function switchView(name) {
      Object.values(views).forEach(hide);
      show(views[name]);
      $$('.mobile-nav .nav-item').forEach(i => i.classList.remove('active'));
      if (name === 'customer') $('#mobileCustomer')?.classList.add('active');
      if (name === 'admin') $('#mobileAdmin')?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('hidden');
      requestAnimationFrame(() => {
        el.classList.add('show');
        const focusable = el.querySelector('input, select, textarea, button');
        if (focusable) focusable.focus({ preventScroll: true });
      });
    }
    function closeModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 180);
    }

    document.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      const content = e.target.closest('.modal-content');
      if (overlay && !content && overlay.classList.contains('show')) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.classList.add('hidden'), 180);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.show').forEach(m => {
          m.classList.remove('show'); setTimeout(() => m.classList.add('hidden'), 180);
        });
      }
    });

    // ---- Location ----
    (function initLocation() {
      const pill = $('#locationPill'), citySpan = $('#locationCity');
      if (!pill) return;
      try {
        navigator.geolocation.getCurrentPosition(
          () => { citySpan.textContent = 'Nearby'; show(pill); },
          () => { citySpan.textContent = 'Your area'; show(pill); },
          { timeout: 1500 }
        );
      } catch (_) { show(pill); }
    })();

    // ---- Homepage data ----
    const popular = [
      { name:'Plumbing', icon:'fa-faucet', color:'bg-blue-500' },
      { name:'Electrical', icon:'fa-bolt', color:'bg-yellow-500' },
      { name:'HVAC', icon:'fa-fan', color:'bg-cyan-600' },
      { name:'Handyman', icon:'fa-screwdriver-wrench', color:'bg-emerald-600' },
      { name:'Carpentry', icon:'fa-hammer', color:'bg-orange-500' },
      { name:'Cleaning', icon:'fa-broom', color:'bg-indigo-500' },
    ];
    const categories = [
      'Plumbing','Electrical','HVAC','Handyman','Carpentry','Cleaning',
      'Gardening','Painting','Locksmith','IT Support','Moving','Appliances'
    ];
    const pros = [
      { name:'Amina R.', title:'Master Plumber', rating:4.95, jobs:312 },
      { name:'Victor K.', title:'Certified Electrician', rating:4.92, jobs:287 },
      { name:'Lina P.', title:'AC Specialist', rating:4.90, jobs:201 },
    ];

    function renderPopular() {
      const c = $('#popularServices'); if (!c) return;
      c.innerHTML = popular.map(p => `
        <div class="card card-interactive animate-scale-in text-center" data-action="navigate-service" data-service="${p.name}">
          <div class="service-icon ${p.color} mx-auto mb-2"><i class="fas ${p.icon}" aria-hidden="true"></i></div>
          <div class="font-bold">${p.name}</div>
        </div>`).join('');
    }
    function renderCategories() {
      const c = $('#serviceCategories'); if (!c) return;
      c.innerHTML = categories.map(n => `
        <div class="card card-interactive animate-slide-up text-center" data-action="navigate-service" data-service="${n}">
          <div class="font-bold">${n}</div>
        </div>`).join('');
    }
    function renderFeaturedPros() {
      const c = $('#featuredProfessionals'); if (!c) return;
      c.innerHTML = pros.map((p, i) => `
        <div class="card professional-card animate-slide-up">
          <div class="flex items-center gap-3">
            <div class="avatar-container w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold" aria-hidden="true">
              ${p.name.charAt(0)}
            </div>
            <div>
              <div class="font-bold">${p.name}</div>
              <div class="text-sm text-gray-500">${p.title}</div>
            </div>
            <div class="ml-auto text-sm font-semibold">${p.rating}★ • ${p.jobs}</div>
          </div>
          <button class="btn-base btn-outline w-full mt-4" data-action="open-profile" data-index="${i}">
            View Profile
          </button>
        </div>`).join('');
    }
    renderPopular(); renderCategories(); renderFeaturedPros();

    // ---- Global actions ----
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'go-home') switchView('customer');
      if (action === 'go-professional') switchView('professional');
      if (action === 'switch-view') switchView(btn.dataset.view);
      if (action === 'open-modal') openModal(btn.dataset.modal);
      if (action === 'close-modal') closeModal(btn.dataset.modal);
      if (action === 'swap-modal') { closeModal(btn.dataset.close); setTimeout(()=>openModal(btn.dataset.open), 180); }

      if (action === 'open-my-profile') showMyProfile();
      if (action === 'open-settings') { closeModal('userMenuModal'); switchView('settings'); }
      if (action === 'logout') { await auth.signOut().catch(()=>{}); toast('Signed out'); }

      if (action === 'search-from-input') doSearch($('#searchInput')?.value);
      if (action === 'search-from-mobile') doSearch($('#mobileSearchInput')?.value);
      if (action === 'navigate-service') doSearch(btn.dataset.service);

      if (action === 'start-reset') {
        const email = $('#login-email')?.value?.trim();
        if (!email) return toast('Enter your email first', 'error');
        try { await withTimeout(auth.sendPasswordResetEmail(email), 12000, 'Reset email timed out'); toast('Password reset email sent'); }
        catch (err) { toast(err.message || 'Failed to send reset email', 'error', 4000); }
      }

      if (action === 'use-current-location') {
        try {
          navigator.geolocation.getCurrentPosition(
            () => { const i = $('#signupCity'); if (i) i.value = 'Nearby'; },
            () => toast('Couldn’t get location (permission denied)', 'error', 3000),
            { timeout: 1500 }
          );
        } catch (_) {}
      }

      if (action === 'send-reset-email') {
        const user = auth.currentUser;
        if (!user?.email) return toast('Sign in first', 'error');
        try { await withTimeout(auth.sendPasswordResetEmail(user.email), 12000); toast('Password reset email sent'); }
        catch (err) { toast(err.message || 'Failed to send reset email', 'error'); }
      }
      if (action === 'relogin') {
        await auth.signOut().catch(()=>{});
        toast('Please sign in again');
        openModal('loginModal');
      }
      if (action === 'delete-account') {
        const user = auth.currentUser;
        if (!user) return openModal('loginModal');
        if (!confirm('Delete your account and data? This action cannot be undone.')) return;
        try {
          // Fire-and-forget deletes so UI doesn’t hang if Firestore is offline
          db.collection('users').doc(user.uid).delete().catch(()=>{});
          await withTimeout(user.delete(), 12000);
          toast('Account deleted'); switchView('customer');
        } catch (err) {
          toast(err.message || 'Failed to delete account', 'error', 4000);
        }
      }

      if (action === 'goto-settings') {
        const href = btn.getAttribute('href') || '';
        if (!href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        history.replaceState(null,'',href);
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        $$('#settingsNav a').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
      }
    });

    function doSearch(q = '') {
      q = (q||'').trim();
      if (!q) return;
      hide($('#customerView'));
      show($('#algoliaResults'));
      $('#algoliaResultsList').innerHTML = `
        <div class="card">Searching for: <b>${q}</b> (placeholder results)</div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---- Role cards ----
    $$('#signupModal .user-type-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('#signupModal .user-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input[type="radio"]').checked = true;
      });
    });

    // ---- Google buttons ----
    function renderGoogleBtn(containerId, label) {
      const c = document.getElementById(containerId);
      if (!c) return;
      c.innerHTML = `<button class="btn-base btn-google w-full" data-google="${containerId}">
        <i class="fab fa-google mr-2" aria-hidden="true"></i>${label || 'Continue with Google'}
      </button>`;
    }
    renderGoogleBtn('googleSignInBtnLogin', 'Continue with Google');
    renderGoogleBtn('googleSignInBtnSignup', 'Sign up with Google');

    document.addEventListener('click', async (e) => {
      const g = e.target.closest('[data-google]');
      if (!g) return;
      const provider = new firebase.auth.GoogleAuthProvider();
      const prev = g.innerHTML;
      g.disabled = true; g.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Connecting…`;
      try {
        const cred = await withTimeout(auth.signInWithPopup(provider), 20000, 'Google sign-in timed out');

        // Don’t block UI on Firestore. Do it in background.
        ensureUserDoc(cred.user, { role: 'customer' });
        setRoleUI('customer');

        closeModal('signupModal');
        closeModal('loginModal');
        toast('Account created.');
      } catch (err) {
        const msg = (err && (err.message || err.code)) || 'Google sign-in failed';
        if (String(msg).toLowerCase().includes('origin') || String(msg).includes('unauthorized')) {
          toast('Google sign-in not allowed for this domain. Add your site to Firebase Auth authorized domains & OAuth client.', 'error', 6000);
        } else {
          toast(msg, 'error', 4500);
        }
      } finally {
        g.disabled = false; g.innerHTML = prev;
      }
    });

    // ---- Email login ----
    $('#loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!navigator.onLine) return toast('You are offline', 'error');
      const email = $('#login-email').value.trim();
      const pass = $('#login-password').value;
      if (!email || !pass) return toast('Email and password required', 'error');
      const btn = $('#loginSubmitBtn');
      setLoading(btn, true, 'Signing in…', 'Sign In Securely');
      try {
        await auth.setPersistence($('#remember-me').checked
          ? firebase.auth.Auth.Persistence.LOCAL
          : firebase.auth.Auth.Persistence.SESSION);
        await withTimeout(auth.signInWithEmailAndPassword(email, pass), 20000, 'Sign-in timed out');

        $('#login-message').textContent = '';
        closeModal('loginModal');
        toast('Welcome back!');
      } catch (err) {
        $('#login-message').textContent = err.message || 'Sign-in failed';
        toast(err.message || 'Sign-in failed', 'error', 3500);
      } finally {
        setLoading(btn, false, '', 'Sign In Securely');
      }
    });

    // ---- Email signup (non-blocking Firestore) ----
    $('#signupForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!navigator.onLine) return toast('You are offline', 'error');

      const form = e.currentTarget;
      if (form.reportValidity && !form.reportValidity()) return;

      const name = $('#fullName').value.trim();
      const email = $('#emailAddress').value.trim();
      const pass = $('#password').value;
      const role = document.querySelector('input[name="accountRole"]:checked')?.value || 'customer';
      const language = $('#signupLanguage').value;
      const btn = $('#signupSubmitBtn');

      setLoading(btn, true, 'Creating account…', 'Create Account');

      try {
        const { user } = await withTimeout(
          auth.createUserWithEmailAndPassword(email, pass),
          20000, 'Sign-up timed out'
        );

        if (name) {
          try { await withTimeout(user.updateProfile({ displayName: name }), 8000); } catch (_) {}
        }

        // Fire-and-forget; don’t block the button
        ensureUserDoc(user, { role, language });

        setRoleUI(role);
        closeModal('signupModal');
        toast('Account created.');

        const msg = $('#signup-message');
        if (msg) msg.textContent = '';
        form.reset();
      } catch (err) {
        $('#signup-message').textContent = err.message || 'Sign-up failed';
        toast(err.message || 'Sign-up failed', 'error', 4000);
      } finally {
        setLoading(btn, false, '', 'Create Account');
      }
    });

    // Fire-and-forget user doc write so UI never waits on Firestore connectivity
    function ensureUserDoc(user, extras = {}) {
      try {
        if (!db || !user?.uid) return;
        const ref = db.collection('users').doc(user.uid);
        const base = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || '',
          provider: (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'password',
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const data = pruneUndefined({ ...base, ...extras });
        ref.set(data, { merge: true }).catch((err) => {
          console.warn('ensureUserDoc (non-blocking) error:', err);
        });
      } catch (err) {
        console.warn('ensureUserDoc wrapper error:', err);
      }
    }

    function setRoleUI(role) {
      const isPro = role === 'professional';
      const proBtn = $('#professionalBtn');
      const proMob = $('#mobileProfessional');
      if (isPro) { proBtn?.classList.remove('hidden'); proMob?.classList.remove('hidden'); }
      else { proBtn?.classList.add('hidden'); proMob?.classList.add('hidden'); }
      const user = auth.currentUser;
      if (isPro && user) loadMyPortfolio(user.uid);
    }

    // ---- Auth state ----
    auth.onAuthStateChanged(async (user) => {
      const avatar = $('#userAvatar');
      const avatarLg = $('#userAvatarLarge');
      const nameLg = $('#userNameLarge');
      const statusLg = $('#userStatusLarge');

      if (!user) {
        $('#setEmail') && ($('#setEmail').value = '');
        hide($('#loggedUserMenu')); show($('#guestUserMenu'));
        if (nameLg) nameLg.textContent = 'Guest User';
        if (statusLg) statusLg.textContent = 'Not signed in';
        if (avatar) avatar.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
        if (avatarLg) avatarLg.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
        return;
      }

      show($('#loggedUserMenu')); hide($('#guestUserMenu'));
      const letter = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
      if (avatar) avatar.textContent = letter;
      if (avatarLg) avatarLg.textContent = letter;
      if (nameLg) nameLg.textContent = user.displayName || user.email;
      if (statusLg) statusLg.textContent = user.email;

      $('#setEmail') && ($('#setEmail').value = user.email || '');
      $('#setDisplayName') && ($('#setDisplayName').value = user.displayName || '');
      if (user.photoURL) $('#setPhotoPreview').src = user.photoURL;

      // Try to fetch profile quickly; if Firestore is blocked, fall back to defaults
      let role = 'customer';
      try {
        const doc = await withTimeout(db.collection('users').doc(user.uid).get(), 5000, 'User doc fetch timed out');
        const d = doc?.data() || {};
        role = d.role || role;

        if ($('#setLang')) $('#setLang').value = d.language || 'en';
        if ($('#setCity')) $('#setCity').value = d.city || '';
        if ($('#setCountry')) $('#setCountry').value = d.country || '';
        if ($('#setTwoFA')) $('#setTwoFA').checked = !!d.twoFA;
        if ($('#setNotifyEmail')) $('#setNotifyEmail').checked = !!d.notifyEmail;
        if ($('#setNotifySMS')) $('#setNotifySMS').checked = !!d.notifySMS;
        if ($('#setNotifyPush')) $('#setNotifyPush').checked = !!d.notifyPush;
        if ($('#setPublic')) $('#setPublic').checked = !!d.isPublic;
        if ($('#setSearchIndex')) $('#setSearchIndex').checked = !!d.searchIndex;
        if ($('#setBillingNote')) $('#setBillingNote').value = d.billingNote || '';
      } catch (err) {
        console.warn('Fetch user doc failed (continuing with defaults):', err?.code || err?.message || err);
      } finally {
        setRoleUI(role);
      }
    });

    // ---- Work Uploads ----
    const dz = $('#workDropZone');
    const imgInput = $('#workImagesInput');
    const fileInput = $('#workFilesInput');
    const previewWrap = $('#workAttachmentList');
    const progressWrap = $('#workProgress');
    const progressBar = $('#workProgressBar');
    const progressText = $('#workProgressText');

    let selectedImages = [];
    let selectedFiles = [];

    function renderPreviews() {
      if (!previewWrap) return;
      const imgs = selectedImages.map((f) => `
        <div class="card p-2 text-center">
          <img class="w-full h-28 object-cover rounded-md" alt="" src="${URL.createObjectURL(f)}" loading="lazy"/>
          <div class="mt-2 text-xs truncate">${f.name}</div>
        </div>`);
      const files = selectedFiles.map((f) => `
        <div class="card p-2 text-center">
          <i class="fas fa-file text-2xl text-gray-500" aria-hidden="true"></i>
          <div class="mt-2 text-xs truncate">${f.name}</div>
        </div>`);
      previewWrap.innerHTML = imgs.concat(files).join('');
    }

    function acceptImagesOnly(fileList) {
      return Array.from(fileList || []).filter(f => f.type.startsWith('image/')).slice(0,5);
    }

    dz?.addEventListener('click', () => imgInput.click());
    dz?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') imgInput.click(); });
    dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz?.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz?.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('dragover');
      const files = acceptImagesOnly(e.dataTransfer.files);
      selectedImages = files; renderPreviews();
    });
    imgInput?.addEventListener('change', (e) => {
      selectedImages = Array.from(e.target.files || []).slice(0,5);
      renderPreviews();
    });
    fileInput?.addEventListener('change', (e) => {
      selectedFiles = Array.from(e.target.files || []).slice(0,5);
      renderPreviews();
    });

    function updateProgress(pct, text) {
      if (!progressWrap) return;
      show(progressWrap);
      progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      progressText.textContent = text || `${Math.round(pct)}%`;
    }
    function hideProgress() {
      if (!progressWrap) return;
      progressBar.style.width = '0%';
      progressText.textContent = 'Preparing…';
      hide(progressWrap);
    }

    // Per-file upload with progress + hard timeout
    function uploadWithProgress(ref, file, onUpdate) {
      const singleUpload = new Promise((resolve, reject) => {
        const task = ref.put(file);
        let last = 0;

        task.on('state_changed',
          (snap) => {
            if (onUpdate) {
              const inc = snap.bytesTransferred - last;
              last = snap.bytesTransferred;
              onUpdate(inc, snap.totalBytes);
            }
          },
          (err) => reject(err),
          async () => {
            try {
              const url = await task.snapshot.ref.getDownloadURL();
              resolve(url);
            } catch (e) { reject(e); }
          }
        );
      });

      // generous timeout based on size (min 25s)
      return withTimeout(singleUpload, Math.max(25000, Math.floor(file.size / 1500)), 'Single file upload timed out');
    }

    $('#workForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!navigator.onLine) return toast('You are offline', 'error');

      const user = auth.currentUser;
      if (!user) { closeModal('workUploadModal'); openModal('loginModal'); return; }

      const title = $('#workTitle').value.trim();
      const desc = $('#workDesc').value.trim();
      if (!title || !desc) return toast('Please enter a title and description.', 'error');
      if (selectedImages.length === 0 && selectedFiles.length === 0) {
        return toast('Add at least one image or file.', 'error');
      }

      // --- NEW: bail early if Firestore is unreachable to avoid "Failed to start upload" loop
      if (!(await canReachFirestore())) {
        return toast('Can’t reach the database right now. Please try again shortly or switch networks / disable VPN.', 'error', 6000);
      }

      const btn = $('#workSubmitBtn');
      setLoading(btn, true, 'Uploading…');

      try {
        const docRef = await withTimeout(db.collection('work').add({
          uid: user.uid, title, desc, images: [], files: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }), 12000, 'Failed to start upload');

        const allFiles = [...selectedImages, ...selectedFiles];
        const totalBytes = allFiles.reduce((s,f)=>s+(f.size||0),0) || 1;
        let sent = 0;
        updateProgress(2, 'Starting…');

        const imageURLs = [];
        const fileLinks = [];
        const uploads = [];

        selectedImages.forEach((f, i) => {
          const path = `work/${user.uid}/${docRef.id}/image_${i}_${Date.now()}.${(f.name.split('.').pop() || 'jpg')}`;
          const ref = storage.ref(path);
          uploads.push(
            uploadWithProgress(ref, f, (inc) => {
              sent += inc;
              updateProgress((sent/totalBytes)*100, `Uploading images… ${Math.round((sent/totalBytes)*100)}%`);
            }).then(url => imageURLs.push(url))
          );
        });

        selectedFiles.forEach((f, i) => {
          const path = `work/${user.uid}/${docRef.id}/file_${i}_${Date.now()}_${f.name}`;
          const ref = storage.ref(path);
          uploads.push(
            uploadWithProgress(ref, f, (inc) => {
              sent += inc;
              updateProgress((sent/totalBytes)*100, `Uploading files… ${Math.round((sent/totalBytes)*100)}%`);
            }).then(url => fileLinks.push({ name: f.name, url }))
          );
        });

        // Overall batch timeout (size-based, but with a sensible floor)
        await withTimeout(Promise.all(uploads), Math.max(30000, Math.floor(totalBytes / 1200)), 'Upload timed out');
        updateProgress(100, 'Finalizing…');

        // Finalize (timeboxed)
        await withTimeout(docRef.update({ images: imageURLs, files: fileLinks }), 10000, 'Finalize timed out');

        $('#workForm').reset();
        selectedImages = []; selectedFiles = []; renderPreviews();
        hideProgress();

        addWorkCardToGrid({ id: docRef.id, title, desc, images: imageURLs, files: fileLinks });

        closeModal('workUploadModal');
        toast('Added to your portfolio!');
      } catch (err) {
        console.error('Work upload failed:', err, err?.code, err?.message);
        hideProgress(); // ensure the progress bar is cleared
        const msg = (err?.code === 'unavailable' || /Failed to start upload/i.test(err?.message || ''))
          ? 'Can’t reach the database right now. Try again in a minute or switch networks / disable VPN.'
          : mapFirebaseError(err);
        toast(msg, 'error', 6000);
      } finally {
        setLoading(btn, false);
      }
    });

    function workCardHTML(item) {
      const cover = item.images?.[0] || '';
      const imgEl = cover ? `<img class="w-full h-40 object-cover rounded-xl" src="${cover}" alt="" loading="lazy">` :
                            `<div class="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><i class="fas fa-image" aria-hidden="true"></i></div>`;
      return `
        <div class="card">
          ${imgEl}
          <div class="mt-3">
            <div class="font-bold">${item.title}</div>
            <div class="text-sm text-gray-600 mt-1">${item.desc}</div>
          </div>
        </div>`;
    }

    function addWorkCardToGrid(item) {
      const grid = $('#workPortfolio');
      if (!grid) return;
      const div = document.createElement('div');
      div.innerHTML = workCardHTML(item);
      grid.prepend(div.firstElementChild);
    }

    async function loadMyPortfolio(uid) {
      const grid = $('#workPortfolio'); if (!grid) return;
      try {
        const snap = await withTimeout(
          db.collection('work').where('uid','==',uid).orderBy('createdAt','desc').limit(24).get(),
          6000, 'Portfolio fetch timed out'
        );
        grid.innerHTML = (snap.docs || []).map(d => workCardHTML({ id:d.id, ...d.data() })).join('');
      } catch (err) {
        console.warn('Portfolio fetch failed:', err?.code || err?.message || err);
        grid.innerHTML = '';
      }
    }

    // ---- Settings save ----
    $('#settingsForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) { openModal('loginModal'); return; }

      const btn = $('#settingsSaveBtn');
      setLoading(btn, true, 'Saving…', '<i class="fas fa-save mr-2"></i>Save All Settings');

      const displayName = $('#setDisplayName').value.trim();
      const language = $('#setLang').value;
      const city = $('#setCity').value.trim();
      const country = $('#setCountry').value.trim();
      const twoFA = $('#setTwoFA').checked;
      const notifyEmail = $('#setNotifyEmail').checked;
      const notifySMS = $('#setNotifySMS').checked;
      const notifyPush = $('#setNotifyPush').checked;
      const isPublic = $('#setPublic').checked;
      const searchIndex = $('#setSearchIndex').checked;
      const billingNote = $('#setBillingNote').value.trim();

      const photoFile = $('#setPhoto').files?.[0];
      let photoURL = auth.currentUser.photoURL || '';

      try {
        if (photoFile) {
          const snap = await withTimeout(
            storage.ref(`users/${user.uid}/avatar_${Date.now()}.${(photoFile.name.split('.').pop()||'jpg')}`).put(photoFile),
            20000, 'Avatar upload timed out'
          );
          photoURL = await snap.ref.getDownloadURL();
          $('#setPhotoPreview').src = photoURL;
          await user.updateProfile({ photoURL }).catch(()=>{});
        }
        if (displayName && displayName !== user.displayName) {
          await user.updateProfile({ displayName }).catch(()=>{});
        }

        await withTimeout(db.collection('users').doc(user.uid).set(pruneUndefined({
          displayName, language, city, country,
          twoFA, notifyEmail, notifySMS, notifyPush,
          isPublic, searchIndex, billingNote,
          photoURL
        }), { merge:true }), 12000, 'Save timed out');

        toast('Settings saved');
      } catch (err) {
        toast(err.message || 'Failed to save settings', 'error');
      } finally {
        setLoading(btn, false, '', '<i class="fas fa-save mr-2"></i>Save All Settings');
      }
    });

    $('#setPhoto')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) $('#setPhotoPreview').src = URL.createObjectURL(f);
    });

    // ---- Profile modal ----
    function showMyProfile() {
      const user = auth.currentUser;
      const header = $('#profileModalHeader');
      const meta = $('#profileMeta');
      const grid = $('#profileWorkGrid');

      if (!user) { openModal('loginModal'); return; }

      header.innerHTML = `
        <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-2xl font-bold animate-bounce-gentle" aria-hidden="true">
          ${(user.displayName||user.email||'U').charAt(0).toUpperCase()}
        </div>
        <h2 class="text-2xl md:text-3xl font-bold mt-2">${user.displayName||user.email}</h2>`;
      meta.textContent = 'Your public portfolio';

      openModal('profileModal');
      withTimeout(
        db.collection('work').where('uid','==',user.uid).orderBy('createdAt','desc').limit(24).get(),
        6000, 'Profile work timed out'
      )
      .then(snap => {
        grid.innerHTML = snap.docs.map(d => workCardHTML({ id:d.id, ...d.data() })).join('');
      })
      .catch(() => { grid.innerHTML = ''; });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="open-profile"]');
      if (!btn) return;
      const i = +btn.dataset.index || 0;
      const p = pros[i];
      const header = $('#profileModalHeader');
      const meta = $('#profileMeta');
      const grid = $('#profileWorkGrid');
      header.innerHTML = `
        <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white flex items-center justify-center text-2xl font-bold animate-bounce-gentle" aria-hidden="true">
          ${p.name.charAt(0)}
        </div>
        <h2 class="text-2xl md:text-3xl font-bold mt-2">${p.name}</h2>`;
      meta.textContent = `${p.title} • ${p.rating}★ • ${p.jobs} jobs`;
      grid.innerHTML = '';
      openModal('profileModal');
    });

    const settingsSections = ['sec-personal','sec-security','sec-notifications','sec-privacy','sec-billing','sec-payments','sec-connections','sec-danger'];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            $$('#settingsNav a').forEach(x => x.classList.toggle('active', x.getAttribute('href') === `#${id}`));
          }
        });
      }, { root: null, rootMargin: '0px 0px -70% 0px', threshold: 0.1 });
      settingsSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }

    console.log('QuickFix Pro ready (resilient Firestore).');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
