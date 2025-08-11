/* QuickFix Pro – App Logic
 * Firestore structure:
 *   - users/{uid}
 *   - work/{workId}  ({ uid,title,desc,images[],files[],createdAt })
 */

(function () {
  // ---- Firebase init ----
  // IMPORTANT: storageBucket must be *.appspot.com or uploads will hang
  const firebaseConfig = {
    apiKey: "AIzaSyBYlkzJFlUWEACtLZ_scg_XWSt5fkv0cGM",
    authDomain: "quickfix-cee4a.firebaseapp.com",
    projectId: "quickfix-cee4a",
    storageBucket: "quickfix-cee4a.appspot.com",
    messagingSenderId: "1075514949479",
    appId: "1:1075514949479:web:83906b6cd54eeaa48cb9c2",
    measurementId: "G-XS4LDTFRSH"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  try { firebase.analytics(); } catch (_) {}

  // Firestore network-friendly config
  try {
    if (db?.settings) {
      db.settings({
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
        useFetchStreams: false
      });
    }
    if (db?.enablePersistence) {
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    }
  } catch (_) {}

  // ---- Helpers ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const show = (el) => el && el.classList.remove('hidden');
  const hide = (el) => el && el.classList.add('hidden');
  const pruneUndefined = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined));

  function setLoading(btn, isLoading, loadingLabel, defaultHTML) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.prevHtml = defaultHTML ?? btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingLabel || 'Working...'}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = defaultHTML ?? btn.dataset.prevHtml ?? 'Done';
    }
  }

  const toastEl = $('#toast');
  function toast(msg, type = 'success', ms = 2200) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = '';
    toastEl.id = 'toast';
    toastEl.classList.add('show', type);
    show(toastEl);
    setTimeout(() => { toastEl.classList.remove('show'); hide(toastEl); }, ms);
  }

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
    requestAnimationFrame(() => el.classList.add('show'));
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 180);
  }

  // click outside to close
  document.addEventListener('click', (e) => {
    const overlay = e.target.closest('.modal-overlay');
    const content = e.target.closest('.modal-content');
    if (overlay && !content && overlay.classList.contains('show')) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.classList.add('hidden'), 180);
    }
  });

  // ---- Location (nice-to-have) ----
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

  // ---- Populate homepage data ----
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
        <div class="service-icon ${p.color} mx-auto mb-2"><i class="fas ${p.icon}"></i></div>
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
          <div class="avatar-container w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold">
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

  // ---- Global click actions ----
  document.addEventListener('click', (e) => {
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
    if (action === 'logout') auth.signOut();

    if (action === 'search-from-input') doSearch($('#searchInput')?.value);
    if (action === 'search-from-mobile') doSearch($('#mobileSearchInput')?.value);
    if (action === 'navigate-service') doSearch(btn.dataset.service);

    if (action === 'start-reset') {
      const email = $('#login-email')?.value?.trim();
      if (email) auth.sendPasswordResetEmail(email).then(()=>toast('Password reset email sent')).catch(err=>toast(err.message,'error'));
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

  // ---- Auth UI ----
  // Select role tiles
  $$('#signupModal .user-type-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#signupModal .user-type-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      card.querySelector('input[type="radio"]').checked = true;
    });
  });

  // Google buttons
  function renderGoogleBtn(containerId, label) {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = `<button class="btn-base btn-google w-full" data-google="${containerId}">
      <i class="fab fa-google mr-2"></i>${label || 'Continue with Google'}
    </button>`;
  }
  renderGoogleBtn('googleSignInBtnLogin', 'Continue with Google');
  renderGoogleBtn('googleSignInBtnSignup', 'Sign up with Google');

  document.addEventListener('click', async (e) => {
    const g = e.target.closest('[data-google]');
    if (!g) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const cred = await auth.signInWithPopup(provider);
      await ensureUserDoc(cred.user, { role: 'customer' });
      setRoleUI('customer');
      closeModal('loginModal'); closeModal('signupModal');
      toast('Signed in with Google');
    } catch (err) { toast(err.message,'error'); }
  });

  // Email login
  $('#loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const pass = $('#login-password').value;
    const btn = $('#loginForm button[type="submit"]');
    setLoading(btn, true, 'Signing in…');
    try {
      await auth.setPersistence($('#remember-me').checked
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION);
      await auth.signInWithEmailAndPassword(email, pass);
      $('#login-message').textContent = '';
      closeModal('loginModal');
      toast('Welcome back!');
    } catch (err) {
      $('#login-message').textContent = err.message;
      toast(err.message, 'error', 3500);
    } finally {
      setLoading(btn, false);
    }
  });

  // Email signup (auto-close on success)
  $('#signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#fullName').value.trim();
    const email = $('#emailAddress').value.trim();
    const pass = $('#password').value;
    const role = document.querySelector('input[name="accountRole"]:checked')?.value || 'customer';
    const language = $('#signupLanguage').value;
    const btn = $('#signupSubmitBtn');

    setLoading(btn, true, 'Creating account…');

    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, pass);
      await user.updateProfile({ displayName: name });
      await ensureUserDoc(user, { role, language });

      setRoleUI(role);
      closeModal('signupModal');
      openModal('userMenuModal');
      toast('Account created successfully!');
    } catch (err) {
      $('#signup-message').textContent = err.message;
      toast(err.message, 'error', 4000);
    } finally {
      setLoading(btn, false, '', 'Create Account');
    }
  });

  // Create/update user doc
  async function ensureUserDoc(user, extras = {}) {
    try {
      if (!db || !user?.uid) return;
      const ref = db.collection('users').doc(user.uid);
      const base = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        provider: (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'password',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      };
      const data = pruneUndefined({ ...base, ...extras });
      await ref.set({ createdAt: firebase.firestore.FieldValue.serverTimestamp(), ...data }, { merge: true });
    } catch (err) {
      console.error('ensureUserDoc error:', err);
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

  // Auth state
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
      avatar.innerHTML = '<i class="fas fa-user"></i>';
      if (avatarLg) avatarLg.innerHTML = '<i class="fas fa-user"></i>';
      return;
    }

    show($('#loggedUserMenu')); hide($('#guestUserMenu'));
    const letter = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    avatar.textContent = letter;
    if (avatarLg) avatarLg.textContent = letter;
    if (nameLg) nameLg.textContent = user.displayName || user.email;
    if (statusLg) statusLg.textContent = user.email;

    $('#setEmail') && ($('#setEmail').value = user.email || '');
    $('#setDisplayName') && ($('#setDisplayName').value = user.displayName || '');
    if (user.photoURL) $('#setPhotoPreview').src = user.photoURL;

    try {
      const doc = await db.collection('users').doc(user.uid).get();
      const role = doc?.data()?.role || 'customer';
      // preload settings switches
      const d = doc?.data() || {};
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

      setRoleUI(role);
    } catch {
      setRoleUI('customer');
    }
  });

  // ---- Work Upload (with progress) ----
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
        <img class="w-full h-28 object-cover rounded-md" alt="" src="${URL.createObjectURL(f)}"/>
        <div class="mt-2 text-xs truncate">${f.name}</div>
      </div>`);
    const files = selectedFiles.map((f) => `
      <div class="card p-2 text-center">
        <i class="fas fa-file text-2xl text-gray-500"></i>
        <div class="mt-2 text-xs truncate">${f.name}</div>
      </div>`);
    previewWrap.innerHTML = imgs.concat(files).join('');
  }

  dz?.addEventListener('click', () => imgInput.click());
  dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
  dz?.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz?.addEventListener('drop', (e) => {
    e.preventDefault(); dz.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/')).slice(0,5);
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

  function uploadWithProgress(ref, file, onUpdate) {
    return new Promise((resolve, reject) => {
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
        async () => resolve(await task.snapshot.ref.getDownloadURL())
      );
    });
  }

  $('#workForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { closeModal('workUploadModal'); openModal('loginModal'); return; }

    const title = $('#workTitle').value.trim();
    const desc = $('#workDesc').value.trim();
    if (!title || !desc) return toast('Please enter a title and description.', 'error');

    const btn = $('#workSubmitBtn');
    setLoading(btn, true, 'Uploading…');

    try {
      const docRef = await db.collection('work').add({
        uid: user.uid, title, desc,
        images: [], files: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

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

      await Promise.all(uploads);
      updateProgress(100, 'Finalizing…');

      await docRef.update({ images: imageURLs, files: fileLinks });

      $('#workForm').reset();
      selectedImages = []; selectedFiles = []; renderPreviews();
      hideProgress();

      addWorkCardToGrid({ id: docRef.id, title, desc, images: imageURLs, files: fileLinks });

      closeModal('workUploadModal');
      toast('Added to your portfolio!');
    } catch (err) {
      toast(err.message, 'error', 4000);
    } finally {
      setLoading(btn, false);
    }
  });

  function workCardHTML(item) {
    const cover = item.images?.[0] || '';
    const imgEl = cover ? `<img class="w-full h-40 object-cover rounded-xl" src="${cover}" alt="">` :
                          `<div class="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><i class="fas fa-image"></i></div>`;
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
    const snap = await db.collection('work')
      .where('uid','==',uid)
      .orderBy('createdAt','desc')
      .limit(24)
      .get()
      .catch(() => ({ docs: [] }));
    grid.innerHTML = (snap.docs || []).map(d => workCardHTML({ id:d.id, ...d.data() })).join('');
  }

  // ---- Settings save (spinner + toast, stays on page) ----
  $('#settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { openModal('loginModal'); return; }

    const btn = $('#settingsSaveBtn');
    setLoading(btn, true, 'Saving…');

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
        const snap = await storage.ref(`users/${user.uid}/avatar_${Date.now()}.${(photoFile.name.split('.').pop()||'jpg')}`).put(photoFile);
        photoURL = await snap.ref.getDownloadURL();
        $('#setPhotoPreview').src = photoURL;
        await user.updateProfile({ photoURL });
      }
      if (displayName && displayName !== user.displayName) {
        await user.updateProfile({ displayName });
      }

      await db.collection('users').doc(user.uid).set(pruneUndefined({
        displayName, language, city, country,
        twoFA, notifyEmail, notifySMS, notifyPush,
        isPublic, searchIndex, billingNote,
        photoURL
      }), { merge:true });

      toast('Settings saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(btn, false, '', '<i class="fas fa-save mr-2"></i>Save All Settings');
    }
  });

  // Photo preview
  $('#setPhoto')?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) $('#setPhotoPreview').src = URL.createObjectURL(f);
  });

  // Extra Settings actions
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="send-reset-email"]');
    if (btn) {
      const user = auth.currentUser;
      if (!user?.email) return toast('Sign in first', 'error');
      auth.sendPasswordResetEmail(user.email)
        .then(()=>toast('Password reset email sent'))
        .catch(err=>toast(err.message,'error'));
    }
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="relogin"]');
    if (btn) {
      auth.signOut().then(()=>{ toast('Please sign in again'); openModal('loginModal'); });
    }
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="delete-account"]');
    if (btn) {
      const user = auth.currentUser;
      if (!user) return openModal('loginModal');
      if (!confirm('Delete your account and data? This action cannot be undone.')) return;
      db.collection('users').doc(user.uid).delete().catch(()=>{});
      user.delete()
        .then(()=>{ toast('Account deleted'); switchView('customer'); })
        .catch(err=>toast(err.message,'error'));
    }
  });

  // ---- Profile modal ----
  function showMyProfile() {
    const user = auth.currentUser;
    const header = $('#profileModalHeader');
    const meta = $('#profileMeta');
    const grid = $('#profileWorkGrid');

    if (!user) { openModal('loginModal'); return; }

    header.innerHTML = `
      <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center text-2xl font-bold animate-bounce-gentle">
        ${(user.displayName||user.email||'U').charAt(0).toUpperCase()}
      </div>
      <h2 class="text-2xl md:text-3xl font-bold mt-2">${user.displayName||user.email}</h2>`;
    meta.textContent = 'Your public portfolio';

    openModal('profileModal');
    db.collection('work').where('uid','==',user.uid).orderBy('createdAt','desc').limit(24).get()
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
      <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white flex items-center justify-center text-2xl font-bold animate-bounce-gentle">
        ${p.name.charAt(0)}
      </div>
      <h2 class="text-2xl md:text-3xl font-bold mt-2">${p.name}</h2>`;
    meta.textContent = `${p.title} • ${p.rating}★ • ${p.jobs} jobs`;
    grid.innerHTML = '';
    openModal('profileModal');
  });

  // ---- Settings left menu: clickable + smooth + auto-highlight ----
  const settingsSections = ['sec-personal','sec-security','sec-notifications','sec-privacy','sec-billing','sec-payments','sec-connections','sec-danger'];
  $('#settingsNav')?.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    history.replaceState(null,'',href); // keep URL hash in sync
    target.scrollIntoView({ behavior:'smooth', block:'start' });
    $$('#settingsNav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });

  if (IntersectionObserver) {
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

  // Current location -> city (signup)
  document.querySelector('[data-action="use-current-location"]')?.addEventListener('click', () => {
    try {
      navigator.geolocation.getCurrentPosition(() => { $('#signupCity').value = 'Nearby'; }, () => {});
    } catch (_) {}
  });

  console.log('QuickFix Pro ready.');
})();
