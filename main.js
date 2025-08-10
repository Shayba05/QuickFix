// =======================
// QuickFix Pro — Buttons fixed (no stopPropagation blocking), solid signup/login
// =======================

let isLoggedIn = false;
let currentUser = null;
let currentUserRole = 'guest'; // 'guest' | 'customer' | 'professional' | 'admin'
let currentLanguage = 'en';

// ------------ Static Data ------------
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

// ------------ Firebase ------------
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
  auth = firebase?.auth();
  db = firebase?.firestore();
  if (db?.enablePersistence) {
    db.enablePersistence({ synchronizeTabs: true }).catch(()=>{});
  }
} catch (e) {
  console.warn('Firebase init failed:', e);
}

// ------------ Helpers ------------
function normalize(t){ return String(t).toLowerCase().replace(/[^a-z0-9]/g,''); }
function getInitials(name = '', email = '') {
  if (name && name.trim()) return name.trim().split(/\s+/).map(n=>n[0]).join('').slice(0,2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return 'QF';
}
function pruneUndefined(o) {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(pruneUndefined);
  return Object.fromEntries(Object.entries(o).filter(([,v]) => v !== undefined).map(([k,v])=>[k,pruneUndefined(v)]));
}

// Firestore profile upsert
async function upsertUserProfile(user, extra = {}) {
  try {
    if (!db || !user?.uid) return;
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
    const data = pruneUndefined({ ...base, ...extra });
    if (!snap.exists) {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      if (!data.role) data.role = 'customer';
    }
    await ref.set(data, { merge: true });
  } catch (err) {
    console.error('upsertUserProfile error:', err);
    showAlert('Profile Save Error', err.message || 'Could not save profile.');
  }
}

// ------------ Alerts ------------
function showAlert(title, message){
  const alertDiv = document.createElement('div');
  alertDiv.className = 'qf-toast fixed top-4 right-4 bg-white border-l-4 border-primary rounded-lg p-4 shadow-lg z-50 max-w-sm md:max-w-md animate-slide-in';
  alertDiv.innerHTML = `
    <div class="flex items-start">
      <div class="w-8 h-8 bg-gradient-to-br from-secondary to-secondary-light rounded-full flex items-center justify-center mr-3 flex-shrink-0 animate-bounce-gentle">
        <i class="fas fa-check text-white text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-sm md:text-base text-gray-800 mb-1">${title}</h4>
        <p class="text-sm text-gray-600">${message}</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 transition-colors" title="Close">
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>
  `;
  document.body.appendChild(alertDiv);
  alertDiv.querySelector('button')?.addEventListener('click', ()=> dismissAllToasts());
  setTimeout(()=>{ document.addEventListener('click', ()=> dismissAllToasts(), { capture:true, once:true }); },0);
  setTimeout(()=> alertDiv.isConnected && alertDiv.remove(), 5000);
}
function dismissAllToasts(){ document.querySelectorAll('.qf-toast').forEach(t => t.remove()); }

// ------------ Views ------------
function switchView(view){
  ['customerView','professionalView','adminView'].forEach(id=> document.getElementById(id)?.classList.add('hidden'));
  document.getElementById(view + 'View')?.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(b=>{ b.classList.remove('btn-primary'); b.classList.add('btn-outline'); });
  document.getElementById(view + 'Btn')?.classList.remove('btn-outline');
  document.getElementById(view + 'Btn')?.classList.add('btn-primary');

  document.querySelectorAll('.mobile-nav .nav-item').forEach(i=>i.classList.remove('active'));
  const mobileBtn = document.getElementById('mobile' + view.charAt(0).toUpperCase() + view.slice(1));
  mobileBtn?.classList.add('active');
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

// ------------ Modals ------------
function openModal(id){
  closeAllModals(()=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    setTimeout(()=> el.classList.add('show'), 10);
    if (id === 'signupModal') renderGoogleSignInButtonSignup();
    if (id === 'loginModal') renderGoogleSignInButtonLogin();
  });
}
function closeModal(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  setTimeout(()=> el.classList.add('hidden'), 300);
}
function closeAllModals(cb){
  const ids = ['loginModal','signupModal','userMenuModal','searchModal','workUploadModal','withdrawModal','adminWithdrawModal'];
  let pending = 0, any=false;
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden')){
      any=true; pending++;
      el.classList.remove('show');
      setTimeout(()=>{ el.classList.add('hidden'); if(--pending===0 && cb) cb(); },300);
    }
  });
  if (!any && cb) cb();
}

// ------------ Renderers ------------
function renderPopularServices(){
  const container = document.getElementById('popularServices');
  if (!container) return;
  container.innerHTML = popularServices.map((s,idx)=>`
    <button data-action="navigate-service" data-service="${s.name}"
      class="card card-interactive text-center min-h-[80px] md:min-h-[100px] flex flex-col items-center justify-center hover:border-primary animate-scale-in"
      style="animation-delay:${idx*0.1}s">
      <i class="fas fa-tools text-xl md:text-2xl text-primary mb-2 animate-float" style="animation-delay:${idx*0.2}s"></i>
      <span class="font-bold text-sm md:text-base text-gray-800">${s.name}</span>
    </button>
  `).join('');
}
function renderServiceCategories(){
  const container = document.getElementById('serviceCategories');
  if (!container) return;
  container.innerHTML = serviceCategories.map((c,idx)=>`
    <div class="card card-interactive text-center hover:border-primary animate-scale-in"
         data-action="execute-search" data-query="${c.name.toLowerCase()}" style="animation-delay:${idx*0.1}s">
      <div class="service-icon mx-auto mb-3" style="background:${c.color}"><i class="${c.icon}"></i></div>
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
        <button class="btn-base btn-outline flex-1 text-sm">View Profile</button>
        <button class="btn-base btn-primary flex-1 text-sm">Book Now</button>
      </div>
    </div>
  `;
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

// ------------ Search / Navigate ------------
function navigateToService(serviceName){
  showAlert('Search Results', `Found ${Math.floor(Math.random()*50)+10} professionals for "${serviceName}"`);
}
function executeSearchFromInput(){
  const el = document.getElementById('searchInput');
  const q = el?.value?.trim();
  if (q) navigateToService(q);
}
function executeSearchFromMobile(){
  const el = document.getElementById('mobileSearchInput');
  const q = el?.value?.trim();
  if (q) navigateToService(q);
}
function executeSearch(query){
  if (!query?.trim()) return;
  const hit = popularServices.find(s=> s.name.toLowerCase() === query.toLowerCase());
  if (hit) navigateToService(hit.name);
  else showAlert('Search Results', `Found ${Math.floor(Math.random()*50)+10} professionals for "${query}"`);
}

// ------------ Auth ------------
async function loginUser(){
  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const remember = document.getElementById('remember-me')?.checked;

  if (!auth) {
    isLoggedIn = true;
    currentUser = { name: email?.split('@')[0] || 'QuickFix User', email, avatar: getInitials('', email) };
    currentUserRole = 'customer';
    updateUserInterface();
    closeModal('loginModal');
    showAlert('Welcome Back!', 'Signed in (demo).');
    return;
  }

  try{
    await auth.setPersistence(remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await upsertUserProfile(cred.user);
    closeModal('loginModal');
    showAlert('Welcome Back!', 'Signed in successfully.');
  }catch(err){
    const el = document.getElementById('login-message');
    if (el) el.textContent = err.message || 'Login failed.';
  }
}

async function signupUser(){
  const msg = document.getElementById('signup-message');
  const btn = document.getElementById('signupSubmitBtn');
  msg.textContent = '';

  const fullName = document.getElementById('fullName')?.value?.trim();
  const email = document.getElementById('emailAddress')?.value?.trim();
  const password = document.getElementById('password')?.value;

  if (!fullName) { msg.textContent = 'Please enter your full name.'; return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Please enter a valid email.'; return; }
  if (!password || password.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }

  const chosenRole = document.querySelector('input[name="accountRole"]:checked')?.value || 'customer';
  currentLanguage = document.getElementById('signupLanguage')?.value || 'en';
  const dob = document.getElementById('signupDob')?.value || undefined;
  const addressLine = document.getElementById('signupAddress')?.value || undefined;
  const city = document.getElementById('signupCity')?.value || undefined;
  const country = document.getElementById('signupCountry')?.value || undefined;
  const postalCode = document.getElementById('signupPostal')?.value || undefined;

  if (btn.dataset.loading === '1') return;
  btn.dataset.loading = '1';
  const originalText = btn.textContent;
  btn.textContent = 'Creating...';

  const finish = () => { btn.dataset.loading = '0'; btn.textContent = originalText; };

  if (!auth) {
    isLoggedIn = true;
    currentUserRole = chosenRole;
    currentUser = { name: fullName || (email?.split('@')[0] ?? 'QuickFix User'), email, avatar: getInitials(fullName, email) };
    updateUserInterface();
    closeModal('signupModal');
    showAlert('Account Created!', chosenRole === 'professional' ? 'You can now access the Pro dashboard.' : 'Welcome to QuickFix Pro!');
    finish();
    return;
  }

  try{
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: fullName });
    await upsertUserProfile(cred.user, {
      displayName: fullName,
      role: chosenRole,
      lang: currentLanguage,
      dob,
      address: pruneUndefined({ addressLine, city, country, postalCode })
    });
    currentUserRole = chosenRole;
    closeModal('signupModal');
    showAlert('Account Created!', chosenRole === 'professional' ? 'You can now access the Pro dashboard.' : 'Welcome to QuickFix Pro!');
    updateUserInterface();
  }catch(err){
    msg.textContent = err.message || 'Could not create account.';
  }finally{
    finish();
  }
}

async function startPasswordReset(){
  const email = document.getElementById('login-email')?.value?.trim();
  if (!email) return showAlert('Reset Password', 'Enter your email above first.');
  if (!auth) return showAlert('Reset (demo)', 'Auth disabled locally.');
  try{
    await auth.sendPasswordResetEmail(email);
    showAlert('Reset Email Sent', 'Check your inbox for password reset instructions.');
  }catch(err){
    showAlert('Reset Failed', err.message || 'Could not send reset email.');
  }
}

async function logoutUser(){
  if (!auth) {
    isLoggedIn = false; currentUser = null; currentUserRole = 'guest';
    updateUserInterface();
    showAlert('Signed Out', 'You have been signed out (demo).');
    return;
  }
  try{
    await auth.signOut();
    showAlert('Signed Out', 'You have been signed out.');
  }catch(err){
    showAlert('Error', err.message || 'Could not sign out.');
  }
}

// Keep UI synced with auth
if (auth){
  auth.onAuthStateChanged(async (user)=>{
    if (user){
      try{
        await upsertUserProfile(user);
        currentUserRole = 'customer';
        try{
          const snap = await db.collection('users').doc(user.uid).get();
          if (snap.exists && snap.data().role) currentUserRole = snap.data().role;
        }catch{}
      }catch{}
      isLoggedIn = true;
      currentUser = {
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'QuickFix User'),
        email: user.email || '',
        avatar: getInitials(user.displayName, user.email)
      };
    } else {
      isLoggedIn = false; currentUser = null; currentUserRole = 'guest';
    }
    updateUserInterface();
  });
}

// ------------ City (after logo) ------------
async function detectCityIntoHeader(){
  const pill = document.getElementById('locationPill');
  const cityEl = document.getElementById('locationCity');
  if (!pill || !cityEl) return;

  function setCity(text){ cityEl.textContent = text; pill.classList.remove('hidden'); }

  if (!navigator.geolocation){ setCity('Your city'); return; }

  navigator.geolocation.getCurrentPosition(async (pos)=>{
    try{
      const { latitude, longitude } = pos.coords;
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept':'application/json' }});
      const data = await res.json();
      const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || 'Your city';
      setCity(city);
      const sc = document.getElementById('signupCity');
      if (sc && !sc.value) sc.value = city;
    }catch{
      setCity('Your city');
    }
  }, ()=>{
    setCity('Your city');
  }, { enableHighAccuracy:false, timeout:5000, maximumAge:600000 });
}

// ------------ Google Signin Buttons ------------
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
      await upsertUserProfile(result.user);
      showAlert('Google Signup Successful', `Welcome, ${result.user.displayName || 'user'}!`);
      closeModal('signupModal');
    }catch(err){
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
      await upsertUserProfile(result.user);
      showAlert('Google Login Successful', `Welcome, ${result.user.displayName || 'user'}!`);
      closeModal('loginModal');
    }catch(err){
      const msg = (err?.code === 'auth/unauthorized-domain')
        ? 'Unauthorized domain. Add your site origin to Firebase Auth → Settings → Authorized domains.'
        : err.message;
      showAlert('Login Failed', msg);
    }
  };
  container.appendChild(btn);
}

// ------------ UI Sync ------------
function updateUserInterface(){
  const userAvatar = document.getElementById('userAvatar');
  const userAvatarLarge = document.getElementById('userAvatarLarge');
  const userNameLarge = document.getElementById('userNameLarge');
  const userStatusLarge = document.getElementById('userStatusLarge');
  const guestUserMenu = document.getElementById('guestUserMenu');
  const loggedUserMenu = document.getElementById('loggedUserMenu');

  const proBtn = document.getElementById('professionalBtn');
  const mobileProBtn = document.getElementById('mobileProfessional');
  const canSeePro = isLoggedIn && (currentUserRole === 'professional' || currentUserRole === 'admin');
  proBtn?.classList.toggle('hidden', !canSeePro);
  mobileProBtn?.classList.toggle('hidden', !canSeePro);

  if (isLoggedIn && currentUser){
    if (userAvatar) userAvatar.textContent = currentUser.avatar;
    if (userAvatarLarge) userAvatarLarge.textContent = currentUser.avatar;
    if (userNameLarge) userNameLarge.textContent = currentUser.name;
    if (userStatusLarge) userStatusLarge.textContent = currentUser.email || 'Signed in';
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

// ------------ Event Delegation ------------
function handleClicks(e){
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const action = el.getAttribute('data-action');

  if (['switch-view','go-professional','open-modal','close-modal','swap-modal','navigate-service','search-from-input','search-from-mobile','execute-search','use-current-location','start-reset','logout','select-role','go-home'].includes(action)) {
    e.preventDefault();
  }

  switch(action){
    case 'go-home':
      switchView('customer'); break;

    case 'switch-view': {
      const view = el.getAttribute('data-view');
      if (view === 'professional') goProfessional(); else switchView(view);
      break;
    }

    case 'go-professional':
      goProfessional(); break;

    case 'open-modal': {
      const id = el.getAttribute('data-modal'); openModal(id); break;
    }
    case 'close-modal': {
      const id = el.getAttribute('data-modal'); closeModal(id); break;
    }
    case 'swap-modal': {
      const closeId = el.getAttribute('data-close');
      const openId = el.getAttribute('data-open');
      closeModal(closeId); setTimeout(()=> openModal(openId), 160);
      break;
    }

    case 'navigate-service': {
      const s = el.getAttribute('data-service'); navigateToService(s); closeAllModals(); break;
    }
    case 'search-from-input':
      executeSearchFromInput(); break;
    case 'search-from-mobile':
      executeSearchFromMobile(); break;
    case 'execute-search': {
      const q = el.getAttribute('data-query'); executeSearch(q); break;
    }

    case 'use-current-location':
      if (!navigator.geolocation) { showAlert('Location', 'Geolocation not supported.'); return; }
      navigator.geolocation.getCurrentPosition(async (pos)=>{
        try{
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&addressdetails=1`;
          const res = await fetch(url, { headers:{ 'Accept':'application/json' } });
          const data = await res.json();
          const c = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || '';
          const sc = document.getElementById('signupCity');
          if (sc) sc.value = c;
          showAlert('Location detected', c || 'City updated.');
        }catch{
          showAlert('Location', 'Could not determine your city.');
        }
      }, ()=> showAlert('Location', 'Permission denied or unavailable.'), { timeout:5000 });
      break;

    case 'start-reset':
      startPasswordReset(); break;

    case 'logout':
      logoutUser(); closeAllModals(); break;

    case 'select-role': {
      const role = el.getAttribute('data-role') || 'customer';
      document.querySelectorAll('.user-type-card').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      const radio = document.querySelector(`#role${role === 'professional' ? 'Professional' : 'User'}`);
      if (radio) radio.checked = true;
      break;
    }
  }
}

// Close on overlay click only
function handleOverlayClose(e){
  if (e.target.classList?.contains('modal-overlay')) closeAllModals();
}

// ------------ Form submits ------------
function wireForms(){
  document.getElementById('loginForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); loginUser(); });
  document.getElementById('signupForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); signupUser(); });
  document.getElementById('workForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); closeModal('workUploadModal'); showAlert('Work Added!', 'Your project has been added to your portfolio.'); });
  document.getElementById('withdrawForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); closeModal('withdrawModal'); showAlert('Withdrawal Initiated', 'Processing within 1–2 business days.'); });
  document.getElementById('adminWithdrawForm')?.addEventListener('submit', (e)=>{ e.preventDefault(); closeModal('adminWithdrawModal'); showAlert('Platform Earnings Withdrawn', 'Transferred to your business account.'); });
}

// ------------ Init ------------
function initializeApp(){
  renderPopularServices();
  renderServiceCategories();
  renderProfessionals();
  renderWorkPortfolio();
  renderRecentProfessionals();

  document.addEventListener('click', handleClicks);
  document.addEventListener('click', handleOverlayClose);
  document.addEventListener('keydown', (e)=> { if (e.key === 'Escape') closeAllModals(); });

  const si = document.getElementById('searchInput');
  const msi = document.getElementById('mobileSearchInput');
  si?.addEventListener('keypress', e => { if (e.key === 'Enter' && si.value.trim()) navigateToService(si.value.trim()); });
  msi?.addEventListener('keypress', e => { if (e.key === 'Enter' && msi.value.trim()) navigateToService(msi.value.trim()); });

  wireForms();
  updateUserInterface();
  switchView('customer');
  detectCityIntoHeader();

  setTimeout(()=> showAlert('Welcome!', 'QuickFix Pro is ready to use.'), 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
