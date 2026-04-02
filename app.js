/**
 * app.js
 * Handles UI interactions, Supabase Auth logic, and DOM manipulation.
 */

// --- State Variables --- //
let isLoginMode = true; // Tracks whether the user is viewing Login or Signup

// --- DOM Elements --- //
const authCard = document.getElementById('auth-card');
const loggedInCard = document.getElementById('logged-in-card');

const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');

const togglePrompt = document.getElementById('toggle-prompt');
const toggleModeBtn = document.getElementById('toggle-mode-btn');

const messageContainer = document.getElementById('message-container');

const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');


// --- Initialization --- //
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check if user is already logged in on page load
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    showLoggedInState(session.user);
  }

  // 2. Listen for authentication state changes (login, logout, refresh)
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if(session) showLoggedInState(session.user);
    } else if (event === 'SIGNED_OUT') {
      showLoggedOutState();
    }
  });
});


// --- UI Form Toggle --- //
// Switches Text and Mode between Login and Signup without page reload
toggleModeBtn.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  
  hideMessage();
  authForm.reset();
  
  if (isLoginMode) {
    formTitle.textContent = 'Welcome Back';
    formSubtitle.textContent = 'Login to your account';
    btnText.textContent = 'Log In';
    togglePrompt.textContent = "Don't have an account?";
    toggleModeBtn.textContent = 'Sign up';
  } else {
    formTitle.textContent = 'Create Account';
    formSubtitle.textContent = 'Sign up to get started';
    btnText.textContent = 'Sign Up';
    togglePrompt.textContent = 'Already have an account?';
    toggleModeBtn.textContent = 'Log in';
  }
});


// --- Authentication Logic --- //
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Basic Validation
  if (!email || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'error');
    return;
  }
  
  setLoading(true);
  hideMessage();
  
  try {
    if (isLoginMode) {
      
      // ==========================================
      // LOG IN FLOW
      // ==========================================
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      // Note: onAuthStateChange listener will automatically handle UI update
      
    } else {
      
      // ==========================================
      // SIGN UP FLOW
      // ==========================================
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Supabase returns an empty identities array if an account already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        showMessage('An account with this email already exists.', 'error');
      } else {

        // --- Create profile record in 'profiles' table limit RLS to user ---
        // This attempts to insert the newly created user into the 'profiles' database table.
        // It relies on RLS policies that allow authenticated users to insert their *own* row.
        if (data.user) {
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert([
              { 
                id: data.user.id, 
                email: data.user.email,
              }
            ]);
            
          if (profileError && profileError.code !== '23505') {
             // 23505 is Unique Violation (if user clicked sign up multiple times)
             console.error("Profile creation error:", profileError);
          }
        }

        // Show success UI based on email confirmation settings
        if (data.session) {
          showMessage('Successfully signed up!', 'success');
        } else {
          showMessage('Signup successful! Please check your email to confirm.', 'success');
          authForm.reset();
        }
        
      }
    }
  } catch (error) {
    // Show Supabase error nicely
    showMessage(error.message, 'error');
  } finally {
    setLoading(false);
  }
});


// --- Logout Logic --- //
logoutBtn.addEventListener('click', async () => {
  setLoading(true, logoutBtn);
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    // Note: onAuthStateChange listener triggers UI logic automatically
  } catch (error) {
    alert('Error logging out: ' + error.message);
  } finally {
    setLoading(false, logoutBtn, 'Log Out');
  }
});


// --- UI Helper Functions --- //

/**
 * Display success or error messages
 */
function showMessage(text, type) {
  messageContainer.textContent = text;
  messageContainer.className = `message ${type}`;
}

/**
 * Clear messages
 */
function hideMessage() {
  messageContainer.className = 'message hidden';
}

/**
 * Toggle button loading state
 */
function setLoading(isLoading, button = submitBtn, defaultText = btnText.textContent) {
  if (isLoading) {
    button.disabled = true;
    if (button === submitBtn) {
      btnText.classList.add('hidden');
      btnLoader.classList.remove('hidden');
    } else {
      button.textContent = 'Loading...';
    }
  } else {
    button.disabled = false;
    if (button === submitBtn) {
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    } else {
      button.textContent = defaultText;
    }
  }
}

/**
 * Hide auth form, show dashboard
 */
function showLoggedInState(user) {
  authCard.classList.add('hidden');
  loggedInCard.classList.remove('hidden');
  userEmailDisplay.textContent = user.email;
}

/**
 * Hide dashboard, show auth form
 */
function showLoggedOutState() {
  loggedInCard.classList.add('hidden');
  authCard.classList.remove('hidden');
  authForm.reset();
  hideMessage();
  
  // Always default back to login view securely upon logout
  if (!isLoginMode) {
    toggleModeBtn.click(); 
  }
}
