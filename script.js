// ------------------------------------------------------------------
  // 1. PASTE YOUR FIREBASE CONFIG HERE
  //    Get this from: Firebase Console → Project Settings → General
  //    → "Your apps" → Web app → SDK setup and configuration
  // ------------------------------------------------------------------
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("YOUR_"));
  if (!isConfigured) {
    document.getElementById('configWarning').classList.add('show');
  }

  let auth = null;
  if (isConfigured) {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
  }

  // ------------------------------------------------------------------
  // UI wiring
  // ------------------------------------------------------------------
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginView = document.getElementById('loginView');
  const registerView = document.getElementById('registerView');
  const statusMsg = document.getElementById('statusMsg');
  const keyhole = document.getElementById('keyhole');
  const panel = document.getElementById('panel');
  const signedInView = document.getElementById('signedInView');

  function showTab(which){
    const isLogin = which === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    tabLogin.setAttribute('aria-selected', isLogin);
    tabRegister.setAttribute('aria-selected', !isLogin);
    loginView.style.display = isLogin ? 'block' : 'none';
    registerView.style.display = isLogin ? 'none' : 'block';
    setStatus('');
  }
  tabLogin.addEventListener('click', () => showTab('login'));
  tabRegister.addEventListener('click', () => showTab('register'));

  function setStatus(msg, type){
    statusMsg.textContent = msg || '';
    statusMsg.className = 'status' + (type ? ' ' + type : '');
  }

  function requireConfig(){
    if (!isConfigured){
      setStatus('Firebase is not configured yet — see the note above the form.', 'error');
      return false;
    }
    return true;
  }

  function friendlyError(err){
    const map = {
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with that email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'That email address looks invalid.',
      'auth/popup-closed-by-user': 'Google sign-in was closed before completing.',
      'auth/invalid-credential': 'Incorrect email or password.'
    };
    return map[err.code] || err.message;
  }

  function onSignedIn(user){
    keyhole.classList.add('unlocked');
    panel.classList.add('hide-forms');
    signedInView.classList.add('show');
    document.getElementById('configWarning').classList.remove('show');
    document.getElementById('userAvatar').src = user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.displayName || user.email || 'U');
    document.getElementById('userName').textContent = user.displayName || 'Signed in';
    document.getElementById('userEmail').textContent = user.email || '';
    setStatus('');
  }

  function onSignedOut(){
    keyhole.classList.remove('unlocked');
    panel.classList.remove('hide-forms');
    signedInView.classList.remove('show');
    if (!isConfigured) document.getElementById('configWarning').classList.add('show');
  }
  // Email/password sign in
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireConfig()) return;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    setStatus('Signing in…');
    try {
      await auth.signInWithEmailAndPassword(email, password);
      setStatus('Signed in.', 'ok');
    } catch (err) {
      setStatus(friendlyError(err), 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Email/password registration
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireConfig()) return;
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    setStatus('Creating account…');
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name) {
        await cred.user.updateProfile({ displayName: name });
      }
      setStatus('Account created.', 'ok');
    } catch (err) {
      setStatus(friendlyError(err), 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Google sign-in
  document.getElementById('googleBtn').addEventListener('click', async () => {
    if (!requireConfig()) return;
    setStatus('Opening Google sign-in…');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      setStatus('Signed in with Google.', 'ok');
    } catch (err) {
      setStatus(friendlyError(err), 'error');
    }
  });

  // Forgot password
  document.getElementById('forgotLink').addEventListener('click', async (e) => {
    e.preventDefault();
    if (!requireConfig()) return;
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      setStatus('Enter your email above first, then click "Forgot password?".', 'error');
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      setStatus('Password reset email sent.', 'ok');
    } catch (err) {
      setStatus(friendlyError(err), 'error');
    }
  });

  // Sign out
  document.getElementById('signOutBtn').addEventListener('click', () => {
    if (auth) auth.signOut();
  });

  // Track auth state
  if (isConfigured) {
    auth.onAuthStateChanged((user) => {
      if (user) onSignedIn(user); else onSignedOut();
    });
  }