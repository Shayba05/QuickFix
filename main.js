// =======================
// QuickFix Pro - JavaScript
// =======================

// Global variables
let isLoggedIn = false;
let currentUser = null;
let currentLanguage = 'en';
let currentPage = 'customer';

// Service data
const serviceDatabase = {
    'handyman': {
        emoji: '🔧',
        title: 'Handyman Services',
        searchTerms: ['IKEA assembly', 'TV mounting', 'furniture assembly', 'picture hanging', 'curtain installation'],
        keywords: ['handyman', 'ikea', 'assembly', 'furniture', 'tv mount', 'picture', 'curtain']
    },
    'plumbing': {
        emoji: '🚰',
        title: 'Plumbing Services',
        searchTerms: ['leaky tap', 'blocked drain', 'toilet repair', 'pipe burst', 'water heater'],
        keywords: ['plumber', 'plumbing', 'leak', 'tap', 'drain', 'toilet', 'pipe', 'water']
    },
    'electrical': {
        emoji: '⚡',
        title: 'Electrical Services',
        searchTerms: ['ceiling fan repair', 'light fixture', 'outlet installation', 'breaker repair'],
        keywords: ['electrician', 'electrical', 'ceiling fan', 'light', 'outlet', 'breaker']
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
    { name: 'Carpentry', icon: 'fas fa-saw-blade', color: '#A16207', professionals: 423 }
];

const popularServices = [
    { name: 'IKEA assembly', page: 'ikeaAssemblyPage' },
    { name: 'TV mounting', page: 'tvMountingPage' },
    { name: 'Leaky tap', page: 'leakyTapPage' },
    { name: 'AC repair', page: 'acRepairPage' },
    { name: 'Blocked drain', page: 'blockedDrainPage' },
    { name: 'Ceiling fan', page: 'ceilingFanPage' }
];

// Enhanced professionals with qualifications and detailed ratings
const professionals = [
    {
        id: 1,
        name: 'Michael Rodriguez',
        service: 'Master Plumber',
        rating: 4.95,
        reviews: 234,
        price: '$85/hr',
        image: 'https://i.pravatar.cc/150?img=1',
        verified: true,
        responseTime: '< 30 min',
        availability: 'Available Now',
        experience: '12 years',
        completedJobs: 847,
        services: ['plumbing', 'leaky tap', 'blocked drain'],
        qualifications: [
            { type: 'license', text: 'Licensed Master Plumber #MP-2019-4837' },
            { type: 'certification', text: 'EPA Water Quality Certified' },
            { type: 'insurance', text: 'Fully Insured & Bonded' },
            { type: 'specialty', text: 'Emergency Repairs' },
            { type: 'specialty', text: 'Water Heater Specialist' }
        ],
        ratingBreakdown: {
            quality: 4.9,
            punctuality: 4.8,
            communication: 5.0,
            cleanliness: 4.9,
            value: 4.7
        }
    },
    {
        id: 2,
        name: 'Sarah Chen',
        service: 'Licensed Electrician',
        rating: 4.92,
        reviews: 187,
        price: '$95/hr',
        image: 'https://i.pravatar.cc/150?img=2',
        verified: true,
        responseTime: '< 45 min',
        availability: 'Available Today',
        experience: '8 years',
        completedJobs: 623,
        services: ['electrical', 'ceiling fan'],
        qualifications: [
            { type: 'license', text: 'Licensed Electrician #EL-2020-7361' },
            { type: 'certification', text: 'OSHA 10-Hour Safety Certified' },
            { type: 'certification', text: 'Smart Home Technology Certified' },
            { type: 'insurance', text: 'General Liability Insurance' },
            { type: 'specialty', text: 'Smart Home Installations' }
        ],
        ratingBreakdown: {
            quality: 4.9,
            punctuality: 4.9,
            communication: 4.8,
            cleanliness: 5.0,
            value: 4.8
        }
    },
    {
        id: 3,
        name: 'David Thompson',
        service: 'HVAC Specialist',
        rating: 4.88,
        reviews: 156,
        price: '$105/hr',
        image: 'https://i.pravatar.cc/150?img=3',
        verified: true,
        responseTime: '< 1 hour',
        availability: 'Busy until 3 PM',
        experience: '15 years',
        completedJobs: 934,
        services: ['hvac', 'ac repair'],
        qualifications: [
            { type: 'license', text: 'HVAC License #HVAC-2018-9284' },
            { type: 'certification', text: 'EPA 608 Universal Certification' },
            { type: 'certification', text: 'NATE Certified Technician' },
            { type: 'insurance', text: 'Bonded & Insured' },
            { type: 'specialty', text: 'Energy Efficiency Expert' }
        ],
        ratingBreakdown: {
            quality: 4.8,
            punctuality: 4.7,
            communication: 4.9,
            cleanliness: 4.8,
            value: 5.0
        }
    },
    {
        id: 4,
        name: 'James Wilson',
        service: 'Handyman Expert',
        rating: 4.91,
        reviews: 298,
        price: '$75/hr',
        image: 'https://i.pravatar.cc/150?img=4',
        verified: true,
        responseTime: '< 20 min',
        availability: 'Available Now',
        experience: '10 years',
        completedJobs: 1156,
        services: ['handyman', 'ikea assembly', 'tv mounting'],
        qualifications: [
            { type: 'certification', text: 'Professional Assembly Certified' },
            { type: 'certification', text: 'TV Mounting Specialist' },
            { type: 'insurance', text: 'Fully Insured' },
            { type: 'specialty', text: 'IKEA Furniture Expert' },
            { type: 'specialty', text: 'Wall Mounting Specialist' }
        ],
        ratingBreakdown: {
            quality: 4.9,
            punctuality: 4.9,
            communication: 4.8,
            cleanliness: 5.0,
            value: 4.9
        }
    }
];

// =======================
// Core Functions
// =======================

// Core functions with proper event handling
function toggleLanguageMenu(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const menu = document.getElementById('languageMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function setLanguage(code, name, flag, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    currentLanguage = code;
    const currentLangEl = document.getElementById('currentLang');
    if (currentLangEl) {
        currentLangEl.textContent = code.toUpperCase();
    }
    
    // Update active language in dropdown
    document.querySelectorAll('.language-item').forEach(item => {
        item.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    toggleLanguageMenu();
    showAlert('Language Changed', `Language changed to ${name} ${flag}`);
}

const GOOGLE_CLIENT_ID = '1005892265458-ne6o9c4n8606sov7e1lr0acicvcbeb4e.apps.googleusercontent.com';
const AUTHORIZED_ORIGIN = 'https://quick-fix-eight.vercel.app'; // Your production URL

// Modal open/close with animation and accessibility
function openModal(modalId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  closeAllModals(() => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.add('show');
        // Focus first focusable element inside modal
        const focusable = modal.querySelector('input, button, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();

        if (modalId === 'signupModal') {
          initGoogleSignInButtonSignup();
        } else if (modalId === 'loginModal') {
          initGoogleSignInButtonLogin();
        }
      }, 10);
    }
  });
}

function closeModal(modalId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
}

function closeAllModals(callback) {
  const modals = [
    'loginModal',
    'signupModal',
    'userMenuModal',
    'searchModal',
    'workUploadModal',
    'withdrawModal',
    'adminWithdrawModal'
  ];
  let closedCount = 0;
  const total = modals.length;

  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.classList.add('hidden');
        closedCount++;
        if (closedCount === total && typeof callback === 'function') callback();
      }, 300);
    } else {
      closedCount++;
      if (closedCount === total && typeof callback === 'function') callback();
    }
  });

  if (closedCount === total && typeof callback === 'function') callback();
}

// Signup form submission handler with extra fields & account type logic
function signupUser(event) {
  event.preventDefault();

  const accountType = document.getElementById('account-type').value;
  const dob = document.getElementById('dob').value;
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const address = document.getElementById('address').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!accountType) {
    alert('Please select an account type.');
    return;
  }

  // TODO: Add validation & backend signup API call here
  console.log('Signup data:', { accountType, dob, phone, email, address, password });
  alert(`Account created for ${email} as ${accountType}`);

  if (accountType === 'professional') {
    window.location.href = '/professional-upload.html'; // Adjust as needed
  } else {
    window.location.href = '/home.html'; // Adjust as needed
  }
}

// Login form submission handler
function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  console.log('Login attempt:', email, password);
  alert(`Logging in with email: ${email}`);
  // TODO: Replace with backend login API call
}

// Google Sign-In initialization for Signup Modal
function initGoogleSignInButtonSignup() {
  if (!window.google || !document.getElementById('googleSignInBtnSignup')) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleSignupCredentialResponse,
    context: 'signin',
  });

  const container = document.getElementById('googleSignInBtnSignup');
  container.innerHTML = ''; // Clear old buttons

  google.accounts.id.renderButton(
    container,
    { theme: 'outline', size: 'large', width: 280 }
  );

  google.accounts.id.prompt(); // Optional One Tap
}

// Google Sign-In initialization for Login Modal
function initGoogleSignInButtonLogin() {
  if (!window.google || !document.getElementById('googleSignInBtnLogin')) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleLoginCredentialResponse,
    context: 'signin',
  });

  const container = document.getElementById('googleSignInBtnLogin');
  container.innerHTML = ''; // Clear old buttons

  google.accounts.id.renderButton(
    container,
    { theme: 'outline', size: 'large', width: 280 }
  );

  google.accounts.id.prompt(); // Optional One Tap
}

// Google Login response handler
function handleGoogleLoginCredentialResponse(response) {
  console.log('Google Login JWT token:', response.credential);
  alert('Google Login successful! Check console for token.');
  // TODO: Send token to backend for verification & authentication
}

// Google Signup response handler
function handleGoogleSignupCredentialResponse(response) {
  console.log('Google Signup JWT token:', response.credential);
  alert('Google Signup successful! Check console for token.');
  // TODO: Send token to backend for verification & registration
}




// =======================
// Navigation Functions
// =======================

function switchView(view, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    currentPage = view;
    
    // Hide all main views and service pages
    const allViews = ['customerView', 'professionalView', 'adminView'];
    const allServicePages = ['ikeaAssemblyPage', 'tvMountingPage', 'leakyTapPage', 'acRepairPage', 'blockedDrainPage', 'ceilingFanPage'];
    
    allViews.forEach(viewId => {
        const element = document.getElementById(viewId);
        if (element) element.classList.add('hidden');
    });
    
    allServicePages.forEach(pageId => {
        const element = document.getElementById(pageId);
        if (element) element.classList.add('hidden');
    });

    // Show selected view
    const targetView = document.getElementById(view + 'View');
    if (targetView) targetView.classList.remove('hidden');

    // Hide back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.classList.add('hidden');

    // Update desktop navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    });
    const activeBtn = document.getElementById(view + 'Btn');
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline');
        activeBtn.classList.add('btn-primary');
    }

    // Update mobile navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const mobileBtn = document.getElementById('mobile' + view.charAt(0).toUpperCase() + view.slice(1));
    if (mobileBtn) mobileBtn.classList.add('active');

    closeAllModals();
}

// =======================
// Service Navigation Functions
// =======================

function navigateToService(serviceName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const serviceMap = {
        'IKEA assembly': 'ikeaAssemblyPage',
        'TV mounting': 'tvMountingPage',
        'Leaky tap': 'leakyTapPage',
        'AC repair': 'acRepairPage',
        'Blocked drain': 'blockedDrainPage',
        'Ceiling fan': 'ceilingFanPage'
    };

    const pageId = serviceMap[serviceName];
    if (pageId) {
        showServicePage(pageId);
        closeAllModals();
    }
}

function showServicePage(pageId) {
    // Hide all views
    const allViews = ['customerView', 'professionalView', 'adminView'];
    const allServicePages = ['ikeaAssemblyPage', 'tvMountingPage', 'leakyTapPage', 'acRepairPage', 'blockedDrainPage', 'ceilingFanPage'];
    
    allViews.forEach(viewId => {
        const element = document.getElementById(viewId);
        if (element) element.classList.add('hidden');
    });
    
    allServicePages.forEach(pageId => {
        const element = document.getElementById(pageId);
        if (element) element.classList.add('hidden');
    });

    // Show selected service page
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');

    // Show back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.classList.remove('hidden');

    // Render professionals for this service
    renderServiceProfessionals(pageId);
}

function goBackToHome() {
    switchView('customer');
}

// =======================
// User Authentication Functions
// =======================

function loginUser(event) {
    if (event) event.preventDefault();
    isLoggedIn = true;
    currentUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'JD'
    };
    updateUserInterface();
    closeModal('loginModal');
    showAlert('Welcome Back!', 'You have successfully signed in to your QuickFix Pro account.');
}

function signupUser(event) {
    if (event) event.preventDefault();
    isLoggedIn = true;
    currentUser = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        avatar: 'JS'
    };
    updateUserInterface();
    closeModal('signupModal');
    showAlert('Account Created!', 'Welcome to QuickFix Pro! Your account has been created successfully.');
}

function logoutUser(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    isLoggedIn = false;
    currentUser = null;
    updateUserInterface();
    closeModal('userMenuModal');
    showAlert('Signed Out', 'You have been successfully signed out of your account.');
}

function updateUserInterface() {
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarLarge = document.getElementById('userAvatarLarge');
    const userNameLarge = document.getElementById('userNameLarge');
    const userStatusLarge = document.getElementById('userStatusLarge');
    const guestUserMenu = document.getElementById('guestUserMenu');
    const loggedUserMenu = document.getElementById('loggedUserMenu');

    if (isLoggedIn && currentUser) {
        if (userAvatar) userAvatar.innerHTML = currentUser.avatar;
        if (userAvatarLarge) userAvatarLarge.innerHTML = currentUser.avatar;
        if (userNameLarge) userNameLarge.textContent = currentUser.name;
        if (userStatusLarge) userStatusLarge.textContent = currentUser.email;
        if (guestUserMenu) guestUserMenu.classList.add('hidden');
        if (loggedUserMenu) loggedUserMenu.classList.remove('hidden');
    } else {
        if (userAvatar) userAvatar.innerHTML = '<i class="fas fa-user"></i>';
        if (userAvatarLarge) userAvatarLarge.innerHTML = '<i class="fas fa-user"></i>';
        if (userNameLarge) userNameLarge.textContent = 'Guest User';
        if (userStatusLarge) userStatusLarge.textContent = 'Not signed in';
        if (guestUserMenu) guestUserMenu.classList.remove('hidden');
        if (loggedUserMenu) loggedUserMenu.classList.add('hidden');
    }
}

// =======================
// Search Functions
// =======================

function executeSearchFromInput(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const query = searchInput.value.trim();
        if (query) navigateToService(query);
    }
}

function executeSearchFromMobileInput(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
        const query = mobileSearchInput.value.trim();
        if (query) navigateToService(query);
    }
}

function executeSearch(query, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!query || query.trim() === '') return;
    
    // If it's a popular service, navigate to its page
    const service = popularServices.find(s => s.name.toLowerCase() === query.toLowerCase());
    if (service) {
        navigateToService(service.name);
    } else {
        showAlert('Search Results', `Found ${Math.floor(Math.random() * 50) + 10} professionals for "${query}"`);
    }
}

// =======================
// Form Submission Functions
// =======================

function addWork(event) {
    if (event) event.preventDefault();
    closeModal('workUploadModal');
    showAlert('Work Added!', 'Your project has been successfully added to your portfolio.');
}

function processWithdrawal(event) {
    if (event) event.preventDefault();
    closeModal('withdrawModal');
    showAlert('Withdrawal Initiated', 'Your withdrawal request has been submitted and will be processed within 1-2 business days.');
}

function processAdminWithdrawal(event) {
    if (event) event.preventDefault();
    closeModal('adminWithdrawModal');
    showAlert('Platform Earnings Withdrawn', 'Platform earnings have been transferred to your business account.');
}

// =======================
// Render Functions
// =======================

function renderPopularServices() {
    const container = document.getElementById('popularServices');
    if (!container) return;
    
    container.innerHTML = popularServices.map((service, index) => `
        <button onclick="navigateToService('${service.name}', event)" 
                class="card card-interactive text-center min-h-[80px] md:min-h-[100px] flex flex-col items-center justify-center hover:border-primary animate-scale-in"
                style="animation-delay: ${index * 0.1}s;">
            <i class="fas fa-tools text-xl md:text-2xl text-primary mb-2 animate-float" style="animation-delay: ${index * 0.2}s;"></i>
            <span class="font-bold text-sm md:text-base text-gray-800">${service.name}</span>
        </button>
    `).join('');
}

function renderServiceCategories() {
    const container = document.getElementById('serviceCategories');
    if (!container) return;
    
    container.innerHTML = serviceCategories.map((category, index) => `
        <div class="card card-interactive text-center hover:border-primary animate-scale-in" 
             onclick="executeSearch('${category.name.toLowerCase()}', event)"
             style="animation-delay: ${index * 0.1}s;">
            <div class="service-icon mx-auto mb-3" style="background: ${category.color};">
                <i class="${category.icon}"></i>
            </div>
            <h3 class="font-bold text-sm md:text-base mb-1 text-gray-800">${category.name}</h3>
            <p class="text-xs md:text-sm text-gray-600">${category.professionals} professionals</p>
        </div>
    `).join('');
}

function renderProfessionals() {
    const container = document.getElementById('featuredProfessionals');
    if (!container) return;
    
    container.innerHTML = professionals.slice(0, 3).map((pro, index) => renderProfessionalCard(pro, index)).join('');
}

function renderProfessionalCard(pro, index = 0) {
    return `
        <div class="professional-card card card-interactive hover:border-primary animate-slide-up" 
             style="animation-delay: ${index * 0.15}s;">
            <div class="flex items-start mb-4">
                <div class="avatar-container">
                    <img src="${pro.image}" alt="${pro.name}" class="w-14 h-14 md:w-16 md:h-16 rounded-lg mr-3 border-2 border-gray-200 flex-shrink-0">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center mb-1">
                        <h3 class="font-bold text-base md:text-lg mr-2 truncate text-gray-800">${pro.name}</h3>
                        ${pro.verified ? '<i class="fas fa-check-circle text-secondary flex-shrink-0 animate-bounce-gentle" title="Verified Professional"></i>' : ''}
                    </div>
                    <p class="text-gray-600 mb-2 text-sm font-medium">${pro.service}</p>
                    <div class="flex items-center mb-2">
                        <div class="rating-stars mr-2">
                            ${[...Array(5)].map((_, i) => `<i class="star fas fa-star ${i < Math.floor(pro.rating) ? 'text-yellow-500' : 'text-gray-300'} text-xs"></i>`).join('')}
                        </div>
                        <span class="text-sm font-bold">${pro.rating}</span>
                        <span class="text-gray-500 text-xs ml-1">(${pro.reviews})</span>
                    </div>
                    <div class="text-xs text-gray-600">
                        <div class="mb-1">
                            <i class="fas fa-clock mr-1 text-primary"></i>${pro.responseTime}
                        </div>
                        <div class="mb-1">
                            <i class="fas fa-calendar mr-1 text-secondary"></i>${pro.availability}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center justify-between mb-4">
                <span class="text-xl md:text-2xl font-black text-primary">${pro.price}</span>
                <div class="text-right">
                    <div class="text-xs text-gray-500">Starting from</div>
                </div>
            </div>
            
            <div class="flex space-x-2">
                <button class="btn-base btn-outline flex-1 text-sm" onclick="event.stopPropagation()">
                    View Profile
                </button>
                <button class="btn-base btn-primary flex-1 text-sm" onclick="event.stopPropagation()">
                    Book Now
                </button>
            </div>
        </div>
    `;
}

function renderServiceProfessionals(pageId) {
    const serviceType = pageId.replace('Page', '').toLowerCase();
    const relevantProfessionals = professionals.filter(pro => 
        pro.services.some(service => serviceType.includes(service) || service.includes(serviceType))
    );

    const containerMappings = {
        'ikeaassemblypage': 'ikeaAssemblyProfessionals',
        'tvmountingpage': 'tvMountingProfessionals', 
        'leakytappage': 'leakyTapProfessionals',
        'acrepairpage': 'acRepairProfessionals',
        'blockeddrainpage': 'blockedDrainProfessionals',
        'ceilingfanpage': 'ceilingFanProfessionals'
    };

    const containerId = containerMappings[pageId.toLowerCase()];
    const container = document.getElementById(containerId);
    
    if (container && relevantProfessionals.length > 0) {
        container.innerHTML = relevantProfessionals.map(pro => `
            <div class="service-professional" onclick="event.stopPropagation()">
                <img src="${pro.image}" alt="${pro.name}" class="w-16 h-16 rounded-full mr-4 border-2 border-gray-200">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <h3 class="font-bold text-lg mr-2">${pro.name}</h3>
                        ${pro.verified ? '<i class="fas fa-check-circle text-secondary"></i>' : ''}
                    </div>
                    <p class="text-gray-600 mb-2">${pro.service}</p>
                    <div class="flex items-center mb-2">
                        <div class="rating-stars mr-2">
                            ${[...Array(5)].map((_, i) => `<i class="star fas fa-star ${i < Math.floor(pro.rating) ? 'text-yellow-500' : 'text-gray-300'}"></i>`).join('')}
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
}

function renderWorkPortfolio() {
    const container = document.getElementById('workPortfolio');
    if (!container) return;
    
    const portfolioItems = [
        { title: 'Modern Kitchen Renovation', category: 'Plumbing', duration: '6 hours', cost: '$480', image: 'https://picsum.photos/400/300?random=1', rating: '5.0' },
        { title: 'Smart Bathroom Installation', category: 'Plumbing', duration: '2 days', cost: '$1,250', image: 'https://picsum.photos/400/300?random=2', rating: '4.9' },
        { title: 'Complete Home Automation', category: 'Electrical', duration: '8 hours', cost: '$950', image: 'https://picsum.photos/400/300?random=3', rating: '5.0' }
    ];

    container.innerHTML = portfolioItems.map((item, index) => `
        <div class="card card-interactive overflow-hidden hover:border-primary animate-scale-in"
             style="animation-delay: ${index * 0.1}s;" onclick="event.stopPropagation()">
            <img src="${item.image}" alt="${item.title}" class="w-full h-32 md:h-40 object-cover mb-3 rounded-lg">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-sm md:text-base truncate mr-2 text-gray-800">${item.title}</h4>
                <span class="text-xs bg-gradient-to-r from-primary to-primary-light text-white px-2 py-1 rounded-full font-semibold">${item.category}</span>
            </div>
            <div class="flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    <div><i class="fas fa-clock mr-1"></i>${item.duration}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-secondary text-base">${item.cost}</div>
                    <div class="text-xs text-yellow-500">★ ${item.rating}</div>
                </div>
            </div>
        </div>
    `).join('');
}
// =======================
// Render Recent Professionals
// =======================

function renderRecentProfessionals() {
    const container = document.getElementById('recentProfessionals');
    if (!container) return;
    
    container.innerHTML = professionals.slice(0, 6).map((pro, index) => `
        <div class="card hover:border-primary animate-slide-up" style="animation-delay: ${index * 0.1}s;" onclick="event.stopPropagation()">
            <div class="flex items-center">
                <img src="${pro.image}" alt="${pro.name}" class="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 border-2 border-gray-200 flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm truncate text-gray-800">${pro.name}</div>
                    <div class="text-xs text-gray-600 mb-1">${pro.service}</div>
                    <div class="flex items-center">
                        <span class="text-xs text-yellow-500 mr-1">★ ${pro.rating}</span>
                        <span class="text-xs text-gray-500">(${pro.reviews})</span>
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="font-bold text-primary text-sm">${pro.price}</div>
                    <div class="text-xs text-emerald-600">${pro.availability}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// =======================
// Alert Function
// =======================

function showAlert(title, message) {
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
            <button onclick="this.closest('div').remove()" class="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 transition-colors">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 5000);
}

// =======================
// Event Listeners Setup
// =======================

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                navigateToService(searchInput.value.trim());
            }
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && mobileSearchInput.value.trim()) {
                navigateToService(mobileSearchInput.value.trim());
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // Close modals when clicking on overlay
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
        
        // Close language menu when clicking outside
        if (!e.target.closest('.language-dropdown')) {
            const langMenu = document.getElementById('languageMenu');
            if (langMenu) langMenu.classList.remove('show');
        }
    });

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// =======================
// Initialize App
// =======================

function initializeApp() {
    renderPopularServices();
    renderServiceCategories();
    renderProfessionals();
    renderWorkPortfolio();
    renderRecentProfessionals();
    setupEventListeners();
    updateUserInterface();
    switchView('customer');
    
    console.log('QuickFix Pro initialized successfully!');
}

// =======================
// Google Sign-In Handler
// =======================

function handleCredentialResponse(response) {
  console.log('Google Credential Response:', response);
  alert('Google sign-in successful! Implement your account creation flow here.');
  // Here you can decode the credential and send it to your backend to create/login the user
}

// =======================
// Start App and Google Sign-In Initialization
// =======================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

document.addEventListener('DOMContentLoaded', () => {
  google.accounts.id.initialize({
    client_id: 1005892265458-ne6o9c4n8606sov7e1lr0acicvcbeb4e.apps.googleusercontent.com, // Replace with your actual client ID
    callback: handleCredentialResponse,
  });

  // Render the Google Sign-In button inside the container with id 'googleSignInBtn'
  google.accounts.id.renderButton(
    document.getElementById('googleSignInBtn'),
    { theme: 'outline', size: 'large' }
  );

  // Optionally prompt the user automatically
  // google.accounts.id.prompt();
});

