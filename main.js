// =======================
// QuickFix Pro - App JS (restored admin sections, enriched signup fields, working buttons, centered modals, city-only location pill)
// =======================

// Global UI state
let isLoggedIn = false;
let currentUser = null;
let currentUserRole = 'guest'; // 'guest' | 'customer' | 'professional' | 'admin'
let currentPage = 'customer';

// Static data
const popularServices = [
  { name: 'IKEA assembly', page: 'ikeaAssemblyPage' },
  { name: 'TV mounting', page: 'tvMountingPage' },
  { name: 'Leaky tap', page: 'leakyTapPage' },
  { name: 'AC repair', page: 'acRepairPage' },
  { name: 'Blocked drain', page: 'blockedDrainPage' },
  { name: 'Ceiling fan', page: 'ceilingFanPage' }
];

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
    db.enablePersistence({ synchronizeTabs: true }).catch(()=>{});
  }
} catch (e) {
  console.error('Firebase init error:', e);
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
async function upsertUserProfile(user, extra = {}) {
  if (!db || !user) return;
  const ref = db.collection('users').doc(user.uid);
  const base = {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    provider: (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'password',
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };
  await ref.set({ ...base, ...extra, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
}
function setBtnLoading(btn, text='Please wait…'){ if(!btn) return; btn.dataset.orig=btn.innerHTML; btn.disabled=true; btn.innerHTML=`<i class="fas fa-circle-notch fa-spin mr-2"></i>${text}`; }
function setBtnSuccess(btn, text='Success!'){ if(!btn) return; btn.innerHTML=`<i class="fas fa-check mr-2"></i>${text}`; }
function restoreBtn(btn){ if(!btn) return; btn.disabled=false; if(btn.dataset.orig) btn.innerHTML=btn.dataset.orig; }

// Alerts
function showAlert(title, message){
  const alertDiv = document.createElement('div');
  alertDiv.className = 'qf-toast fixed top-4 right-4 bg-white border-l-4 border-primary rounded-lg p-4 shadow-lg z-50 max-w-sm md:max-w-md animate-slide-in';
  alertDiv.innerHTML = `
    <div class="flex items-start">
      <div class="w-8 h-8 bg-gradient-to-br from-secondary to-secondary-light rounded-full flex items-center justify-center mr-3 flex-shrink-0">
        <i class="fas fa-check text-white text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-sm md:text-base text-gray-800 mb-1">${title}</h4>
        <p class="text-sm text-gray-600">${message}</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0" title="Close">
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>
  `;
  document.body.appendChild(alertDiv);
  alertDiv.querySelector('button')?.addEventListener('click', ()=> dismissAllToasts());
  setTimeout(()=>{
    const onDocClick = () => dismissAllToasts();
    document.addEventListener('click', onDocClick, { capture:true, once:true });
  },0);
  setTimeout(()=> alertDiv.isConnected && alertDiv.remove(), 5000);
}
function dismissAllToasts(){ document.querySelectorAll('.qf-toast').forEach(t => t.remove()); }

// -----------------------
// Modals
// -----------------------
function openModal(id){
  closeAllModals(()=>{
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('hidden');
    requestAnimationFrame(()=> m.classList.add('show'));
    if (id === 'signupModal') renderGoogleSignInButtonSignup();
    if (id === 'loginModal') renderGoogleSignInButtonLogin();
  });
}
function closeModal(id){
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('show');
  setTimeout(()=> m.classList.add('hidden'), 200);
}
function closeAllModals(cb){
  document.querySelectorAll('.modal-overlay').forEach(m=>{
    if (!m.classList.contains('hidden')) {
      m.classList.remove('show');
      setTimeout(()=> m.classList.add('hidden'), 200);
    }
  });
  setTimeout(()=> cb && cb(), 210);
}

// -----------------------
// Navigation + Role gating
// -----------------------
function switchView(view){
  currentPage = view;
  ['customerView','professionalView','adminView','ikeaAssemblyPage','tvMountingPage','leakyTapPage','acRepairPage','blockedDrainPage','ceilingFanPage']
    .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  const el = document.getElementById(view + 'View');
  if (el) el.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(b=>{ b.classList.remove('btn-primary'); b.classList.add('btn-outline'); });
  const activeBtn = document.getElementById(view + 'Btn');
  activeBtn?.classList.remove('btn-outline');
  activeBtn?.classList.add('btn-primary');

  document.querySelectorAll('.mobile-nav .nav-item').forEach(i=>i.classList.remove('active'));
  const mobileBtn = document.getElementById('mobile' + view.charAt(0).toUpperCase() + view.slice(1));
  mobileBtn?.classList.add('active');

  closeAllModals();
}
function goProfessional(){
  if (!isLoggedIn){
    showAlert('Sign in required', 'Please sign in as a professional to access the Pro dashboard.');
    openModal('loginModal');
    return;
  }
  if (currentUserRole !== 'professional' && currentUserRole !== 'admin'){
    showAlert('Access restricted', 'Your account is a customer. Professional features require a professional account.');
    return;
  }
  switchView('professional');
}
function showServicePage(pageId){
  ['customerView','professionalView','adminView','ikeaAssemblyPage','tvMountingPage','leakyTapPage','acRepairPage','blockedDrainPage','ceilingFanPage']
    .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById(pageId)?.classList.remove('hidden');
}

// -----------------------
// Auth
// -----------------------
async function loginUser(){
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const remember = document.getElementById('remember-me')?.checked;
  const btn = document.getElementById('loginSubmit');
  if (!auth) return showAlert('Error','Firebase not initialized');
  try{
    setBtnLoading(btn, 'Signing in…');
    await auth.setPersistence(
      remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
    );
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await upsertUserProfile(cred.user);
    setBtnSuccess(btn, 'Signed in!');
    showAlert('Welcome Back!', 'Signed in successfully.');
    setTimeout(()=>{
      restoreBtn(btn);
      closeModal('loginModal');
    }, 600);
  }catch(err){
    restoreBtn(btn);
    const msgEl = document.getElementById('login-message');
    if (msgEl) msgEl.textContent = err.message || 'Login failed.';
  }
}
async function signupUser(){
  const fullName = document.getElementById('fullName')?.value.trim();
  const email = document.getElementById('emailAddress')?.value.trim();
  const password = document.getElementById('password')?.value;
  const role = document.querySelector('input[name="accountRole"]:checked')?.value || 'user';
  const lang = document.getElementById('preferredLanguage')?.value || 'en';
  const dob = document.getElementById('dob')?.value || '';
  const country = document.getElementById('country')?.value || '';
  const city = document.getElementById('city')?.value || '';
  const addressLine = document.getElementById('addressLine')?.value || '';
  const postalCode = document.getElementById('postalCode')?.value || '';

  const btn = document.getElementById('signupSubmit');
  const msg = document.getElementById('signupMessage');

  if (!auth) return showAlert('Error','Firebase not initialized');

  try{
    setBtnLoading(btn, 'Creating account…');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: fullName });

    const firestoreRole = role === 'professional' ? 'professional' : 'customer';
    await upsertUserProfile(
      { ...cred.user, displayName: fullName },
      {
        role: firestoreRole,
        lang,
        dob,
        address: { country, city, addressLine, postalCode }
      }
    );

    setBtnSuccess(btn, 'Account created!');
    msg.className = 'text-sm text-green-600 mt-1';
    msg.textContent = 'Account created successfully.';
    showAlert('Account Created!', `Welcome to QuickFix Pro, ${fullName || 'there'}!`);
    setTimeout(()=>{
      closeModal('signupModal');
      if (firestoreRole === 'professional') goProfessional();
      else switchView('customer');
      restoreBtn(btn);
      msg.textContent = '';
    }, 800);
  }catch(err){
    restoreBtn(btn);
    msg.className = 'text-sm text-red-600 mt-1';
    msg.textContent = err.message || 'Could not create account.';
  }
}
async function startPasswordReset(){
  const email = document.getElementById('login-email')?.value.trim();
  if (!email) return showAlert('Reset Password', 'Enter your email above first.');
  try{
    await auth.sendPasswordResetEmail(email);
    showAlert('Reset Email Sent', 'Check your inbox for password reset instructions.');
  }catch(err){
    showAlert('Reset Failed', err.message || 'Could not send reset email.');
  }
}
async function logoutUser(){
  try{
    await auth.signOut();
    showAlert('Signed Out', 'You have been signed out.');
  }catch(err){
    showAlert('Error', err.message || 'Could not sign out.');
  }
}

// Watch auth state
if (auth){
  auth.onAuthStateChanged(async (user)=>{
    if (user){
      try{ await upsertUserProfile(user); }catch{}
      // Pull role for gating
      currentUserRole = 'customer';
      try{
        const snap = await db.collection('users').doc(user.uid).get();
        if (snap.exists && snap.data().role) currentUserRole = snap.data().role;
      }catch{}
      isLoggedIn = true;
      currentUser = {
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'QuickFix User'),
        email: user.email || '',
        avatar: getInitials(user.displayName, user.email)
      };
    } else {
      isLoggedIn = false;
      currentUser = null;
      currentUserRole = 'guest';
    }
    updateUserInterface();
  });
}

// -----------------------
// Google buttons
// -----------------------
function renderGoogleSignInButtonSignup(){
  const container = document.getElementById('googleSignInBtnSignup');
  if (!container) return;
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-base btn-google w-full';
  btn.innerHTML = '<i class="fab fa-google mr-2"></i> Continue with Google';
  btn.onclick = async (e)=>{
    e.preventDefault();
    if (!auth || !firebase) return showAlert('Error','Firebase not initialized');
    const role = document.querySelector('input[name="accountRole"]:checked')?.value || 'user';
    const lang = document.getElementById('preferredLanguage')?.value || 'en';
    const dob = document.getElementById('dob')?.value || '';
    const country = document.getElementById('country')?.value || '';
    const city = document.getElementById('city')?.value || '';
    const addressLine = document.getElementById('addressLine')?.value || '';
    const postalCode = document.getElementById('postalCode')?.value || '';
    try{
      setBtnLoading(btn, 'Signing in with Google…');
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const firestoreRole = role === 'professional' ? 'professional' : 'customer';
      await upsertUserProfile(result.user, {
        role: firestoreRole,
        lang, dob,
        address: { country, city, addressLine, postalCode }
      });
      setBtnSuccess(btn, 'Done!');
      showAlert('Google Sign-in Successful', `Welcome, ${result.user.displayName || 'user'}!`);
      setTimeout(()=>{
        closeModal('signupModal');
        if (firestoreRole === 'professional') goProfessional();
        else switchView('customer');
        restoreBtn(btn);
      }, 600);
    }catch(err){
      restoreBtn(btn);
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
  btn.type = 'button';
  btn.className = 'btn-base btn-google w-full';
  btn.innerHTML = '<i class="fab fa-google mr-2"></i> Continue with Google';
  btn.onclick = async (e)=>{
    e.preventDefault();
    if (!auth || !firebase) return showAlert('Error','Firebase not initialized');
    try{
      setBtnLoading(btn, 'Signing in…');
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      await upsertUserProfile(result.user);
      setBtnSuccess(btn, 'Signed in!');
      showAlert('Google Login Successful', `Welcome, ${result.user.displayName || 'user'}!`);
      setTimeout(()=>{
        restoreBtn(btn);
        closeModal('loginModal');
      }, 600);
    }catch(err){
      restoreBtn(btn);
      const msg = (err?.code === 'auth/unauthorized-domain')
        ? 'Unauthorized domain. Add your site origin to Firebase Auth → Settings → Authorized domains.'
        : err.message;
      showAlert('Login Failed', msg);
    }
  };
  container.appendChild(btn);
}

// -----------------------
// Search
// -----------------------
function navigateToService(serviceName){
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
function executeSearchFromInput(){
  const el = document.getElementById('searchInput');
  const q = el?.value.trim();
  if (q) navigateToService(q);
}
function executeSearchFromMobileInput(){
  const el = document.getElementById('mobileSearchInput');
  const q = el?.value.trim();
  if (q) navigateToService(q);
}

// -----------------------
// Renderers
// -----------------------
function renderPopularServices(){
  const container = document.getElementById('popularServices');
  if (!container) return;
  container.innerHTML = popularServices.map((s,idx)=>`
    <button type="button" class="card card-interactive text-center min-h-[80px] md:min-h-[100px] flex flex-col items-center justify-center hover:border-primary animate-scale-in"
            style="animation-delay:${idx*0.1}s" data-popular="${s.name}">
      <i class="fas fa-tools text-xl md:text-2xl text-primary mb-2" style="animation-delay:${idx*0.2}s"></i>
      <span class="font-bold text-sm md:text-base text-gray-800">${s.name}</span>
    </button>
  `).join('');
}
function renderServiceCategories(){
  const container = document.getElementById('serviceCategories');
  if (!container) return;
  container.innerHTML = serviceCategories.map((c,idx)=>`
    <div class="card card-interactive text-center hover:border-primary animate-scale-in" style="animation-delay:${idx*0.1}s" data-category="${c.name}">
      <div class="service-icon mx-auto mb-3" style="background:${c.color};width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white"><i class="${c.icon}"></i></div>
      <h3 class="font-bold text-sm md:text-base mb-1 text-gray-800">${c.name}</h3>
      <p class="text-xs md:text-sm text-gray-600">${c.professionals} professionals</p>
    </div>
  `).join('');
}
function renderProfessionals(){
  const container = document.getElementById('featuredProfessionals');
  if (!container) return;
  container.innerHTML = professionals.slice(0,3).map((pro,idx)=>renderProfessionalCard(pro,idx)).join('');
}
function renderProfessionalCard(pro, index = 0){
  return `
    <div class="card card-interactive hover:border-primary animate-slide-up" style="animation-delay:${index*0.15}s">
      <div class="flex items-start mb-4">
        <img src="${pro.image}" alt="${pro.name}" class="w-14 h-14 md:w-16 md:h-16 rounded-lg mr-3 border-2 border-gray-200 flex-shrink-0"/>
        <div class="flex-1 min-w-0">
          <div class="flex items-center mb-1">
            <h3 class="font-bold text-base md:text-lg mr-2 truncate text-gray-800">${pro.name}</h3>
            ${pro.verified ? '<i class="fas fa-check-circle text-secondary flex-shrink-0" title="Verified Professional"></i>' : ''}
          </div>
          <p class="text-gray-600 mb-2 text-sm font-medium">${pro.service}</p>
          <div class="flex items-center mb-2">
            <div class="rating-stars mr-2">
              ${[...Array(5)].map((_,i)=>`<i class="fas fa-star ${i<Math.floor(pro.rating)?'text-yellow-500':'text-gray-300'} text-xs"></i>`).join('')}
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
        <button type="button" class="btn-base btn-outline flex-1 text-sm">View Profile</button>
        <button type="button" class="btn-base btn-primary flex-1 text-sm">Book Now</button>
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
    <div class="flex items-center p-4 bg-white border border-gray-200 rounded-lg">
      <img src="${pro.image}" alt="${pro.name}" class="w-16 h-16 rounded-full mr-4 border-2 border-gray-200"/>
      <div class="flex-1">
        <div class="flex items-center mb-2">
          <h3 class="font-bold text-lg mr-2">${pro.name}</h3>
          ${pro.verified ? '<i class="fas fa-check-circle text-secondary"></i>' : ''}
        </div>
        <p class="text-gray-600 mb-2">${pro.service}</p>
        <div class="flex items-center mb-2">
          <div class="rating-stars mr-2">
            ${[...Array(5)].map((_,i)=>`<i class="fas fa-star ${i<Math.floor(pro.rating)?'text-yellow-500':'text-gray-300'}"></i>`).join('')}
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
        <button type="button" class="btn-base btn-primary">Book Now</button>
      </div>
    </div>
  `).join('');
}
function renderRecentProfessionals(){
  const container = document.getElementById('recentProfessionals');
  if (!container) return;
  container.innerHTML = professionals.slice(0,6).map((pro,idx)=>`
    <div class="card hover:border-primary animate-slide-up" style="animation-delay:${idx*0.1}s">
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
// UI sync
// -----------------------
function enforceProNavVisibility(){
  const showPro = isLoggedIn && (currentUserRole === 'professional' || currentUserRole === 'admin');
  const proBtn = document.getElementById('professionalBtn');
  const proMobile = document.getElementById('mobileProfessional');
  if (showPro) {
    proBtn?.classList.remove('hidden');
    proMobile?.classList.remove('hidden');
  } else {
    proBtn?.classList.add('hidden');
    proMobile?.classList.add('hidden');
  }
}
function updateUserInterface(){
  const userAvatar = document.getElementById('userAvatar');
  const userAvatarLarge = document.getElementById('userAvatarLarge');
  const userNameLarge = document.getElementById('userNameLarge');
  const userStatusLarge = document.getElementById('userStatusLarge');
  const guestUserMenu = document.getElementById('guestUserMenu');
  const loggedUserMenu = document.getElementById('loggedUserMenu');

  if (isLoggedIn && currentUser){
    userAvatar && (userAvatar.textContent = currentUser.avatar);
    userAvatarLarge && (userAvatarLarge.textContent = currentUser.avatar);
    userNameLarge && (userNameLarge.textContent = currentUser.name);
    userStatusLarge && (userStatusLarge.textContent = currentUser.email);
    guestUserMenu?.classList.add('hidden');
    loggedUserMenu?.classList.remove('hidden');
  } else {
    userAvatar && (userAvatar.innerHTML = '<i class="fas fa-user"></i>');
    userAvatarLarge && (userAvatarLarge.innerHTML = '<i class="fas fa-user"></i>');
    userNameLarge && (userNameLarge.textContent = 'Guest User');
    userStatusLarge && (userStatusLarge.textContent = 'Not signed in');
    guestUserMenu?.classList.remove('hidden');
    loggedUserMenu?.classList.add('hidden');
  }
  enforceProNavVisibility();
}

// -----------------------
// Location (city-only)
// -----------------------
async function updateLocationPill(){
  const pill = document.getElementById('locationPill');
  const cityEl = document.getElementById('cityText');
  if (!pill || !cityEl) return;
  try{
    if (!navigator.geolocation) throw new Error('Geolocation unavailable');
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      try{
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        const res = await fetch(url, { headers: { 'Accept':'application/json' }});
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Your area';
        cityEl.textContent = city;
        pill.classList.remove('hidden');
        // Also keep in memory for signup "Use current city"
        window.__QF_CITY__ = city;
      }catch{
        cityEl.textContent = 'Your area';
        pill.classList.remove('hidden');
      }
    }, ()=>{
      cityEl.textContent = 'Your area';
      pill.classList.remove('hidden');
    }, { timeout: 6000 });
  }catch{
    cityEl.textContent = 'Your area';
    pill.classList.remove('hidden');
  }
}

// -----------------------
// Role selector visuals
// -----------------------
function setupRoleSelector(){
  const cards = document.querySelectorAll('[data-role-card]');
  cards.forEach(card=>{
    card.addEventListener('click', ()=>{
      cards.forEach(c=> c.classList.remove('active'));
      card.classList.add('active');
      const input = card.querySelector('input[type="radio"]');
      if (input) input.checked = true;
    });
  });
}

// -----------------------
// Event listeners & init
// -----------------------
function setupEventListeners(){
  // Brand → Home
  document.getElementById('brandLink')?.addEventListener('click', ()=> switchView('customer'));

  // Desktop nav
  document.getElementById('customerBtn')?.addEventListener('click', ()=> switchView('customer'));
  document.getElementById('professionalBtn')?.addEventListener('click', goProfessional);
  document.getElementById('adminBtn')?.addEventListener('click', ()=> switchView('admin'));

  // Mobile nav
  document.getElementById('mobileCustomer')?.addEventListener('click', ()=> switchView('customer'));
  document.getElementById('mobileProfessional')?.addEventListener('click', goProfessional);
  document.getElementById('mobileSearch')?.addEventListener('click', ()=> openModal('searchModal'));
  document.getElementById('mobileAdmin')?.addEventListener('click', ()=> switchView('admin'));
  document.getElementById('mobileProfile')?.addEventListener('click', ()=> openModal('userMenuModal'));

  // Search
  document.getElementById('searchBtn')?.addEventListener('click', executeSearchFromInput);
  document.getElementById('mobileSearchButton')?.addEventListener('click', executeSearchFromMobileInput);
  document.getElementById('searchInput')?.addEventListener('keypress', e=>{ if(e.key==='Enter') executeSearchFromInput(); });
  document.getElementById('mobileSearchInput')?.addEventListener('keypress', e=>{ if(e.key==='Enter') executeSearchFromMobileInput(); });

  // Delegate clicks for popular/services
  document.addEventListener('click', (e)=>{
    const pop = e.target.closest('[data-popular]');
    if (pop) { navigateToService(pop.dataset.popular); return; }
    const cat = e.target.closest('[data-category]');
    if (cat) { navigateToService(cat.dataset.category); return; }
    const svc = e.target.closest('[data-service]');
    if (svc) { navigateToService(svc.dataset.service); return; }
  });

  // User menu openers
  document.getElementById('userMenuBtn')?.addEventListener('click', ()=> openModal('userMenuModal'));
  document.getElementById('openLoginFromUserMenu')?.addEventListener('click', ()=>{ closeModal('userMenuModal'); openModal('loginModal'); });
  document.getElementById('openSignupFromUserMenu')?.addEventListener('click', ()=>{ closeModal('userMenuModal'); openModal('signupModal'); });

  // Cross links in modals
  document.getElementById('openSignupFromLogin')?.addEventListener('click', ()=>{ closeModal('loginModal'); openModal('signupModal'); });
  document.getElementById('openLoginFromSignup')?.addEventListener('click', ()=>{ closeModal('signupModal'); openModal('loginModal'); });

  // Close buttons (data-close attr)
  document.querySelectorAll('.close-btn[data-close]')?.forEach(btn=>{
    btn.addEventListener('click', ()=> closeModal(btn.dataset.close));
  });

  // Forms
  document.getElementById('loginForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); loginUser(); });
  document.getElementById('signupForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); signupUser(); });
  document.getElementById('resetLink')?.addEventListener('click', (e)=>{ e.preventDefault(); startPasswordReset(); });
  document.getElementById('logoutBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); logoutUser(); });

  document.getElementById('addWorkForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); closeModal('workUploadModal'); showAlert('Work Added!', 'Your project has been added to your portfolio.'); });
  document.getElementById('withdrawForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); closeModal('withdrawModal'); showAlert('Withdrawal Initiated', 'Processing within 1–2 business days.'); });
  document.getElementById('adminWithdrawForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); closeModal('adminWithdrawModal'); showAlert('Platform Earnings Withdrawn', 'Transferred to your business account.'); });

  // Open work/upload modals from Pro view
  document.getElementById('openAddWork')?.addEventListener('click', ()=> openModal('workUploadModal'));
  document.getElementById('openAddWork2')?.addEventListener('click', ()=> openModal('workUploadModal'));
  document.getElementById('openWithdraw')?.addEventListener('click', ()=> openModal('withdrawModal'));
  document.getElementById('openAdminWithdraw')?.addEventListener('click', ()=> openModal('adminWithdrawModal'));

  // Role selector
  setupRoleSelector();

  // Dismiss modals by clicking backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay=>{
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay) {
        overlay.classList.remove('show');
        setTimeout(()=> overlay.classList.add('hidden'), 200);
      }
    });
  });

  // ESC to close
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeAllModals(); });

  // Signup: use current city
  document.getElementById('useCurrentCity')?.addEventListener('click', ()=>{
    const cityField = document.getElementById('city');
    if (cityField) cityField.value = window.__QF_CITY__ || document.getElementById('cityText')?.textContent || '';
  });
}

// -----------------------
// Initialize
// -----------------------
function renderWorkPortfolio(){
  const container = document.getElementById('workPortfolio');
  if (!container) return;
  const items = [
    { title:'Modern Kitchen Renovation', category:'Plumbing', duration:'6 hours', cost:'$480', image:'https://picsum.photos/400/300?random=1', rating:'5.0' },
    { title:'Smart Bathroom Installation', category:'Plumbing', duration:'2 days', cost:'$1,250', image:'https://picsum.photos/400/300?random=2', rating:'4.9' },
    { title:'Complete Home Automation', category:'Electrical', duration:'8 hours', cost:'$950', image:'https://picsum.photos/400/300?random=3', rating:'5.0' }
  ];
  container.innerHTML = items.map((it,idx)=>`
    <div class="card card-interactive overflow-hidden hover:border-primary animate-scale-in" style="animation-delay:${idx*0.1}s">
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

function initializeApp(){
  renderPopularServices();
  renderServiceCategories();
  renderProfessionals();
  renderServiceProfessionals('ikeaAssemblyPage');
  renderRecentProfessionals();
  renderWorkPortfolio();

  setupEventListeners();
  updateUserInterface();
  updateLocationPill();

  switchView('customer');
  setTimeout(()=> showAlert('Welcome!', 'QuickFix Pro is ready to use.'), 400);
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initializeApp);
}else{
  initializeApp();
}
