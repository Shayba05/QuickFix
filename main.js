// QuickFix Pro - Enhanced with Job Booking and Professional Availability
console.log('QuickFix Pro starting...');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYlkzJFlUWEACtLZ_scg_XWSt5fkv0cGM",
  authDomain: "quickfix-cee4a.firebaseapp.com",
  projectId: "quickfix-cee4a",
  storageBucket: "quickfix-cee4a.appspot.com",
  messagingSenderId: "1075514949479",
  appId: "1:1075514949479:web:83906b6cd54eeaa48cb9c2",
  measurementId: "G-XS4LDTFRSH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Firestore settings to handle offline/network issues
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence (helps with network issues)
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not available in this browser');
    }
  });

// Global variables
let currentUser = null;
let userSettings = {};
let selectedPhoto = null;
let currentHelpSection = 'overview';
let selectedRating = 0;
let initialAuthComplete = false;
let pendingProfessionalSwitch = false;
let isOnline = navigator.onLine;
let mockBookingHistory = [];
let mockPaymentMethods = [];
let selectedJobPhotos = [];
let selectedTimeSlot = null;
let currentBookingProfessional = null;
let professionalAvailability = {};

// Mobile Intro Carousel Variables
let isFirstVisit = true;
let currentSlide = 0;
const totalSlides = 4;

// Network status monitoring
window.addEventListener('online', () => {
  isOnline = true;
  console.log('Back online');
  toast('Connection restored', 'success', 2000);
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('Gone offline');
  toast('Working offline', 'info', 2000);
});

// Dark Mode Detection
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

// Initialize mock data
function initializeMockData() {
  // Mock booking history data
  mockBookingHistory = [
    {
      id: 'BK001',
      date: '2024-01-15',
      service: 'Plumbing Repair',
      professional: 'John Smith',
      amount: 125.00,
      status: 'completed',
      rating: 5,
      details: 'Fixed kitchen sink leak'
    },
    {
      id: 'BK002',
      date: '2024-01-08',
      service: 'TV Mounting',
      professional: 'Mike Johnson',
      amount: 85.00,
      status: 'completed',
      rating: 4,
      details: '65" TV mounted on living room wall'
    },
    {
      id: 'BK003',
      date: '2024-01-03',
      service: 'IKEA Assembly',
      professional: 'Sarah Williams',
      amount: 95.00,
      status: 'completed',
      rating: 5,
      details: 'Assembled bedroom furniture set'
    },
    {
      id: 'BK004',
      date: '2023-12-28',
      service: 'Electrical Work',
      professional: 'David Brown',
      amount: 180.00,
      status: 'completed',
      rating: 5,
      details: 'Installed new ceiling fan'
    },
    {
      id: 'BK005',
      date: '2023-12-20',
      service: 'AC Repair',
      professional: 'Lisa Garcia',
      amount: 220.00,
      status: 'completed',
      rating: 4,
      details: 'Fixed heating system issue'
    },
    {
      id: 'BK006',
      date: '2023-12-15',
      service: 'House Cleaning',
      professional: 'Clean Team Pro',
      amount: 150.00,
      status: 'cancelled',
      rating: null,
      details: 'Deep cleaning service'
    },
    {
      id: 'BK007',
      date: '2023-11-30',
      service: 'Handyman Service',
      professional: 'Tony Martinez',
      amount: 75.00,
      status: 'completed',
      rating: 5,
      details: 'Fixed multiple small issues'
    },
    {
      id: 'BK008',
      date: '2023-11-22',
      service: 'Carpet Cleaning',
      professional: 'Pro Cleaners',
      amount: 120.00,
      status: 'completed',
      rating: 4,
      details: 'Living room and bedroom carpets'
    }
  ];

  // Mock payment methods data
  mockPaymentMethods = [
    {
      id: 'PM001',
      type: 'visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '2026',
      holderName: 'John Doe',
      isDefault: true,
      addedDate: '2023-06-15'
    },
    {
      id: 'PM002',
      type: 'mastercard',
      last4: '8888',
      expiryMonth: '08',
      expiryYear: '2025',
      holderName: 'John Doe',
      isDefault: false,
      addedDate: '2023-03-20'
    },
    {
      id: 'PM003',
      type: 'amex',
      last4: '1234',
      expiryMonth: '05',
      expiryYear: '2027',
      holderName: 'John Doe',
      isDefault: false,
      addedDate: '2024-01-10'
    }
  ];

  // Mock professional availability
  professionalAvailability = {
    'john-smith': {
      monday: { available: true, start: '09:00', end: '17:00' },
      tuesday: { available: true, start: '09:00', end: '17:00' },
      wednesday: { available: true, start: '09:00', end: '17:00' },
      thursday: { available: true, start: '09:00', end: '17:00' },
      friday: { available: true, start: '09:00', end: '17:00' },
      saturday: { available: false, start: '09:00', end: '17:00' },
      sunday: { available: false, start: '09:00', end: '17:00' },
      breakTime: { enabled: true, start: '12:00', end: '13:00' },
      minAdvance: 1,
      maxAdvance: 30
    }
  };

  // Set minimum date for booking (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const dateInput = document.getElementById('preferredDate');
  if (dateInput) {
    dateInput.min = minDate;
  }
}

// Helper functions
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function show(element) {
  if (element) element.classList.remove('hidden');
}

function hide(element) {
  if (element) element.classList.add('hidden');
}

function toast(message, type = 'success', duration = 3000) {
  console.log(`Toast: ${message} (${type})`);
  const toastEl = $('#toast');
  if (!toastEl) return;
  
  toastEl.textContent = message;
  toastEl.className = '';
  toastEl.id = 'toast';
  toastEl.classList.add('show', type);
  show(toastEl);
  
  setTimeout(() => {
    toastEl.classList.remove('show');
    hide(toastEl);
  }, duration);
}

// Enhanced Firestore error handling
function handleFirestoreError(error, operation = 'operation') {
  console.error(`Firestore ${operation} error:`, error);
  
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
    if (!isOnline) {
      toast('Saved locally - will sync when online', 'info');
    } else {
      toast('Connection issue - retrying...', 'warning', 2000);
    }
  } else if (error.code === 'permission-denied') {
    toast('Permission denied', 'error');
  } else if (error.code === 'not-found') {
    console.log(`Document not found for ${operation}`);
  } else {
    // Don't show generic network errors to users
    console.log(`${operation} will retry automatically`);
  }
}

// Enhanced Firestore operations with error handling
async function safeFirestoreWrite(operation, fallbackMessage) {
  try {
    await operation();
  } catch (error) {
    handleFirestoreError(error, 'write');
    if (fallbackMessage && !isOnline) {
      toast(fallbackMessage, 'info');
    }
  }
}

async function safeFirestoreRead(operation, fallbackAction) {
  try {
    return await operation();
  } catch (error) {
    handleFirestoreError(error, 'read');
    if (fallbackAction) {
      return fallbackAction();
    }
    return null;
  }
}

// Mobile Intro Carousel Functions
function showSlide(slideIndex) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    // Remove active class from all slides and dots
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === slideIndex) {
            slide.classList.add('active');
        }
    });
    
    dots.forEach((dot, index) => {
        dot.classList.remove('active');
        if (index === slideIndex) {
            dot.classList.add('active');
        }
    });
    
    currentSlide = slideIndex;
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(currentSlide);
}

function enterMainApp() {
  const mobileIntro = document.getElementById('mobileIntro');
  mobileIntro.style.display = 'none';
  localStorage.setItem('hasSeenIntro', 'true');

  // unlock page scroll
  document.documentElement.classList.remove('no-scroll');
  document.body.classList.remove('no-scroll');

  document.body.style.overflow = 'auto';
  toast('Welcome to QuickFix Pro!', 'success');
}


// Auto-advance carousel
function startCarouselAutoAdvance() {
  if (window.innerWidth <= 768) {
    const intro = document.getElementById('mobileIntro');
    if (!intro) return;
    setInterval(() => {
      if (intro && intro.style.display !== 'none') {
        nextSlide();
      }
    }, 4000);
  }
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    const isActive = mobileMenu.classList.contains('active');
    
    if (isActive) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    mobileMenu.classList.add('active');
    mobileMenuOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    mobileMenu.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Main functions - WORKING!
function goHome() {
  console.log('Go home clicked');
  if (currentUser && userSettings.role === 'professional') {
    switchView('professional');
  } else {
    switchView('customer');
  }
}

function switchView(viewName) {
  console.log('Switch view:', viewName);
  
  // Hide all views
  $$('#customerView, #professionalView, #adminView, #settingsView, #helpView, #howItWorksView, #algoliaResults').forEach(hide);
  
  // Show target view
  const targetView = $(`#${viewName}View`);
  if (targetView) {
    show(targetView);
  }
  
  // Update header nav buttons
  $$('.nav-btn').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
  });
  
  if (viewName === 'customer') {
    $('#customerBtn')?.classList.remove('btn-outline');
    $('#customerBtn')?.classList.add('btn-primary');
  } else if (viewName === 'professional') {
    $('#professionalBtn')?.classList.remove('btn-outline');
    $('#professionalBtn')?.classList.add('btn-primary');
  } else if (viewName === 'admin') {
    $('#adminBtn')?.classList.remove('btn-outline');
    $('#adminBtn')?.classList.add('btn-primary');
  } else if (viewName === 'howItWorks') {
    $('#howItWorksBtn')?.classList.remove('btn-outline');
    $('#howItWorksBtn')?.classList.add('btn-primary');
  }
  
  // Update mobile nav
  $$('.mobile-nav .nav-item').forEach(item => item.classList.remove('active'));
  if (viewName === 'customer') $('#mobileCustomer')?.classList.add('active');
  if (viewName === 'professional') $('#mobileProfessional')?.classList.add('active');
  if (viewName === 'admin') $('#mobileAdmin')?.classList.add('active');
  
  // Close mobile menu if open
  closeMobileMenu();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// How It Works Functions
function showHowItWorksSection(sectionType) {
  console.log('Show how it works section:', sectionType);
  
  // Update tab buttons
  $('#customerTabBtn').classList.remove('btn-primary');
  $('#customerTabBtn').classList.add('btn-outline');
  $('#professionalTabBtn').classList.remove('btn-primary');
  $('#professionalTabBtn').classList.add('btn-outline');
  
  if (sectionType === 'customer') {
    $('#customerTabBtn').classList.remove('btn-outline');
    $('#customerTabBtn').classList.add('btn-primary');
    show($('#customerGuide'));
    hide($('#professionalGuide'));
  } else {
    $('#professionalTabBtn').classList.remove('btn-outline');
    $('#professionalTabBtn').classList.add('btn-primary');
    hide($('#customerGuide'));
    show($('#professionalGuide'));
  }
}

function openModal(modalId) {
  console.log('Open modal:', modalId);
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  // Special handling for specific modals
  if (modalId === 'bookingHistoryModal') {
    loadBookingHistory();
  } else if (modalId === 'paymentMethodsModal') {
    loadPaymentMethods();
  } else if (modalId === 'availabilityModal') {
    loadCurrentAvailability();
  }
  
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('show');
  });
  
  // Close mobile menu if open
  closeMobileMenu();
}

function closeModal(modalId) {
  console.log('Close modal:', modalId);
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('show');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 200);
}

function swapModal(closeModalId, openModalId) {
  console.log('Swap modal:', closeModalId, '->', openModalId);
  closeModal(closeModalId);
  setTimeout(() => {
    openModal(openModalId);
  }, 200);
}

function doSearch(query) {
  console.log('Search:', query);
  query = (query || '').trim();
  if (!query) return;
  
  hide($('#customerView'));
  hide($('#professionalView'));
  hide($('#adminView'));
  hide($('#settingsView'));
  hide($('#helpView'));
  hide($('#howItWorksView'));
  show($('#algoliaResults'));
  $('#algoliaResultsList').innerHTML = `
    <div class="card">
      <h3 class="font-bold mb-2">Search Results for: "${query}"</h3>
      <p class="text-gray-600">This is a placeholder for search results. In a real app, this would show professionals and services matching your search.</p>
    </div>`;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectRole(role) {
  console.log('Select role:', role);
  $$('.user-type-card').forEach(card => card.classList.remove('selected'));

  // Find the radio by its value and mark its card
  const input = document.querySelector(`input[name="accountRole"][value="${role}"]`);
  if (input) {
    input.checked = true;
    const card = input.closest('.user-type-card');
    if (card) card.classList.add('selected');
  }
}


function openSettings() {
  console.log('Open settings');
  closeModal('userMenuModal');
  switchView('settings');
}

function openHelpSupport() {
  console.log('Open help & support');
  closeModal('userMenuModal');
  switchView('help');
}

function handleLogout() {
  console.log('Logout clicked');
  auth.signOut()
    .then(() => {
      toast('Signed out successfully');
      closeModal('userMenuModal');
      switchView('customer');
    })
    .catch((error) => {
      console.error('Logout error:', error);
      toast('Error signing out', 'error');
    });
}

function handleLogin(event) {
  event.preventDefault();
  console.log('Login form submitted');
  
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  
  if (!email || !password) {
    toast('Please enter email and password', 'error');
    return;
  }
  
  const btn = $('#loginSubmitBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
  btn.disabled = true;
  
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      toast('Welcome back!');
      closeModal('loginModal');
      $('#login-email').value = '';
      $('#login-password').value = '';
      $('#login-message').textContent = '';
    })
    .catch((error) => {
      console.error('Login error:', error);
      toast(error.message || 'Login failed', 'error');
      $('#login-message').textContent = error.message || 'Login failed';
    })
    .finally(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
}

function handleSignup(event) {
  event.preventDefault();
  console.log('Signup form submitted');
  
  const firstName = $('#firstName').value.trim();
  const lastName = $('#lastName').value.trim();
  const email = $('#emailAddress').value.trim();
  const phone = $('#phoneNumber').value.trim();
  const dob = $('#dateOfBirth').value;
  const password = $('#password').value;
  const confirmPassword = $('#confirmPassword').value;
  const role = document.querySelector('input[name="accountRole"]:checked')?.value || 'customer';
  const agreeTerms = $('#agreeTerms').checked;
  
  // Clear previous error messages
  $('#signup-message').textContent = '';
  
  // Validation
  if (!firstName || !lastName || !email || !phone || !dob || !password) {
    toast('Please fill in all required fields', 'error');
    $('#signup-message').textContent = 'Please fill in all required fields';
    return;
  }
  
  if (password !== confirmPassword) {
    toast('Passwords do not match', 'error');
    $('#signup-message').textContent = 'Passwords do not match';
    return;
  }
  
  if (password.length < 6) {
    toast('Password must be at least 6 characters', 'error');
    $('#signup-message').textContent = 'Password must be at least 6 characters';
    return;
  }
  
  if (!agreeTerms) {
    toast('Please agree to the Terms of Service and Privacy Policy', 'error');
    $('#signup-message').textContent = 'Please agree to the Terms of Service and Privacy Policy';
    return;
  }
  
  // Validate age (must be 18+)
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 18) {
    toast('You must be at least 18 years old to create an account', 'error');
    $('#signup-message').textContent = 'You must be at least 18 years old to create an account';
    return;
  }
  
  const btn = $('#signupSubmitBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...';
  btn.disabled = true;
  
  auth.createUserWithEmailAndPassword(email, password)
    .then(({ user }) => {
      const displayName = `${firstName} ${lastName}`;
      
      // Update profile
      return user.updateProfile({ displayName: displayName }).then(() => {
        // Save user data to Firestore with enhanced error handling
        return safeFirestoreWrite(() => 
          db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: displayName,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            dateOfBirth: dob,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }), 
          'Account created - profile will sync when online'
        );
      });
    })
    .then(() => {
      toast('Account created successfully!');
      closeModal('signupModal');
      
      // Clear form
      $('#signupForm').reset();
      $$('.user-type-card').forEach(card => card.classList.remove('selected'));
      $('#roleUser').checked = true;
      $('#roleUser').closest('.user-type-card').classList.add('selected');
      
      // If professional, flag for switch after auth completes
      if (role === 'professional') {
        pendingProfessionalSwitch = true;
      }
    })
    .catch((error) => {
      console.error('Signup error:', error);
      let errorMessage = 'Account creation failed';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast(errorMessage, 'error');
      $('#signup-message').textContent = errorMessage;
    })
    .finally(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
}

function handleGoogleSignup() {
  console.log('Google signup clicked');
  
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      const isNewUser = result.additionalUserInfo.isNewUser;
      
      if (isNewUser) {
        // New user - save to Firestore
        const names = user.displayName ? user.displayName.split(' ') : ['', ''];
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';
        
        return safeFirestoreWrite(() =>
          db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            firstName: firstName,
            lastName: lastName,
            photoURL: user.photoURL,
            role: 'customer', // Default to customer for Google signup
            provider: 'google',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }),
          'Account created - profile will sync when online'
        ).then(() => {
          toast('Account created successfully with Google!');
          closeModal('signupModal');
        });
      } else {
        toast('Signed in successfully with Google!');
        closeModal('signupModal');
      }
    })
    .catch((error) => {
      console.error('Google signup error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup, don't show error
        return;
      }
      
      let errorMessage = 'Google sign up failed';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast(errorMessage, 'error');
    });
}

function startPasswordReset() {
  console.log('Password reset clicked');
  const email = $('#login-email').value.trim();
  if (!email) {
    toast('Please enter your email address first', 'error');
    return;
  }
  
  auth.sendPasswordResetEmail(email)
    .then(() => {
      toast('Password reset email sent');
    })
    .catch((error) => {
      toast(error.message || 'Failed to send reset email', 'error');
    });
}

function sendPasswordReset() {
  console.log('Send password reset');
  if (!currentUser?.email) {
    toast('Please sign in first', 'error');
    return;
  }
  
  auth.sendPasswordResetEmail(currentUser.email)
    .then(() => {
      toast('Password reset email sent to ' + currentUser.email);
    })
    .catch((error) => {
      toast(error.message || 'Failed to send reset email', 'error');
    });
}

function showMyProfile() {
  console.log('Show my profile clicked');
  toast('Profile feature coming soon!', 'info');
}

// Book Professional Functions
function bookProfessional(professionalName, service = 'General Service') {
  console.log('Book professional:', professionalName);
  
  if (!currentUser) {
    toast('Please sign in to book services', 'error');
    openModal('loginModal');
    return;
  }
  
  currentBookingProfessional = {
    name: professionalName,
    service: service
  };
  
  // Update booking modal title
  $('#bookingProfessionalInfo').textContent = `Book ${service} with ${professionalName}`;
  
  // Clear form
  resetBookingForm();
  
  openModal('bookProfessionalModal');
}

function openBookingModal(professionalId) {
    const modal = document.getElementById('bookProfessionalModal');
    const infoElement = document.getElementById('bookingProfessionalInfo');
    
    // Mock professional data
    const professional = {
        1: { name: 'Mike Johnson', service: 'Master Plumber' },
        2: { name: 'Sarah Davis', service: 'Professional Handywoman' },
        3: { name: 'David Wilson', service: 'Licensed Electrician' }
    }[professionalId] || { name: 'Professional', service: 'Service Provider' };
    
    if (infoElement) {
        infoElement.textContent = `Book ${professional.name} - ${professional.service}`;
    }
    
    currentBookingProfessional = professional;
    resetBookingForm();
    openModal('bookProfessionalModal');
}

function resetBookingForm() {
  $('#serviceDescription').value = '';
  $('#preferredDate').value = '';
  $('#serviceAddress').value = '';
  $('#customerPhone').value = currentUser?.phoneNumber || '';
  $('#estimatedBudget').value = '';
  $('#specialInstructions').value = '';
  selectedJobPhotos = [];
  selectedTimeSlot = null;
  updateJobPhotoPreviews();
  updateAvailableTimesDisplay();
}

// Job Photo Upload Functions
function triggerJobPhotoUpload() {
  $('#jobPhotosInput').click();
}

function handleJobPhotoSelect(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => handleJobPhotoFile(file));
}

function handleJobPhotoDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const upload = event.currentTarget;
  upload.classList.remove('drag-over');
  
  const files = Array.from(event.dataTransfer.files);
  files.forEach(file => handleJobPhotoFile(file));
}

function handleJobPhotoDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.add('drag-over');
}

function handleJobPhotoDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove('drag-over');
}

function handleJobPhotoFile(file) {
  console.log('Job photo file selected:', file.name);
  
  // Validate file
  if (!file.type.startsWith('image/')) {
    toast('Please select image files only', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    toast('File size must be less than 5MB', 'error');
    return;
  }
  
  if (selectedJobPhotos.length >= 5) {
    toast('Maximum 5 photos allowed', 'error');
    return;
  }
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedJobPhotos.push({
      file: file,
      url: e.target.result,
      id: Date.now() + Math.random()
    });
    updateJobPhotoPreviews();
  };
  reader.readAsDataURL(file);
}

function updateJobPhotoPreviews() {
  const container = $('#jobPhotoPreviews');
  if (!container) return;
  
  container.innerHTML = selectedJobPhotos.map(photo => `
    <div class="job-photo-preview">
      <img src="${photo.url}" alt="Job photo">
      <button class="remove-photo-btn" onclick="removeJobPhoto('${photo.id}')" type="button">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

function removeJobPhoto(photoId) {
  selectedJobPhotos = selectedJobPhotos.filter(photo => photo.id != photoId);
  updateJobPhotoPreviews();
}

// Availability Functions
function loadAvailableTimes() {
  const dateInput = $('#preferredDate');
  const selectedDate = new Date(dateInput.value);
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  
  console.log('Loading available times for:', dayName);
  
  const container = $('#availableTimesContainer');
  if (!container) return;
  
  // Get professional availability (mock data for now)
  const availability = professionalAvailability[currentBookingProfessional?.name?.toLowerCase().replace(/\s+/g, '-')] || 
                      professionalAvailability['john-smith'];
  
  const dayAvailability = availability[dayName];
  
  if (!dayAvailability?.available) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <i class="fas fa-times-circle text-2xl mb-2 block text-red-500"></i>
        Not available on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
      </div>
    `;
    return;
  }
  
  // Generate time slots
  const timeSlots = generateTimeSlots(dayAvailability.start, dayAvailability.end, availability.breakTime);
  
  container.innerHTML = timeSlots.map(slot => `
    <div class="time-slot ${slot.available ? '' : 'unavailable'}" 
         onclick="${slot.available ? `selectTimeSlot('${slot.time}')` : ''}"
         data-time="${slot.time}">
      ${slot.time}
      ${!slot.available ? '<br><small>Unavailable</small>' : ''}
    </div>
  `).join('');
}

function generateTimeSlots(startTime, endTime, breakTime) {
  const slots = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const breakStart = breakTime?.enabled ? timeToMinutes(breakTime.start) : null;
  const breakEnd = breakTime?.enabled ? timeToMinutes(breakTime.end) : null;
  
  // Generate 60-minute slots
  for (let time = start; time < end; time += 60) {
    const slotTime = minutesToTime(time);
    const isBreakTime = breakStart && breakEnd && time >= breakStart && time < breakEnd;
    
    slots.push({
      time: slotTime,
      available: !isBreakTime && time + 60 <= end
    });
  }
  
  return slots;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function selectTimeSlot(time) {
  console.log('Selected time slot:', time);
  
  // Remove previous selection
  $$('.time-slot').forEach(slot => slot.classList.remove('selected'));
  
  // Add selection to clicked slot
  const selectedSlot = $(`.time-slot[data-time="${time}"]`);
  if (selectedSlot) {
    selectedSlot.classList.add('selected');
    selectedTimeSlot = time;
  }
}

function updateAvailableTimesDisplay() {
  const container = $('#availableTimesContainer');
  if (container) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <i class="fas fa-clock text-2xl mb-2 block"></i>
        Select a date to see available times
      </div>
    `;
  }
}

// Submit Booking
function submitBooking(event) {
  event.preventDefault();
  console.log('Submit booking');
  
  const description = $('#serviceDescription').value.trim();
  const date = $('#preferredDate').value;
  const address = $('#serviceAddress').value.trim();
  const phone = $('#customerPhone').value.trim();
  const budget = $('#estimatedBudget').value;
  const instructions = $('#specialInstructions').value.trim();
  
  // Validation
  if (!description || !date || !address || !phone || !budget) {
    toast('Please fill in all required fields', 'error');
    return;
  }
  
  if (!selectedTimeSlot) {
    toast('Please select a time slot', 'error');
    return;
  }
  
  const btn = $('#submitBookingBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Booking...';
  btn.disabled = true;
  
  // Create booking object
  const booking = {
    id: 'BK' + Date.now(),
    customerId: currentUser.uid,
    professional: currentBookingProfessional.name,
    service: currentBookingProfessional.service,
    description: description,
    date: date,
    time: selectedTimeSlot,
    address: address,
    phone: phone,
    budget: budget,
    instructions: instructions,
    photos: selectedJobPhotos.map(photo => photo.file.name),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Save booking (simulate)
  setTimeout(() => {
    console.log('Booking saved:', booking);
    
    // Add to mock booking history
    mockBookingHistory.unshift({
      id: booking.id,
      date: booking.date,
      service: booking.service,
      professional: booking.professional,
      amount: 0, // To be determined
      status: 'pending',
      rating: null,
      details: booking.description
    });
    
    toast('Booking submitted successfully!', 'success');
    closeModal('bookProfessionalModal');
    
    // Reset form
    resetBookingForm();
    
    btn.innerHTML = originalText;
    btn.disabled = false;
  }, 2000);
}

// Professional Availability Management
function loadCurrentAvailability() {
  console.log('Loading current availability');
  
  if (!currentUser || userSettings.role !== 'professional') return;
  
  // Load current availability settings (mock for now)
  const availability = professionalAvailability[currentUser.uid] || professionalAvailability['john-smith'];
  
  // Set checkboxes and times
  Object.keys(availability).forEach(day => {
    if (day === 'breakTime' || day === 'minAdvance' || day === 'maxAdvance') return;
    
    const dayData = availability[day];
    const checkbox = $(`#${day}`);
    const startInput = $(`#${day}Start`);
    const endInput = $(`#${day}End`);
    
    if (checkbox) checkbox.checked = dayData.available;
    if (startInput) startInput.value = dayData.start;
    if (endInput) endInput.value = dayData.end;
  });
  
  // Set break time
  if (availability.breakTime) {
    $('#hasBreak').checked = availability.breakTime.enabled;
    $('#breakStart').value = availability.breakTime.start;
    $('#breakEnd').value = availability.breakTime.end;
  }
  
  // Set advance booking settings
  $('#minAdvance').value = availability.minAdvance || 1;
  $('#maxAdvance').value = availability.maxAdvance || 30;
}

function saveAvailability(event) {
  event.preventDefault();
  console.log('Save availability');
  
  if (!currentUser || userSettings.role !== 'professional') {
    toast('Only professionals can set availability', 'error');
    return;
  }
  
  // Collect availability data
  const availability = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  days.forEach(day => {
    const checkbox = $(`#${day}`);
    const startInput = $(`#${day}Start`);
    const endInput = $(`#${day}End`);
    
    availability[day] = {
      available: checkbox?.checked || false,
      start: startInput?.value || '09:00',
      end: endInput?.value || '17:00'
    };
  });
  
  // Break time
  availability.breakTime = {
    enabled: $('#hasBreak')?.checked || false,
    start: $('#breakStart')?.value || '12:00',
    end: $('#breakEnd')?.value || '13:00'
  };
  
  // Advance booking settings
  availability.minAdvance = parseInt($('#minAdvance')?.value) || 1;
  availability.maxAdvance = parseInt($('#maxAdvance')?.value) || 30;
  
  // Save to mock data (in real app, save to Firebase)
  professionalAvailability[currentUser.uid] = availability;
  
  toast('Availability settings saved successfully!', 'success');
  closeModal('availabilityModal');
  
  console.log('Saved availability:', availability);
}

// Booking History Functions
function loadBookingHistory() {
  console.log('Loading booking history');
  
  const tbody = $('#bookingHistoryBody');
  if (!tbody) return;
  
  // Filter bookings based on current filters
  const filteredBookings = filterBookingsByDate(mockBookingHistory);
  
  tbody.innerHTML = filteredBookings.map(booking => {
    const date = new Date(booking.date);
    const statusBadge = getStatusBadge(booking.status);
    
    return `
      <tr>
        <td data-label="Date">${date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}</td>
        <td data-label="Service">${booking.service}</td>
        <td data-label="Professional">${booking.professional}</td>
        <td data-label="Amount">$${booking.amount.toFixed(2)}</td>
        <td data-label="Status">${statusBadge}</td>
        <td data-label="Actions">
          <div class="flex gap-2">
            <button class="btn-base btn-outline btn-sm" onclick="viewBookingDetails('${booking.id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            ${booking.status === 'completed' && !booking.reviewed ? 
              `<button class="btn-base btn-primary btn-sm" onclick="reviewBooking('${booking.id}')" title="Write Review">
                <i class="fas fa-star"></i>
              </button>` : 
              booking.rating ? 
                `<span class="text-yellow-500" title="Rated ${booking.rating} stars">${'★'.repeat(booking.rating)}</span>` : 
                ''
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  if (filteredBookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          <i class="fas fa-calendar-times text-4xl mb-4 block"></i>
          No bookings found for the selected filters.
        </td>
      </tr>
    `;
  }
}

function filterBookings() {
  console.log('Filtering bookings');
  loadBookingHistory();
}

function filterBookingsByDate(bookings) {
  const yearFilter = $('#yearFilter')?.value;
  const monthFilter = $('#monthFilter')?.value;
  const statusFilter = $('#statusFilter')?.value;
  
  return bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    
    // Year filter
    if (yearFilter && bookingDate.getFullYear().toString() !== yearFilter) {
      return false;
    }
    
    // Month filter
    if (monthFilter && (bookingDate.getMonth() + 1).toString() !== monthFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter && booking.status !== statusFilter) {
      return false;
    }
    
    return true;
  });
}

function getStatusBadge(status) {
  const badges = {
    completed: '<span class="status-badge status-completed">Completed</span>',
    cancelled: '<span class="status-badge status-cancelled">Cancelled</span>',
    pending: '<span class="status-badge status-pending">Pending</span>'
  };
  return badges[status] || status;
}

function viewBookingDetails(bookingId) {
  console.log('View booking details:', bookingId);
  const booking = mockBookingHistory.find(b => b.id === bookingId);
  if (!booking) return;
  
  // Create custom modal for booking details
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">
        <i class="fas fa-times"></i>
      </button>
      <div class="modal-header">
        <h2 class="text-xl font-bold">Booking Details</h2>
      </div>
      <div class="modal-body">
        <div class="space-y-4">
          <div><strong>Booking ID:</strong> ${booking.id}</div>
          <div><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</div>
          <div><strong>Service:</strong> ${booking.service}</div>
          <div><strong>Professional:</strong> ${booking.professional}</div>
          <div><strong>Amount:</strong> $${booking.amount.toFixed(2)}</div>
          <div><strong>Status:</strong> ${getStatusBadge(booking.status)}</div>
          <div><strong>Details:</strong> ${booking.details}</div>
          ${booking.rating ? `<div><strong>Your Rating:</strong> ${'★'.repeat(booking.rating)} (${booking.rating}/5)</div>` : ''}
        </div>
        <div class="mt-6 text-center">
          <button class="btn-base btn-primary" onclick="this.closest('.modal-overlay').remove()">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function reviewBooking(bookingId) {
  console.log('Review booking:', bookingId);
  toast('Review feature coming soon!', 'info');
}

function exportBookingHistory() {
  console.log('Export booking history');
  toast('PDF export feature coming soon!', 'info');
}

// Payment Methods Functions
function loadPaymentMethods() {
  console.log('Loading payment methods');
  
  const container = $('#savedCardsContainer');
  if (!container) return;
  
  container.innerHTML = mockPaymentMethods.map(card => {
    const cardClass = `card-${card.type}`;
    const cardIcon = getCardIcon(card.type);
    
    return `
      <div class="credit-card ${cardClass}" onclick="selectPaymentMethod('${card.id}')">
        <div class="card-type">${cardIcon}</div>
        <div class="card-number">•••• •••• •••• ${card.last4}</div>
        <div class="card-details">
          <div class="card-holder">
            <div style="font-size: 0.7rem; opacity: 0.8;">CARDHOLDER</div>
            <div>${card.holderName}</div>
          </div>
          <div class="card-expiry">
            <div style="font-size: 0.7rem; opacity: 0.8;">EXPIRES</div>
            <div>${card.expiryMonth}/${card.expiryYear}</div>
          </div>
        </div>
        ${card.isDefault ? '<div style="position: absolute; top: 1rem; left: 1rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.75rem;">DEFAULT</div>' : ''}
        <button class="btn-base btn-danger btn-sm" style="position: absolute; top: 1rem; right: 1rem;" onclick="event.stopPropagation(); removePaymentMethod('${card.id}')" title="Remove Card">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
  
  if (mockPaymentMethods.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500">
        <i class="fas fa-credit-card text-4xl mb-4 block"></i>
        <p>No payment methods added yet.</p>
        <p class="text-sm">Add a card to get started.</p>
      </div>
    `;
  }
}

function getCardIcon(type) {
  const icons = {
    visa: 'VISA',
    mastercard: 'MASTERCARD',
    amex: 'AMEX',
    discover: 'DISCOVER'
  };
  return icons[type] || type.toUpperCase();
}

function selectPaymentMethod(cardId) {
  console.log('Select payment method:', cardId);
  // In a real app, this would select the card for payment
  toast('Payment method selected', 'success');
}

function removePaymentMethod(cardId) {
  console.log('Remove payment method:', cardId);
  
  // Create confirmation dialog
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-xl font-bold text-red-600">Remove Payment Method</h2>
      </div>
      <div class="modal-body">
        <p class="text-gray-700 mb-6">Are you sure you want to remove this payment method? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button class="btn-base btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-base btn-danger" onclick="confirmRemovePaymentMethod('${cardId}'); this.closest('.modal-overlay').remove()">Remove</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function confirmRemovePaymentMethod(cardId) {
  console.log('Confirm remove payment method:', cardId);
  
  // Remove from mock data
  mockPaymentMethods = mockPaymentMethods.filter(card => card.id !== cardId);
  
  // Reload payment methods
  loadPaymentMethods();
  
  toast('Payment method removed successfully', 'success');
}

function addNewCard(event) {
  event.preventDefault();
  console.log('Add new card');
  
  const cardNumber = $('#cardNumber').value.replace(/\s/g, '');
  const expiryDate = $('#expiryDate').value;
  const cvv = $('#cvv').value;
  const cardholderName = $('#cardholderName').value;
  const setDefault = $('#setDefaultCard').checked;
  
  // Basic validation
  if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
    toast('Please fill in all fields', 'error');
    return;
  }
  
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    toast('Invalid card number', 'error');
    return;
  }
  
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    toast('Invalid expiry date format', 'error');
    return;
  }
  
  if (cvv.length < 3 || cvv.length > 4) {
    toast('Invalid CVV', 'error');
    return;
  }
  
  // Determine card type
  const cardType = getCardType(cardNumber);
  const [month, year] = expiryDate.split('/');
  
  // Create new card object
  const newCard = {
    id: 'PM' + Date.now(),
    type: cardType,
    last4: cardNumber.slice(-4),
    expiryMonth: month,
    expiryYear: '20' + year,
    holderName: cardholderName,
    isDefault: setDefault || mockPaymentMethods.length === 0,
    addedDate: new Date().toISOString().split('T')[0]
  };
  
  // If setting as default, remove default from other cards
  if (setDefault) {
    mockPaymentMethods.forEach(card => card.isDefault = false);
  }
  
  // Add to mock data
  mockPaymentMethods.push(newCard);
  
  // Clear form
  $('#addCardForm').reset();
  
  // Close modal and reload payment methods
  closeModal('addCardModal');
  loadPaymentMethods();
  
  toast('Payment method added successfully', 'success');
}

function getCardType(number) {
  // Simple card type detection
  if (number.startsWith('4')) return 'visa';
  if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
  if (number.startsWith('3')) return 'amex';
  if (number.startsWith('6')) return 'discover';
  return 'unknown';
}

// Card input formatting functions
function formatCardNumber(input) {
  let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
  const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
  input.value = formattedValue;
}

function formatExpiryDate(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  input.value = value;
}

function formatCVV(input) {
  input.value = input.value.replace(/[^0-9]/gi, '');
}

// Enhanced Settings Functions

function gotoSettings(event, targetId) {
  console.log('Goto settings:', targetId);
  event.preventDefault();
  
  const target = document.querySelector(targetId);
  if (!target) return;
  
  // Update active nav
  $$('#settingsNav a').forEach(a => a.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // Scroll to section
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Update URL
  history.replaceState(null, '', targetId);
}

function enableQuickEdit() {
  console.log('Quick edit mode enabled');
  toast('Quick edit mode enabled!', 'info');
}

function previewProfile() {
  console.log('Preview profile');
  toast('Profile preview coming soon!', 'info');
}

function editAllPersonal() {
  console.log('Edit all personal info');
  toast('Bulk edit mode enabled for personal info', 'info');
}

function editAllContact() {
  console.log('Edit all contact info');
  toast('Bulk edit mode enabled for contact info', 'info');
}

// Field editing functions
function editField(fieldName) {
  console.log('Edit field:', fieldName);
  
  // Hide all edit forms first
  $$('.edit-form').forEach(form => {
    form.classList.remove('active');
    hide(form);
  });
  
  // Show the specific edit form
  const form = $(`#${fieldName}Form`);
  const field = $(`[data-field="${fieldName}"]`);
  const input = $(`#${fieldName}Input`);
  const currentValue = $(`#${fieldName}Value`);
  
  if (form && field && input) {
    field.classList.add('editing');
    form.classList.add('active');
    show(form);
    
    // Pre-fill with current value
    if (currentValue && currentValue.textContent !== 'Not set' && currentValue.textContent !== 'Not provided') {
      input.value = currentValue.textContent;
    }
    
    input.focus();
  }
}

function cancelEdit(fieldName) {
  console.log('Cancel edit:', fieldName);
  
  const form = $(`#${fieldName}Form`);
  const field = $(`[data-field="${fieldName}"]`);
  
  if (form && field) {
    field.classList.remove('editing');
    form.classList.remove('active');
    hide(form);
  }
}

function saveField(fieldName) {
  console.log('Save field:', fieldName);
  
  const input = $(`#${fieldName}Input`);
  const valueDisplay = $(`#${fieldName}Value`);
  const form = $(`#${fieldName}Form`);
  const field = $(`[data-field="${fieldName}"]`);
  
  if (!input || !valueDisplay) return;
  
  const newValue = input.value.trim();
  
  if (newValue) {
    valueDisplay.textContent = newValue;
    valueDisplay.classList.remove('empty');
    
    // Save to userSettings and Firebase
    userSettings[fieldName] = newValue;
    saveUserSettings();
    
    toast(`${fieldName} updated successfully`);
  } else {
    valueDisplay.textContent = getEmptyText(fieldName);
    valueDisplay.classList.add('empty');
    
    // Remove from userSettings
    delete userSettings[fieldName];
    saveUserSettings();
  }
  
  // Hide form
  if (form && field) {
    field.classList.remove('editing');
    form.classList.remove('active');
    hide(form);
  }
}

function getEmptyText(fieldName) {
  const emptyTexts = {
    displayName: 'Not set',
    bio: 'Tell us about yourself...',
    phone: 'Not provided',
    streetAddress: 'Not provided',
    city: 'Not provided',
    state: 'Not provided',
    postalCode: 'Not provided',
    country: 'Not selected'
  };
  return emptyTexts[fieldName] || 'Not set';
}

// Photo editing functions
function editPhoto() {
  console.log('Edit photo');
  
  // Hide all other edit forms
  $$('.edit-form').forEach(form => {
    if (form.id !== 'photoUploadForm') {
      form.classList.remove('active');
      hide(form);
    }
  });
  
  const form = $('#photoUploadForm');
  if (form) {
    form.classList.add('active');
    show(form);
  }
}

function triggerPhotoUpload() {
  $('#photoInput').click();
}

function handlePhotoSelect(event) {
  const file = event.target.files[0];
  if (file) {
    handlePhotoFile(file);
  }
}

function handlePhotoDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const upload = event.currentTarget;
  upload.classList.remove('drag-over');
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    handlePhotoFile(files[0]);
  }
}

function handlePhotoDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.add('drag-over');
}

function handlePhotoDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove('drag-over');
}

function handlePhotoFile(file) {
  console.log('Photo file selected:', file.name);
  
  // Validate file
  if (!file.type.startsWith('image/')) {
    toast('Please select an image file', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    toast('File size must be less than 5MB', 'error');
    return;
  }
  
  selectedPhoto = file;
  
  // Preview the image
  const reader = new FileReader();
  reader.onload = (e) => {
    $('#displayPhotoPreview').src = e.target.result;
    $('#photoStatus').textContent = `Ready to upload: ${file.name}`;
  };
  reader.readAsDataURL(file);
  
  // Enable save button
  const saveBtn = $('#savePhotoBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
  }
}

function savePhoto() {
  console.log('Save photo');
  
  if (!selectedPhoto || !currentUser) {
    toast('Please select a photo and sign in', 'error');
    return;
  }
  
  const saveBtn = $('#savePhotoBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading...';
  saveBtn.disabled = true;
  
  // Upload to Firebase Storage
  const storageRef = storage.ref(`profile-photos/${currentUser.uid}/${Date.now()}_${selectedPhoto.name}`);
  
  storageRef.put(selectedPhoto)
    .then(snapshot => snapshot.ref.getDownloadURL())
    .then(downloadURL => {
      // Update user profile
      return currentUser.updateProfile({ photoURL: downloadURL }).then(() => {
        // Save to Firestore with error handling
        return safeFirestoreWrite(() =>
          db.collection('users').doc(currentUser.uid).update({
            photoURL: downloadURL
          }),
          'Photo uploaded - will sync when online'
        );
      }).then(() => {
        $('#photoStatus').textContent = 'Photo uploaded successfully';
        userSettings.photoURL = downloadURL;
        updateUserAvatar(downloadURL);
        toast('Profile photo updated successfully');
        cancelPhotoEdit();
      });
    })
    .catch(error => {
      console.error('Photo upload error:', error);
      toast('Failed to upload photo', 'error');
    })
    .finally(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = true;
    });
}

function cancelPhotoEdit() {
  console.log('Cancel photo edit');
  
  const form = $('#photoUploadForm');
  if (form) {
    form.classList.remove('active');
    hide(form);
  }
  
  selectedPhoto = null;
  $('#savePhotoBtn').disabled = true;
}

function updateUserAvatar(photoURL) {
  const avatars = $$('#userAvatar, #userAvatarLarge');
  avatars.forEach(avatar => {
    if (photoURL) {
      avatar.innerHTML = `<img src="${photoURL}" alt="Profile" class="w-full h-full rounded-full object-cover">`;
    }
  });
}

// Location functions
function useCurrentLocation() {
  console.log('Use current location clicked');
  if (!navigator.geolocation) {
    toast('Geolocation is not supported', 'error');
    return;
  }
  
  toast('Getting your location...', 'info');
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        // Use a geocoding service to get city/state from coordinates
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
        const data = await response.json();
        
        const cityDisplay = $('#cityValue');
        const stateDisplay = $('#stateValue');
        
        if (cityDisplay && data.city) {
          cityDisplay.textContent = data.city;
          cityDisplay.classList.remove('empty');
          userSettings.city = data.city;
        }
        
        if (stateDisplay && data.principalSubdivision) {
          stateDisplay.textContent = data.principalSubdivision;
          stateDisplay.classList.remove('empty');
          userSettings.state = data.principalSubdivision;
        }
        
        saveUserSettings();
        toast('Location updated successfully');
      } catch (error) {
        console.error('Geocoding error:', error);
        const cityDisplay = $('#cityValue');
        if (cityDisplay) {
          cityDisplay.textContent = 'Current Location';
          cityDisplay.classList.remove('empty');
          userSettings.city = 'Current Location';
          saveUserSettings();
        }
        toast('Location detected successfully');
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      toast('Could not get your location', 'error');
    },
    { timeout: 10000 }
  );
}

// Settings save functions
function saveToggle(settingName, value) {
  console.log('Save toggle:', settingName, value);
  userSettings[settingName] = value;
  saveUserSettings();
  toast(`${settingName} ${value ? 'enabled' : 'disabled'}`, 'success');
}

function savePreference(settingName, value) {
  console.log('Save preference:', settingName, value);
  userSettings[settingName] = value;
  saveUserSettings();
  toast(`${settingName} updated to ${value}`, 'success');
}

function saveUserSettings() {
  if (!currentUser) return;
  
  safeFirestoreWrite(() =>
    db.collection('users').doc(currentUser.uid).update(userSettings),
    'Settings saved locally - will sync when online'
  );
}

// Account management functions
function deactivateAccount() {
  console.log('Deactivate account clicked');
  
  if (!currentUser) {
    toast('Please sign in first', 'error');
    return;
  }
  
  // Create custom confirmation dialog
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-xl font-bold text-orange-600">Confirm Account Deactivation</h2>
      </div>
      <div class="modal-body">
        <p class="text-gray-700 mb-6">Are you sure you want to deactivate your account? You can reactivate it later by signing in again.</p>
        <div class="flex justify-end space-x-3">
          <button class="btn-base btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-base btn-outline text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white" onclick="confirmDeactivateAccount(); this.closest('.modal-overlay').remove()">Deactivate</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function confirmDeactivateAccount() {
  console.log('Confirm deactivate account');
  
  // Update user status to deactivated
  safeFirestoreWrite(() =>
    db.collection('users').doc(currentUser.uid).update({
      status: 'deactivated',
      deactivatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }),
    'Account will be deactivated when online'
  ).then(() => {
    toast('Account deactivated successfully');
    handleLogout();
  }).catch((error) => {
    console.error('Deactivate account error:', error);
    toast('Failed to deactivate account: ' + error.message, 'error');
  });
}

function deleteAccount() {
  console.log('Delete account clicked');
  
  if (!currentUser) {
    toast('Please sign in first', 'error');
    return;
  }
  
  // Create custom confirmation dialog
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="text-xl font-bold text-red-600">Confirm Account Deletion</h2>
      </div>
      <div class="modal-body">
        <p class="text-gray-700 mb-6">Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your data.</p>
        <div class="flex justify-end space-x-3">
          <button class="btn-base btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn-base btn-danger" onclick="confirmDeleteAccount(); this.closest('.modal-overlay').remove()">Delete Account</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function confirmDeleteAccount() {
  console.log('Confirm delete account');
  
  // Delete user data from Firestore
  safeFirestoreWrite(() =>
    db.collection('users').doc(currentUser.uid).delete()
  ).then(() => {
    // Delete user account
    return currentUser.delete();
  }).then(() => {
    toast('Account deleted successfully');
    switchView('customer');
  }).catch((error) => {
    console.error('Delete account error:', error);
    toast('Failed to delete account: ' + error.message, 'error');
  });
}

// Additional settings functions
function managePaymentMethods() {
  console.log('Manage payment methods');
  openModal('paymentMethodsModal');
}

function viewBillingHistory() {
  console.log('View billing history');
  openModal('bookingHistoryModal');
}

function downloadUserData() {
  console.log('Download user data');
  if (!currentUser) {
    toast('Please sign in first', 'error');
    return;
  }
  
  // Simulate data download
  const userData = {
    profile: userSettings,
    account: {
      email: currentUser.email,
      uid: currentUser.uid,
      createdAt: currentUser.metadata.creationTime
    }
  };
  
  const dataStr = JSON.stringify(userData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quickfix-pro-data.json';
  link.click();
  
  URL.revokeObjectURL(url);
  toast('Your data has been downloaded', 'success');
}

// Help & Support Functions

function showHelpSection(sectionName) {
  console.log('Show help section:', sectionName);
  
  // Update navigation
  $$('.help-nav-item').forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // Hide all sections
  $$('.help-section').forEach(section => {
    section.classList.remove('active');
    hide(section);
  });
  
  // Show target section
  const targetSection = $(`#${sectionName}Section`);
  if (targetSection) {
    targetSection.classList.add('active');
    show(targetSection);
  }
  
  currentHelpSection = sectionName;
}

function searchHelp(query) {
  console.log('Search help:', query);
  
  if (!query || query.length < 2) {
    // Reset highlighting
    $$('.search-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    return;
  }
  
  // Show FAQ section if searching
  if (currentHelpSection !== 'faq') {
    showHelpSection('faq');
  }
  
  // Search and highlight in FAQ
  const faqItems = $$('.faq-item');
  const searchRegex = new RegExp(`(${query})`, 'gi');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question span');
    const answer = item.querySelector('.faq-answer');
    
    if (question && answer) {
      const questionText = question.textContent;
      const answerText = answer.textContent;
      
      if (questionText.toLowerCase().includes(query.toLowerCase()) || 
          answerText.toLowerCase().includes(query.toLowerCase())) {
        show(item);
        
        // Highlight matches
        question.innerHTML = questionText.replace(searchRegex, '<span class="search-highlight">$1</span>');
        answer.innerHTML = answerText.replace(searchRegex, '<span class="search-highlight">$1</span>');
      } else {
        hide(item);
      }
    }
  });
}

function toggleFAQ(element) {
  console.log('Toggle FAQ');
  
  const question = element;
  const answer = question.nextElementSibling;
  const icon = question.querySelector('.faq-icon');
  
  // Close other FAQ items
  $$('.faq-question.active').forEach(q => {
    if (q !== question) {
      q.classList.remove('active');
      q.nextElementSibling.classList.remove('active');
    }
  });
  
  // Toggle current FAQ item
  question.classList.toggle('active');
  answer.classList.toggle('active');
}

function filterFAQ(category) {
  console.log('Filter FAQ:', category);
  
  const faqItems = $$('.faq-item');
  
  faqItems.forEach(item => {
    if (category === 'all' || item.dataset.category === category) {
      show(item);
    } else {
      hide(item);
    }
  });
  
  // Update button styles
  $$('#faqSection .btn-base').forEach(btn => btn.classList.remove('btn-primary'));
  $$('#faqSection .btn-base').forEach(btn => btn.classList.add('btn-outline'));
  event.currentTarget.classList.remove('btn-outline');
  event.currentTarget.classList.add('btn-primary');
}

function submitSupportTicket(event) {
  event.preventDefault();
  console.log('Submit support ticket');
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Simulate ticket submission
  const ticketData = {
    name: formData.get('name') || form.querySelector('input[type="text"]').value,
    email: formData.get('email') || form.querySelector('input[type="email"]').value,
    category: form.querySelector('select').value,
    priority: form.querySelectorAll('select')[1].value,
    subject: form.querySelector('input[placeholder*="Brief"]').value,
    description: form.querySelector('textarea').value,
    timestamp: new Date().toISOString(),
    ticketId: 'QF-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  };
  
  // Save to Firebase (if logged in) with error handling
  if (currentUser) {
    safeFirestoreWrite(() =>
      db.collection('support-tickets').add({
        ...ticketData,
        userId: currentUser.uid
      }),
      'Support ticket saved locally - will submit when online'
    );
  }
  
  toast('Support ticket submitted successfully! Ticket ID: ' + ticketData.ticketId, 'success', 5000);
  form.reset();
}

function clearSupportForm() {
  console.log('Clear support form');
  const form = $('#contactSection form');
  if (form) {
    form.reset();
  }
}

function startLiveChat() {
  console.log('Start live chat');
  toast('Live chat feature coming soon! Our team is available 24/7.', 'info');
}

function openGuide(guideName) {
  console.log('Open guide:', guideName);
  toast(`Opening ${guideName} guide - feature coming soon!`, 'info');
}

function submitFeedback(event) {
  event.preventDefault();
  console.log('Submit feedback');
  
  const form = event.target;
  const feedbackData = {
    type: form.querySelector('select').value,
    rating: selectedRating,
    message: form.querySelector('textarea').value,
    timestamp: new Date().toISOString(),
    userId: currentUser?.uid || 'anonymous'
  };
  
  // Save to Firebase with error handling
  safeFirestoreWrite(() =>
    db.collection('feedback').add(feedbackData),
    'Feedback saved locally - will submit when online'
  ).then(() => {
    toast('Thank you for your feedback!', 'success');
    form.reset();
    selectedRating = 0;
    updateRatingButtons();
  }).catch((error) => {
    console.error('Error saving feedback:', error);
    toast('Failed to submit feedback', 'error');
  });
}

function setRating(rating) {
  console.log('Set rating:', rating);
  selectedRating = rating;
  updateRatingButtons();
}

function updateRatingButtons() {
  $$('#feedbackSection .btn-base').forEach((btn, index) => {
    if (index + 1 <= selectedRating) {
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
    } else {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
    }
  });
}

// Helper functions
function updateUserUI(user) {
  const avatar = $('#userAvatar');
  const avatarLg = $('#userAvatarLarge');
  const nameLg = $('#userNameLarge');
  const statusLg = $('#userStatusLarge');
  
  if (user) {
    show($('#loggedUserMenu'));
    hide($('#guestUserMenu'));
    
    if (user.photoURL) {
      if (avatar) avatar.innerHTML = `<img src="${user.photoURL}" alt="Profile" class="w-full h-full rounded-full object-cover">`;
      if (avatarLg) avatarLg.innerHTML = `<img src="${user.photoURL}" alt="Profile" class="w-full h-full rounded-full object-cover">`;
    } else {
      const letter = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
      if (avatar) avatar.textContent = letter;
      if (avatarLg) avatarLg.textContent = letter;
    }
    
    if (nameLg) nameLg.textContent = user.displayName || user.email;
    if (statusLg) statusLg.textContent = user.email;
  } else {
    hide($('#loggedUserMenu'));
    show($('#guestUserMenu'));
    
    if (nameLg) nameLg.textContent = 'Guest User';
    if (statusLg) statusLg.textContent = 'Not signed in';
    if (avatar) avatar.innerHTML = '<i class="fas fa-user"></i>';
    if (avatarLg) avatarLg.innerHTML = '<i class="fas fa-user"></i>';
  }
}

// Load mock content for homepage
function loadMockContent() {
  // Popular services
  const popularServices = [
    { name: 'Plumbing', icon: 'fas fa-wrench', color: 'from-blue-500 to-blue-600' },
    { name: 'Electrical', icon: 'fas fa-bolt', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Handyman', icon: 'fas fa-tools', color: 'from-green-500 to-green-600' },
    { name: 'HVAC', icon: 'fas fa-wind', color: 'from-purple-500 to-purple-600' },
    { name: 'Cleaning', icon: 'fas fa-broom', color: 'from-pink-500 to-pink-600' },
    { name: 'Painting', icon: 'fas fa-paint-roller', color: 'from-red-500 to-red-600' }
  ];
  
  const popularContainer = $('#popularServices');
  if (popularContainer) {
    popularContainer.innerHTML = popularServices.map(service => `
      <div class="card card-interactive" onclick="doSearch('${service.name}')">
        <div class="service-icon bg-gradient-to-br ${service.color}">
          <i class="${service.icon}"></i>
        </div>
        <h3 class="text-sm font-bold mt-3 text-center">${service.name}</h3>
      </div>
    `).join('');
  }
  
  // All service categories
  const allServices = [
    { name: 'Plumbing', icon: 'fas fa-wrench', color: 'from-blue-500 to-blue-600' },
    { name: 'Electrical', icon: 'fas fa-bolt', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Handyman', icon: 'fas fa-tools', color: 'from-green-500 to-green-600' },
    { name: 'HVAC', icon: 'fas fa-wind', color: 'from-purple-500 to-purple-600' },
    { name: 'Cleaning', icon: 'fas fa-broom', color: 'from-pink-500 to-pink-600' },
    { name: 'Painting', icon: 'fas fa-paint-roller', color: 'from-red-500 to-red-600' },
    { name: 'Appliances', icon: 'fas fa-home', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Carpentry', icon: 'fas fa-hammer', color: 'from-orange-500 to-orange-600' },
    { name: 'Roofing', icon: 'fas fa-home', color: 'from-gray-500 to-gray-600' },
    { name: 'Landscaping', icon: 'fas fa-leaf', color: 'from-green-400 to-green-500' },
    { name: 'Moving', icon: 'fas fa-truck', color: 'from-blue-400 to-blue-500' },
    { name: 'Assembly', icon: 'fas fa-screwdriver', color: 'from-purple-400 to-purple-500' }
  ];
  
  const servicesContainer = $('#serviceCategories');
  if (servicesContainer) {
    servicesContainer.innerHTML = allServices.map(service => `
      <div class="card card-interactive" onclick="doSearch('${service.name}')">
        <div class="service-icon bg-gradient-to-br ${service.color}">
          <i class="${service.icon}"></i>
        </div>
        <h3 class="text-sm font-bold mt-3 text-center">${service.name}</h3>
      </div>
    `).join('');
  }
  
  // Featured professionals
  const professionals = [
    { name: 'John Smith', service: 'Plumbing', rating: 4.9, reviews: 124, price: '$80/hr', image: 'JH' },
    { name: 'Sarah Williams', service: 'House Cleaning', rating: 4.8, reviews: 89, price: '$25/hr', image: 'SW' },
    { name: 'Mike Johnson', service: 'Handyman', rating: 4.7, reviews: 156, price: '$65/hr', image: 'MJ' }
  ];
  
  const professionalsContainer = $('#featuredProfessionals');
  if (professionalsContainer) {
    professionalsContainer.innerHTML = professionals.map((pro, index) => `
      <div class="card professional-card">
        <div class="flex items-center mb-4">
          <div class="avatar-container w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
            ${pro.image}
          </div>
          <div>
            <h3 class="font-bold text-lg">${pro.name}</h3>
            <p class="text-gray-600">${pro.service}</p>
          </div>
        </div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <span class="text-yellow-500 mr-1">★</span>
            <span class="font-semibold">${pro.rating}</span>
            <span class="text-gray-500 ml-1">(${pro.reviews})</span>
          </div>
          <span class="font-bold text-primary">${pro.price}</span>
        </div>
        <button class="btn-base btn-primary w-full" onclick="openBookingModal(${index + 1})">
          Book Now
        </button>
      </div>
    `).join('');
  }
  
  // Work portfolio for professional view
  const workPortfolio = $('#workPortfolio');
  if (workPortfolio) {
    const workSamples = [
      { title: 'Kitchen Plumbing Repair', type: 'Before & After', date: '2 days ago' },
      { title: 'Bathroom Renovation', type: 'Complete Project', date: '1 week ago' },
      { title: 'Emergency Leak Fix', type: 'Quick Fix', date: '3 days ago' }
    ];
    
    workPortfolio.innerHTML = workSamples.map(work => `
      <div class="card">
        <div class="bg-gradient-to-br from-gray-200 to-gray-300 h-32 rounded-lg mb-3 flex items-center justify-center">
          <i class="fas fa-image text-gray-500 text-2xl"></i>
        </div>
        <h4 class="font-bold mb-2">${work.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${work.type}</p>
        <p class="text-xs text-gray-500">${work.date}</p>
      </div>
    `).join('');
  }
  
  // Recent professionals for admin view
  const recentProfessionals = $('#recentProfessionals');
  if (recentProfessionals) {
    const recentActivity = [
      { name: 'Alex Rodriguez', action: 'Completed job', time: '5 min ago', status: 'active' },
      { name: 'Emma Davis', action: 'New registration', time: '15 min ago', status: 'pending' },
      { name: 'Chris Wilson', action: 'Updated profile', time: '1 hour ago', status: 'active' }
    ];
    
    recentProfessionals.innerHTML = recentActivity.map(activity => `
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-bold">${activity.name}</h4>
            <p class="text-sm text-gray-600">${activity.action}</p>
            <p class="text-xs text-gray-500">${activity.time}</p>
          </div>
          <span class="status-badge status-${activity.status === 'active' ? 'online' : 'pending'}">${activity.status}</span>
        </div>
      </div>
    `).join('');
  }
}

// Detect location
function detectLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await response.json();
          
          const locationElement = $('#locationCity');
          if (locationElement && data.city) {
            locationElement.textContent = data.city;
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          const locationElement = $('#locationCity');
          if (locationElement) {
            locationElement.textContent = 'Your Area';
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        const locationElement = $('#locationCity');
        if (locationElement) {
          locationElement.textContent = 'Your Area';
        }
      }
    );
  }
}

function initializeApp() {
  console.log('Initializing QuickFix Pro...');

  // Check if user has seen intro before
  const hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const introEl = document.getElementById('mobileIntro');

  if (introEl) {
    if (!hasSeenIntro && isMobile) {
      introEl.style.display = 'flex';
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
      startCarouselAutoAdvance();
      // ensure first slide is visible
      showSlide(0);
    } else {
      introEl.style.display = 'none';
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      document.body.style.overflow = 'auto';
    }
  } else {
    // If this page doesn't have the intro, just ensure scrolling works
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    document.body.style.overflow = 'auto';
  }

  // Load mock data
  initializeMockData();
  loadMockContent();
  detectLocation();

  // Initialize search on Enter key
  const searchInputs = document.querySelectorAll('#searchInput, #mobileSearchInput');
  searchInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        doSearch(this.value);
      }
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(e) {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    if (!mobileMenu || !hamburgerBtn) return;

    if (mobileMenu.classList.contains('active') &&
        !mobileMenu.contains(e.target) &&
        !hamburgerBtn.contains(e.target)) {
      closeMobileMenu();
    }
  });
}


// Firebase auth state observer
auth.onAuthStateChanged(async (user) => {
  console.log('Auth state changed:', user?.email);
  currentUser = user;
  initialAuthComplete = true;
  
  if (user) {
    // Load user settings with error handling
    const userDoc = await safeFirestoreRead(() =>
      db.collection('users').doc(user.uid).get()
    );
    
    if (userDoc?.exists) {
      userSettings = userDoc.data();
      console.log('Loaded user settings:', userSettings);
      
      // Show professional button if user is a professional
      if (userSettings.role === 'professional') {
        show($('#professionalBtn'));
        show($('#mobileProfessional'));
        
        // Switch to professional view if flagged
        if (pendingProfessionalSwitch) {
          switchView('professional');
          pendingProfessionalSwitch = false;
        }
      }
      
      // Update settings UI
      updateSettingsUI();
    }
  } else {
    userSettings = {};
    hide($('#professionalBtn'));
    hide($('#mobileProfessional'));
  }
  
  updateUserUI(user);
});

// Update settings UI with current values
function updateSettingsUI() {
  // Update display fields
  if (userSettings.displayName) {
    const displayNameValue = $('#displayNameValue');
    if (displayNameValue) {
      displayNameValue.textContent = userSettings.displayName;
      displayNameValue.classList.remove('empty');
    }
  }
  
  if (userSettings.bio) {
    const bioValue = $('#bioValue');
    if (bioValue) {
      bioValue.textContent = userSettings.bio;
      bioValue.classList.remove('empty');
    }
  }
  
  if (userSettings.phone) {
    const phoneValue = $('#phoneValue');
    if (phoneValue) {
      phoneValue.textContent = userSettings.phone;
      phoneValue.classList.remove('empty');
    }
  }
  
  if (userSettings.city) {
    const cityValue = $('#cityValue');
    if (cityValue) {
      cityValue.textContent = userSettings.city;
      cityValue.classList.remove('empty');
    }
  }
  
  // Update email display
  if (currentUser?.email) {
    const emailDisplay = $('#emailDisplay');
    if (emailDisplay) {
      emailDisplay.textContent = currentUser.email;
    }
  }
  
  // Update photo if available
  if (userSettings.photoURL) {
    updateUserAvatar(userSettings.photoURL);
  }
}

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay.show');
        if (openModal) {
            const modalId = openModal.id;
            closeModal(modalId);
        }
        
        // Close mobile menu if open
        if (document.getElementById('mobileMenu').classList.contains('active')) {
            closeMobileMenu();
        }
    }
});

// Touch gesture support for carousel
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.carousel-container')) {
        touchStartX = e.changedTouches[0].screenX;
    }
});

document.addEventListener('touchend', function(e) {
    if (e.target.closest('.carousel-container')) {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
    }
});

function handleGesture() {
    const threshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > threshold) {
        if (diff > 0) {
            // Swipe left - next slide
            nextSlide();
        } else {
            // Swipe right - previous slide
            prevSlide();
        }
    }
}

// Handle resize events
window.addEventListener('resize', function() {
    // Handle mobile menu on resize
    if (window.innerWidth > 1024) {
        closeMobileMenu();
    }
});

// Handle orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        // Recalculate layouts if needed
        window.dispatchEvent(new Event('resize'));
    }, 100);
});

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Search input functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = $('#searchInput');
  const mobileSearchInput = $('#mobileSearchInput');
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        doSearch(searchInput.value);
      }
    });
  }
  
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        doSearch(mobileSearchInput.value);
        closeModal('searchModal');
      }
    });
  }
});