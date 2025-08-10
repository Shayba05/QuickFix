// =======================
// QuickFix Pro - App JS (Firebase Auth + Firestore + Roles)
// =======================

// Global UI state
let isLoggedIn = false;
let currentUser = null; // { name, email, avatar, role }
let currentLanguage = 'en';
let currentPage = 'customer';

// -----------------------
// Static data
// -----------------------
const serviceDatabase = {
  handyman: {
    emoji: '🔧',
    title: 'Handyman Services',
    searchTerms: ['IKEA assembly','TV mounting','furniture assembly','picture hanging','curtain installation'],
    keywords: ['handyman','ikea','assembly','furniture','tv mount','picture','curtain']
  },
  plumbing: {
    emoji: '🚰',
    title: 'Plumbing Services',
    searchTerms: ['leaky tap','blocked drain','toilet repair','pipe burst','water heater'],
    keywords: ['plumber','plumbing','leak','tap','drain','toilet','pipe','water']
  },
  electrical: {
    emoji: '⚡',
    title: 'Electrical Services',
    searchTerms: ['ceiling fan repair','light fixture','outlet installation','breaker repair'],
    keywords: ['electrician','electrical','ceiling fan','light','outlet','breaker']
  }
};

const serviceCategories = [
  { name: 'Plumbing', icon: 'fas fa-wrench', color: '#6B46C1', professionals: 1247 },
  { name: 'Electrical', icon: 'fas fa-bolt', color: '#F59E0B', professionals: 892 },
  { name: 'HVAC', icon: 'fas fa-fan', color: '#059669', professionals: 634 },
  { name: 'Handyman', icon: 'fas fa-hammer', color: '#EF4444', professionals: 1523 },
  { name: 'Appliances', icon: 'fas fa-tv', color: '#8B5CF6', professionals: 428 },
  { name: 'Cleaning', icon: 'fas fa-broom', color: '#06B6D4', professionals: 743 },
  { name: 'Construction', icon: 'fas fa-hard-hat', color: '#F97316', professionals: 567 },
  { name: 'Carpentry', icon: 'fas fa-screwdriver-wrench', color: '#A16207', professionals: 423 }
];

const popularServices = [
  { name: 'IKEA assembly', page: 'ikeaAssemblyPage' },
  { name: 'TV mounting', page: 'tvMountingPage' },
  { name: 'Leaky tap', page: 'leakyTapPage' },
  { name: 'AC repair', page: 'acRepairPage' },
  { name: 'Blocked drain', page: 'blockedDrainPage' },
  { name: 'Ceiling fan', page: 'ceilingFanPage' }
];

const professionals = [
  { id:1, name:'Michael Rodriguez', service:'Master Plumber', rating:4.95, reviews:234, price:'$85/hr', image:'https://i.pravatar.cc/150?img=1', verified:true, responseTime:'< 30 min', availability:'Available Now', experience:'12 years', completedJobs:847, services:['plumbing','leaky tap','blocked drain'] },
  { id:2, name:'Sarah Chen', service:'Licensed Electrician', rating:4.92, reviews:187, price:'$95/hr', image:'https://i.pravatar.cc/150?img=2', verified:true, responseTime:'< 45 min', availability:'Available Today', experience:'8 years', completedJobs:623, services:['electrical','ceiling fan'] },
  { id:3, name:'David Thompson', service:'HVAC Specialist', rating:4.88, reviews:156, price:'$105/hr', image:'https://i.pravatar.cc/150?img=3', verified:true, responseTime:'< 1 hour', availability:'Busy until 3 PM', experience:'15 years', completedJobs:934, services:['hvac','ac repair'] },
  { id:4, name:'James Wilson', service:'Handyman Expert', rating:4.91, reviews:298, price:'$75/hr', image:'https://i.pravatar.cc/150?img=4', verified:true, responseTime:'< 20 min', availability:'Available Now', experience:'10 years', completedJobs:1156, services:['handyman','ikea assembly','tv mounting'] },
  { id:5, name:'Lisa Martinez', service:'Cleaning Specialist', rating:4.96, reviews:312, price:'$65/hr', image:'https://i.pravatar.cc/150?img=5', verified:true, responseTime:'< 15 min', availability:'Available Now', experience:'7 years', completedJobs:892, services:['cleaning','deep cleaning','housekeeping'] },
  { id:6, name:'Robert Kim', service:'Construction Expert', rating:4.87, reviews:145, price:'$120/hr', image:'https://i.pravatar.cc/150?img=6', verified:true, responseTime:'< 2 hours', availability:'Available Tomorrow', experience:'18 years', completedJobs:567, services:['construction','renovation','carpentry'] }
];

// -----------------------
// Firebase (Compat SDK)
// -----------------------
const firebaseConfig = {
  apiKey: "AIzaSyBYlkzJFlUWEACtLZ_scg_XWSt5fkv0cGM",
  authDomain: "quickfix-cee4a.firebaseapp.com",
  projectId: "quickfix-cee4a",
  storageBucket: "quickfix-cee4a.appspot.com",
  messagingSenderId: "1075514949479",
  appId: "1:1075514949479:web:83906b6cd54eeaa48cb9c2",
  measurementId: "G-XS4LDTFRSH"
};

let auth, db;
try {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    if (firebase.analytics) firebase.analytics();
  }
  auth = firebase.auth();
  db = firebase.firestore();

  if (db && db.enablePersistence) {
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      console.warn('Firestore persistence not enabled:', err.code || err);
    });
  }
  console.log('✅ Firebase ready');
} catch (e) {
  console.error('❌ Firebase init error:', e);
}

// -----------------------
// Helpers
// -----------------------
function normalize(t){ return String(t).toLowerCase().replace(/[^a-z0-9]/g,''); }
function getInitials(name = '', email = '') {
  if (name && name.trim()) return name.trim().split(/\s+/).map(n=>n[0]).join('').slice(0,2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return 'QF';
}

/**
 * Create/update user profile. If it's a new profile, persist preferredRole (default "user").
 * Returns the resulting role string.
 */
async function upsertUserProfile(user, preferredRole = undefined) {
  if (!db || !user) return 'user';
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();

  const base = {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    provider: (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'password',
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };

  let role = preferredRole || 'user';

  if (snap.exists) {
    const existing = snap.data() || {};
    role = existing.role || role;
    await ref.set(base, { merge: true });
  } else {
    await ref.set({
      ...base,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      role
    }, { merge: true });
  }
  return role;
}

async function fetchUserRole(uid){
  try{
    const doc = await db.collection('users').doc(uid).get();
    return (doc.exists && doc.data().role) ? doc.data().role : 'user';
  }catch{
    return 'user';
  }
}

// -----------------------
// Language menu
// -----------------------
function toggleLanguageMenu(event){
  if (event){ event.preventDefault(); event.stopPropagation(); }
  const menu = document.getElementById('languageMenu');
  if (menu) menu.classList.toggle('show');
}

function setLanguage(code, name, flag, event){
  if (event){ event.preventDefault(); event.stopPropagation(); }
  currentLanguage = code;
  const currentLangEl = document.getElementById('currentLang');
  if (currentLangEl) currentLangEl.textContent = code.toUpperCase();
  document.querySelectorAll('.language-item').forEach(i => i.classList.remove('active'));
  const row = event?.target?.closest('.language-item');
  if (row) row.classList.add('active');
  toggleLanguageMenu();
  showAlert('Language Changed', `Language changed to ${name} ${flag}`);
}

// -----------------------
// Modals
// -----------------------
function openModal(modalId,event){
  if (event){ event.preventDefault(); event.stopPropagation(); }
  closeAllModals(()=> {
    const modal = document.getElementById(modalId);
    if (modal){
      modal.classList.remove('hidden');
      setTimeout(()=>{
        modal.classList.add('show');
        const focusable = modal.querySelector('input,button,textarea,select,[tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
        if (modalId === 'signupModal') {
          renderGoogleSignInButtonSignup();
          initRolePicker(); // NEW: highlight selected role card
        }
        if (modalId === 'loginModal') renderGoogleSignInButtonLogin();
      },10);
    }
  });
}

function closeModal(modalId,event){
  if (event){ event.preventDefault(); event.stopPropagation(); }
  const modal = document.getElementById(modalId);
  if (modal){
    modal.classList.remove('show');
    setTimeout(()=> modal.classList.add('hidden'), 300);
  }
}

function closeAllModals(cb){
  const ids = ['loginModal','signupModal','userMenuModal','searchModal','workUploadModal','withdrawModal','adminWithdrawModal'];
  let pending = 0, any = false;
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden')){
      any = true; pending++;
      el.classList.remove('show');
      setTimeout(()=>{ el.classList.add('hidden'); pending--; if (pending===0 && cb) cb(); },300);
    }
  });
  if (!any && cb) cb();
  const langMenu = document.getElementById('languageMenu');
  if (langMenu) langMenu.classList.remove('show');
}

// -----------------------
// Role picker (Signup)
// -----------------------
function initRolePicker(){
  const cards = document.querySelectorAll('#signupModal .user-type-card');
  const radios = document.querySelectorAll('#signupModal input[name="accountRole"]');

  const sync = () => {
    cards.forEach(card => {
      const input = card.querySelector('input[name="accountRole"]');
      if (input && input.checked){
        card.classList.remove('border-gray-200');
        card.classList.add('border-primary','ring-2','ring-primary/20');
      } else {
        card.classList.add('border-gray-200');
        card.classList.remove('border-primary','ring-2','ring-primary/20');
      }
    });
  };

  cards.forEach(card=>{
    card.addEventListener('click', ()=>{
      const input = card.querySelector('input[name="accountRole"]');
      if (input){ input.checked = true; sync(); }
    });
  });
  radios.forEach(r => r.addEventListener('change', sync));
  setTimeout(sync, 0);
}

// -----------------------
// Google Sign-in buttons
// -----------------------
function renderGoogleSignInButtonSignup(){
  const container = document.getElementById('googleSignInBtnSignup');
  if (!container) return;
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'btn-base btn-google w-full';
  btn.innerHTML = '<i class="fab fa-google mr-2"></i> Continue with Google';
  btn.onclick = async (e)=>{
    e.preventDefault();
    if (!auth || !firebase) return showAlert('Error','Firebase not initialized');
    try{
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      // respect chosen role on first signup
      const chosen = document.querySelector('input[name="accountRole"]:checked')?.value || 'user';
      await upsertUserProfile(result.user, chosen === 'professional' ? 'professional' : 'user');
      showAlert('Google Signup Successful', `Welcome, ${result.user.displayName || 'user'}!`);
      closeModal('signupModal');
      // onAuthStateChanged will fetch role and gate UI
    }catch(err){
      console.error('Google Signup error:', err);
      const msg = (err?.code === 'auth/unauthorized-domain')
        ? 'Unauthorized domain. Add your site origin to Firebase Auth → Settings → Authorized domains.'
        : err.message;
      showAlert('Signup Failed', msg);
    }
  };
  container.appendChild(btn);
}

function renderGoogleSignInButtonLogin(){
  const container = document.getElementById('googleSignInBtnLogin');
  if (!container) return;
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'btn-base btn-google w-full';
  btn.innerHTML = '<i class="fab fa-google mr-2"></i> Continue with Google';
  btn.onclick = async (e)=>{
    e.preventDefault();
    if (!auth || !firebase) return showAlert('Error','Firebase not initialized');
    try{
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      await upsertUserProfile(result.user); // no role change on login
      showAlert('Google Login Successful', `Welcome, ${result.user.displayName || 'user'}!`);
      closeModal('loginModal');
    }catch(err){
      console.error('Google Login error:', err);
      const msg = (err?.code === 'auth/unauthorized-domain')
        ? 'Unauthorized domain. Add your site origin to Firebase Auth → Settings → Authorized domains.'
        : err.message;
      showAlert('Login Failed', msg);
    }
  };
  container.appendChild(btn);
}

// -----------------------
// Navigation (+ gating)
// -----------------------
function switchView(view,event){
  if (event){ event.preventDefault(); event.stopPropagation(); }

  // Gatekeeping based on role
  const role = currentUser?.role || 'guest';
  if (view === 'professional' && !(role === 'professional' || role === 'admin')){
    showAlert('Access restricted', 'Create a Professional account to access the Pro dashboard.');
    return;
  }
  if (view === 'admin' && role !== 'admin'){
    showAlert('Access restricted', 'Admin area is restricted.');
    return;
  }

  currentPage = view;
  ['customerView','professionalView','adminView'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  ['ikeaAssemblyPage','tvMountingPage','leakyTapPage','acRepairPage','blockedDrainPage','ceilingFanPage'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(view + 'View');
  if (target) target.classList.remove('hidden');
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.classList.add('hidden');

  document.querySelectorAll('.nav-btn').forEach(b=>{ b.classList.remove('btn-primary'); b.classList.add('btn-outline'); });
  const activeBtn = document.getElementById(view + 'Btn');
  if (activeBtn){ activeBtn.classList.remove('btn-outline'); activeBtn.classList.add('btn-primary'); }

  document.querySelectorAll('.mobile-nav .nav-item').forEach(i=>i.classList.remove('active'));
  const mobileBtn = document.getElementById('mobile' + view.charAt(0).toUpperCase() + view.slice(1));
  if (mobileBtn) mobileBtn.classList.add('active');

  closeAllModals();
}

function navigateToService(serviceName,event){
  if (event){ event.preventDefault(); event.stopPropagation(); }
  const map = {
    'ikea assembly':'ikeaAssemblyPage',
    'tv mounting':'tvMountingPage',
    'leaky tap':'leakyTapPage',
    'ac repair':'acRepairPage',
    'blocked drain':'blockedDrainPage',
    'ceiling fan':'ceilingFanPage'
  };
  const pageId = map[String(serviceName).toLowerCase()];
  if (pageId){ showServicePage(pageId); closeAllModals(); }
  else showAlert('Search Results', `Found ${Math.floor(Math.random()*50)+10} professionals for "${serviceName}"`);
}

function showServicePage(pageId){
  ['customerView','professionalView','adminView'].forEach(id=> document.getElementById(id)?.classList.add('hidden'));
  ['ikeaAssemblyPage','tvMountingPage','leakyTapPage','acRepairPage','blockedDrainPage','ceilingFanPage'].forEach(id=> document.getElementById(id)?.classList.add('hidden'));
  document.getElementById(pageId)?.classList.remove('hidden');
  document.getElementById('backBtn')?.classList.remove('hidden');
  renderServiceProfessionals(pageId);
}

function goBackToHome(){ switchView('customer'); }

// -----------------------
// Auth (Email/Password)
// -----------------------
async function loginUser(event){
  event?.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('remember-me')?.checked;

  if (!auth) return showAlert('Error','Firebase not initialized');

  try{
    await auth.setPersistence(
      remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
    );
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await upsertUserProfile(cred.user);
    closeModal('loginModal');
    showAlert('Welcome Back!', 'Signed in successfully.');
  }catch(err){
    console.error('Login error:', err);
    document.getElementById('login-message').textContent = err.message || 'Login failed.';
  }
}

async function signupUser(event){
  event?.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('emailAddress').value.trim();
  const password = document.getElementById('password').value;
  const chosen = document.querySelector('input[name="accountRole"]:checked')?.value || 'user';

  if (!auth) return showAlert('Error','Firebase not initialized');

  try{
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: fullName });
    await upsertUserProfile({ ...cred.user, displayName: fullName }, chosen === 'professional' ? 'professional' : 'user');
    closeModal('signupModal');
    showAlert('Account Created!', 'Welcome to QuickFix Pro!');
  }catch(err){
    console.error('Signup error:', err);
    showAlert('Signup Failed', err.message || 'Could not create account.');
  }
}

async function startPasswordReset(event){
  event?.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if (!email) return showAlert('Reset Password', 'Enter your email above first.');
  try{
    await auth.sendPasswordResetEmail(email);
    showAlert('Reset Email Sent', 'Check your inbox for password reset instructions.');
  }catch(err){
    showAlert('Reset Failed', err.message || 'Could not send reset email.');
  }
}

async function logoutUser(event){
  event?.preventDefault();
  try{
    await auth.signOut();
    showAlert('Signed Out', 'You have been signed out.');
  }catch(err){
    showAlert('Error', err.message || 'Could not sign out.');
  }
}

// Watch auth state and update UI (and gate by role)
if (auth){
  auth.onAuthStateChanged(async (user)=>{
    if (user){
      try { await upsertUserProfile(user); } catch(e){ console.warn('Profile upsert issue:', e); }
      const role = await fetchUserRole(user.uid);
      isLoggedIn = true;
      currentUser = {
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'QuickFix User'),
        email: user.email || '',
        avatar: getInitials(user.displayName, user.email),
        role
      };
    } else {
      isLoggedIn = false;
      currentUser = null;
    }
    updateUserInterface();
    applyRoleGate();
  });
}

// -----------------------
// Search
// -----------------------
function executeSearchFromInput(event){
  event?.preventDefault();
  const el = document.getElementById('searchInput');
  const q = el?.value.trim();
  if (q) navigateToService(q);
}

function executeSearchFromMobileInput(event){
  event?.preventDefault();
  const el = document.getElementById('mobileSearchInput');
  const q = el?.value.trim();
  if (q) navigateToService(q);
}

function executeSearch(query,event){
  event?.preventDefault();
  if (!query?.trim()) return;
  const hit = popularServices.find(s=> s.name.toLowerCase() === query.toLowerCase());
  if (hit) navigateToService(hit.name);
  else showAlert('Search Results', `Found ${Math.floor(Math.random()*50)+10} professionals for "${query}"`);
}

// -----------------------
// Fake forms
// -----------------------
function addWork(event){ event?.preventDefault(); closeModal('workUploadModal'); showAlert('Work Added!', 'Your project has been added to your portfolio.'); }
function processWithdrawal(event){ event?.preventDefault(); closeModal('withdrawModal'); showAlert('Withdrawal Initiated', 'Processing within 1–2 business days.'); }
function processAdminWithdrawal(event){ event?.preventDefault(); closeModal('adminWithdrawModal'); showAlert('Platform Earnings Withdrawn', 'Transferred to your business account.'); }

// -----------------------
// Renderers
// -----------------------
function renderPopularServices(){
  const container = document.getElementById('popularServices');
  if (!container) return;
  const html = popularServices.map((s,idx)=>`
    <button onclick="navigateToService('${s.name}',event)"
      class="card card-interactive text-center min-h-[80px] md:min-h-[100px] flex flex-col items-center justify-center hover:border-primary animate-scale-in"
      style="animation-delay:${idx*0.1}s">
      <i class="fas fa-tools text-xl md:text-2xl text-primary mb-2 animate-float" style="animation-delay:${idx*0.2}s"></i>
      <span class="font-bold text-sm md:text-base text-gray-800">${s.name}</span>
    </button>
  `).join('');
  container.innerHTML = html;
}

function renderServiceCategories(){
  const container = document.getElementById('serviceCategories');
  if (!container) return;
  const html = serviceCategories.map((c,idx)=>`
    <div class="card card-interactive text-center hover:border-primary animate-scale-in"
         onclick="executeSearch('${c.name.toLowerCase()}',event)" style="animation-delay:${idx*0.1}s">
      <div class="service-icon mx-auto mb-3" style="background:${c.color}"><i class="${c.icon}"></i></div>
      <h3 class="font-bold text-sm md:text-base mb-1 text-gray-800">${c.name}</h3>
      <p class="text-xs md:text-sm text-gray-600">${c.professionals} professionals</p>
    </div>
  `).join('');
  container.innerHTML = html;
}

function renderProfessionals(){
  const container = document.getElementById('featuredProfessionals');
  if (!container) return;
  container.innerHTML = professionals.slice(0,3).map((pro,idx)=>renderProfessionalCard(pro,idx)).join('');
}

function renderProfessionalCard(pro, index = 0){
  return `
    <div class="professional-card card card-interactive hover:border-primary animate-slide-up" style="animation-delay:${index*0.15}s">
      <div class="flex items-start mb-4">
        <div class="avatar-container"><img src="${pro.image}" alt="${pro.name}" class="w-14 h-14 md:w-16 md:h-16 rounded-lg mr-3 border-2 border-gray-200 flex-shrink-0"/></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center mb-1">
            <h3 class="font-bold text-base md:text-lg mr-2 truncate text-gray-800">${pro.name}</h3>
            ${pro.verified ? '<i class="fas fa-check-circle text-secondary flex-shrink-0 animate-bounce-gentle" title="Verified Professional"></i>' : ''}
          </div>
          <p class="text-gray-600 mb-2 text-sm font-medium">${pro.service}</p>
          <div class="flex items-center mb-2">
            <div class="rating-stars mr-2">
              ${[...Array(5)].map((_,i)=>`<i class="star fas fa-star ${i<Math.floor(pro.rating)?'text-yellow-500':'text-gray-300'} text-xs"></i>`).join('')}
            </div>
            <span class="text-sm font-bold">${pro.rating}</span>
            <span class="text-gray-500 text-xs ml-1">(${pro.reviews})</span>
          </div>
          <div class="text-xs text-gray-600">
            <div class="mb-1"><i class="fas fa-clock mr-1 text-primary"></i>${pro.responseTime}</div>
            <div class="mb-1"><i class="fas fa-calendar mr-1 text-secondary"></i>${pro.availability}</div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between mb-4">
        <span class="text-xl md:text-2xl font-black text-primary">${pro.price}</span>
        <div class="text-right"><div class="text-xs text-gray-500">Starting from</div></div>
      </div>
      <div class="flex space-x-2">
        <button class="btn-base btn-outline flex-1 text-sm" onclick="event.stopPropagation()">View Profile</button>
        <button class="btn-base btn-primary flex-1 text-sm" onclick="event.stopPropagation()">Book Now</button>
      </div>
    </div>
  `;
}

function renderServiceProfessionals(pageId){
  const slug = normalize(pageId.replace('Page',''));
  const relevant = professionals.filter(p => p.services.some(s => normalize(s).includes(slug) || slug.includes(normalize(s))));
  const map = {
    'ikeaassemblypage':'ikeaAssemblyProfessionals',
    'tvmountingpage':'tvMountingProfessionals',
    'leakytappage':'leakyTapProfessionals',
    'acrepairpage':'acRepairProfessionals',
    'blockeddrainpage':'blockedDrainProfessionals',
    'ceilingfanpage':'ceilingFanProfessionals'
  };
  const containerId = map[normalize(pageId)];
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!relevant.length){
    container.innerHTML = '<p class="text-gray-600 text-center py-8">No professionals found for this service.</p>';
    return;
  }
  container.innerHTML = relevant.map(pro => `
    <div class="service-professional" onclick="event.stopPropagation()">
      <img src="${pro.image}" alt="${pro.name}" class="w-16 h-16 rounded-full mr-4 border-2 border-gray-200"/>
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <h3 class="font-bold text-lg mr-2">${pro.name}</h3>
          ${pro.verified ? '<i class="fas fa-check-circle text-secondary"></i>' : ''}
        </div>
        <p class="text-gray-600 mb-2">${pro.service}</p>
        <div class="flex items-center mb-2">
          <div class="rating-stars mr-2">
            ${[...Array(5)].map((_,i)=>`<i class="star fas fa-star ${i<Math.floor(pro.rating)?'text-yellow-500':'text-gray-300'}"></i>`).join('')}
          </div>
          <span class="font-bold">${pro.rating}</span>
          <span class="text-gray-500 ml-1">(${pro.reviews})</span>
        </div>
        <div class="flex items-center text-sm text-gray-600">
          <span class="mr-4"><i class="fas fa-clock mr-1"></i>${pro.responseTime}</span>
          <span><i class="fas fa-calendar mr-1"></i>${pro.availability}</span>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-black text-primary mb-2">${pro.price}</div>
        <button class="btn-base btn-primary" onclick="event.stopPropagation()">Book Now</button>
      </div>
    </div>
  `).join('');
}

function renderWorkPortfolio(){
  const container = document.getElementById('workPortfolio');
  if (!container) return;
  const items = [
    { title:'Modern Kitchen Renovation', category:'Plumbing', duration:'6 hours', cost:'$480', image:'https://picsum.photos/400/300?random=1', rating:'5.0' },
    { title:'Smart Bathroom Installation', category:'Plumbing', duration:'2 days', cost:'$1,250', image:'https://picsum.photos/400/300?random=2', rating:'4.9' },
    { title:'Complete Home Automation', category:'Electrical', duration:'8 hours', cost:'$950', image:'https://picsum.photos/400/300?random=3', rating:'5.0' }
  ];
  container.innerHTML = items.map((it,idx)=>`
    <div class="card card-interactive overflow-hidden hover:border-primary animate-scale-in" style="animation-delay:${idx*0.1}s" onclick="event.stopPropagation()">
      <img src="${it.image}" alt="${it.title}" class="w-full h-32 md:h-40 object-cover mb-3 rounded-lg"/>
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-bold text-sm md:text-base truncate mr-2 text-gray-800">${it.title}</h4>
        <span class="text-xs bg-gradient-to-r from-primary to-primary-light text-white px-2 py-1 rounded-full font-semibold">${it.category}</span>
      </div>
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600"><div><i class="fas fa-clock mr-1"></i>${it.duration}</div></div>
        <div class="text-right"><div class="text-base font-bold text-secondary">${it.cost}</div><div class="text-xs text-yellow-500">★ ${it.rating}</div></div>
      </div>
    </div>
  `).join('');
}

function renderRecentProfessionals(){
  const container = document.getElementById('recentProfessionals');
  if (!container) return;
  container.innerHTML = professionals.slice(0,6).map((pro,idx)=>`
    <div class="card hover:border-primary animate-slide-up" style="animation-delay:${idx*0.1}s" onclick="event.stopPropagation()">
      <div class="flex items-center">
        <img src="${pro.image}" alt="${pro.name}" class="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 border-2 border-gray-200 flex-shrink-0"/>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm truncate text-gray-800">${pro.name}</div>
          <div class="text-xs text-gray-600 mb-1">${pro.service}</div>
          <div class="flex items-center"><span class="text-xs text-yellow-500 mr-1">★ ${pro.rating}</span><span class="text-xs text-gray-500">(${pro.reviews})</span></div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="font-bold text-primary text-sm">${pro.price}</div>
          <div class="text-xs text-emerald-600">${pro.availability}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// -----------------------
// Alerts
// -----------------------
function showAlert(title, message){
  const alertDiv = document.createElement('div');
  alertDiv.className = 'fixed top-4 right-4 bg-white border-l-4 border-primary rounded-lg p-4 shadow-lg z-50 max-w-sm md:max-w-md animate-slide-in';
  alertDiv.innerHTML = `
    <div class="flex items-start">
      <div class="w-8 h-8 bg-gradient-to-br from-secondary to-secondary-light rounded-full flex items-center justify-center mr-3 flex-shrink-0 animate-bounce-gentle">
        <i class="fas fa-check text-white text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-sm md:text-base text-gray-800 mb-1">${title}</h4>
        <p class="text-sm text-gray-600">${message}</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 transition-colors"><i class="fas fa-times text-sm"></i></button>
    </div>
  `;
  document.body.appendChild(alertDiv);
  alertDiv.querySelector('button')?.addEventListener('click', ()=> alertDiv.remove());
  setTimeout(()=> alertDiv.remove(), 5000);
}

// -----------------------
// Setup listeners
// -----------------------
function setupEventListeners(){
  const si = document.getElementById('searchInput');
  const msi = document.getElementById('mobileSearchInput');
  si?.addEventListener('keypress', e => { if (e.key === 'Enter' && si.value.trim()) navigateToService(si.value.trim()); });
  msi?.addEventListener('keypress', e => { if (e.key === 'Enter' && msi.value.trim()) navigateToService(msi.value.trim()); });

  document.addEventListener('click', (e)=>{
    if (e.target.classList.contains('modal-overlay')) closeAllModals();
    if (!e.target.closest('.language-dropdown')) document.getElementById('languageMenu')?.classList.remove('show');
  });

  document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') closeAllModals(); });
}

// -----------------------
// UI sync + Role gating
// -----------------------
function updateUserInterface(){
  const userAvatar = document.getElementById('userAvatar');
  const userAvatarLarge = document.getElementById('userAvatarLarge');
  const userNameLarge = document.getElementById('userNameLarge');
  const userStatusLarge = document.getElementById('userStatusLarge');
  const guestUserMenu = document.getElementById('guestUserMenu');
  const loggedUserMenu = document.getElementById('loggedUserMenu');

  if (isLoggedIn && currentUser){
    if (userAvatar) userAvatar.textContent = currentUser.avatar;
    if (userAvatarLarge) userAvatarLarge.textContent = currentUser.avatar;
    if (userNameLarge) userNameLarge.textContent = currentUser.name;
    if (userStatusLarge) userStatusLarge.textContent = currentUser.email;
    guestUserMenu?.classList.add('hidden');
    loggedUserMenu?.classList.remove('hidden');
  } else {
    if (userAvatar) userAvatar.innerHTML = '<i class="fas fa-user"></i>';
    if (userAvatarLarge) userAvatarLarge.innerHTML = '<i class="fas fa-user"></i>';
    if (userNameLarge) userNameLarge.textContent = 'Guest User';
    if (userStatusLarge) userStatusLarge.textContent = 'Not signed in';
    guestUserMenu?.classList.remove('hidden');
    loggedUserMenu?.classList.add('hidden');
  }
}

function toggleEl(id, show){
  const el = document.getElementById(id);
  if (!el) return;
  if (show){
    el.classList.remove('hidden');
    el.disabled = false;
    el.setAttribute('aria-hidden','false');
  } else {
    el.classList.add('hidden');
    el.disabled = true;
    el.setAttribute('aria-hidden','true');
  }
}

/**
 * Gate nav visibility based on role:
 * - user: Home only
 * - professional: Home + Pro
 * - admin: Home + Pro + Admin
 */
function applyRoleGate(){
  const role = currentUser?.role || 'guest';
  const proAllowed = role === 'professional' || role === 'admin';
  const adminAllowed = role === 'admin';

  toggleEl('professionalBtn', proAllowed);
  toggleEl('mobileProfessional', proAllowed);

  // Admin hidden unless admin
  toggleEl('adminBtn', adminAllowed);
  toggleEl('mobileAdmin', adminAllowed);

  // Kick out of restricted pages if necessary
  if (!proAllowed && currentPage === 'professional') switchView('customer');
  if (!adminAllowed && currentPage === 'admin') switchView('customer');
}

// -----------------------
// Init
// -----------------------
function initializeApp(){
  if (location.protocol === 'file:'){
    showAlert('Heads up', 'For Firebase Auth to work, serve this over http(s). Use VS Code “Live Server” or Firebase Hosting.');
  }

  renderPopularServices();
  renderServiceCategories();
  renderProfessionals();
  renderWorkPortfolio();
  renderRecentProfessionals();
  setupEventListeners();
  updateUserInterface();
  applyRoleGate();
  switchView('customer');

  setTimeout(()=> showAlert('Welcome!', 'QuickFix Pro is ready to use.'), 600);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initializeApp);
}else{
  initializeApp();
}
