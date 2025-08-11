/* QuickFix Pro – App Logic (separate file)
 * IMPORTANT: Replace firebaseConfig with your real project keys from Firebase Console.
 * Firestore structure used:
 *   - users/{uid}            (profile & settings)
 *   - work/{workId}          (portfolio items; each has uid, title, desc, images[], files[], createdAt)
 */

(function () {
  // ---- Firebase init ----
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    // measurementId: "G-XXXXXXX" // optional
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  try { firebase.analytics(); } catch (_) {}

  // ---- Helpers ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const show = (el) => el && el.classList.remove('hidden');
  const hide = (el) => el && el.classList.add('hidden');

  const views = {
    customer: $('#customerView'),
    professional: $('#professionalView'),
    admin: $('#adminView'),
    settings: $('#settingsView'),
  };

  function switchView(name) {
    Object.values(views).forEach(hide);
    show(views[name]);
    // mobile nav active state
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

  // ---- Populate homepage data (unchanged layout) ----
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

  // ---- Global click actions (all your buttons) ----
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

    if (action === 'start-reset') { closeModal('loginModal'); auth.currentUser ? null : openModal('loginModal'); } // noop placeholder
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

  // ---- Auth UI (email+password + Google) ----
  // Select role tiles
  $$('#signupModal .user-type-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#signupModal .user-type-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      card.querySelector('input[type="radio"]').checked = true;
    });
  });

  // Google button render (simple)
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
      // Ensure user doc exists
      await ensureUserDoc(cred.user, { role: 'customer' });
      closeModal('loginModal'); closeModal('signupModal');
    } catch (err) { alert(err.message); }
  });

  // Email login
  $('#loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const pass = $('#login-password').value;
    try {
      await auth.setPersistence($('#remember-me').checked
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION);
      await auth.signInWithEmailAndPassword(email, pass);
      $('#login-message').textContent = '';
      closeModal('loginModal');
    } catch (err) {
      $('#login-message').textContent = err.message;
    }
  });

  // Email signup
  $('#signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#fullName').value.trim();
    const email = $('#emailAddress').value.trim();
    const pass = $('#password').value;
    const role = document.querySelector('input[name="accountRole"]:checked')?.value || 'customer';
    const language = $('#signupLanguage').value;
    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, pass);
      await user.updateProfile({ displayName: name });
      await ensureUserDoc(user, { role, language });
      closeModal('signupModal');
      openModal('userMenuModal');
    } catch (err) { $('#signup-message').textContent = err.message; }
  });

  async function ensureUserDoc(user, extras={}) {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...extras
      });
    }
  }

  // Auth state -> update menu/avatar + show Pro nav if role=professional
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
      avatarLg.innerHTML = '<i class="fas fa-user"></i>';
      return;
    }

    // user exists
    show($('#loggedUserMenu')); hide($('#guestUserMenu'));
    const letter = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    avatar.textContent = letter;
    avatarLg.textContent = letter;
    if (nameLg) nameLg.textContent = user.displayName || user.email;
    if (statusLg) statusLg.textContent = user.email;

    // fill settings header fields
    $('#setEmail') && ($('#setEmail').value = user.email || '');
    $('#setDisplayName') && ($('#setDisplayName').value = user.displayName || '');

    // show professional nav if their role is professional
    const userDoc = await db.collection('users').doc(user.uid).get().catch(()=>null);
    const role = userDoc?.data()?.role || 'customer';
    if (role === 'professional') {
      $('#professionalBtn')?.classList.remove('hidden');
      $('#mobileProfessional')?.classList.remove('hidden');
      // Load their portfolio list
      loadMyPortfolio(user.uid);
    } else {
      $('#professionalBtn')?.classList.add('hidden');
      $('#mobileProfessional')?.classList.add('hidden');
    }
  });

  // ---- Work Upload (Add to Portfolio) ----
  const dz = $('#workDropZone');
  const imgInput = $('#workImagesInput');
  const fileInput = $('#workFilesInput');
  const previewWrap = $('#workAttachmentList');

  let selectedImages = []; // File[]
  let selectedFiles = [];  // File[]

  function renderPreviews() {
    if (!previewWrap) return;
    const URLs = [];
    const imgs = selectedImages.map((f, i) => `
      <div class="card p-2 text-center">
        <img class="w-full h-28 object-cover rounded-md" alt="" src="${URL.createObjectURL(f)}"/>
        <div class="mt-2 text-xs truncate">${f.name}</div>
      </div>`);
    const files = selectedFiles.map((f, i) => `
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

  // SUBMIT = the reliable way to catch the "Add to Portfolio" button
  $('#workForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { closeModal('workUploadModal'); openModal('loginModal'); return; }

    const title = $('#workTitle').value.trim();
    const desc = $('#workDesc').value.trim();
    if (!title || !desc) return alert('Please enter a title and description.');

    const submitBtn = $('#workSubmitBtn');
    const orig = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';

    try {
      // Create doc first to get an ID
      const docRef = await db.collection('work').add({
        uid: user.uid,
        title,
        desc,
        images: [],
        files: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Upload images
      const imageURLs = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const f = selectedImages[i];
        const path = `work/${user.uid}/${docRef.id}/image_${i}_${Date.now()}.${(f.name.split('.').pop() || 'jpg')}`;
        const snap = await storage.ref(path).put(f);
        const url = await snap.ref.getDownloadURL();
        imageURLs.push(url);
      }

      // Upload other files
      const fileLinks = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i];
        const path = `work/${user.uid}/${docRef.id}/file_${i}_${Date.now()}_${f.name}`;
        const snap = await storage.ref(path).put(f);
        const url = await snap.ref.getDownloadURL();
        fileLinks.push({ name: f.name, url });
      }

      await docRef.update({ images: imageURLs, files: fileLinks });

      // Reset form and previews
      $('#workForm').reset();
      selectedImages = []; selectedFiles = []; renderPreviews();

      // Add to UI immediately
      addWorkCardToGrid({ id: docRef.id, title, desc, images: imageURLs, files: fileLinks });

      closeModal('workUploadModal');
    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = orig;
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
      .get();
    grid.innerHTML = snap.docs.map(d => workCardHTML({ id:d.id, ...d.data() })).join('');
  }

  // ---- Settings save ----
  $('#settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { openModal('loginModal'); return; }

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

    // upload photo if chosen
    const photoFile = $('#setPhoto').files?.[0];
    let photoURL = user.photoURL || '';
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
      await db.collection('users').doc(user.uid).set({
        displayName, language, city, country,
        twoFA, notifyEmail, notifySMS, notifyPush,
        isPublic, searchIndex, billingNote,
        photoURL
      }, { merge:true });

      alert('Settings saved');
      switchView('customer');
    } catch (err) {
      alert(err.message);
    }
  });

  // Show selected photo preview
  $('#setPhoto')?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) $('#setPhotoPreview').src = URL.createObjectURL(f);
  });

  // ---- Withdraw buttons (placeholder) ----
  $('#withdrawForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Withdraw submitted (demo). Connect your PSP for real payouts.');
    closeModal('withdrawModal');
  });
  $('#adminWithdrawForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Admin withdraw submitted (demo).');
    closeModal('adminWithdrawModal');
  });

  // ---- Profile modal (from featured pros or own profile) ----
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
    // load items
    db.collection('work').where('uid','==',user.uid).orderBy('createdAt','desc').limit(24).get()
      .then(snap => {
        grid.innerHTML = snap.docs.map(d => workCardHTML({ id:d.id, ...d.data() })).join('');
      });
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
    grid.innerHTML = ''; // example only
    openModal('profileModal');
  });

  // Settings left menu active highlight on click
  $('#settingsNav')?.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return;
    $$('#settingsNav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });

  // Current location -> city (signup)
  document.querySelector('[data-action="use-current-location"]')?.addEventListener('click', () => {
    try {
      navigator.geolocation.getCurrentPosition(() => { $('#signupCity').value = 'Nearby'; }, () => {});
    } catch (_) {}
  });

  // Done
  console.log('QuickFix Pro ready.');
})();

/*
Firestore Rules (apply in Firebase Console > Firestore > Rules)

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read: if true; }
    match /users/{uid} {
      allow create: if request.auth != null && request.auth.uid == uid;
      allow read: if true;
      allow update, delete: if request.auth != null && request.auth.uid == uid;
    }
    match /work/{workId} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
      allow read: if true;
    }
  }
}
*/
