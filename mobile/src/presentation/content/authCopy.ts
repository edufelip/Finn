export const authCopy = {
  heading: 'Welcome,',
  subheading: 'Sign in if you have an account!',
  emailPlaceholder: 'e-mail',
  passwordPlaceholder: 'password',
  login: 'Login',
  forgotPrompt: 'Forgot your password?',
  forgotAction: 'Click here',
  divider: 'Or continue with',
  google: 'Sign in with Google',
  apple: 'Continue with Apple',
  signupPrompt: "Don't have an account?",
  signupAction: 'Sign up here',
  alerts: {
    emailRequired: {
      title: 'Email required',
      message: 'Enter your email address.',
    },
    invalidEmail: {
      title: 'Invalid email',
      message: 'Enter a valid email address.',
    },
    passwordRequired: {
      title: 'Password required',
      message: 'Enter your password.',
    },
    offline: {
      title: 'Offline',
      message: 'Connect to the internet to sign in.',
    },
    signInFailed: {
      title: 'Sign in failed',
    },
    googleFailed: {
      title: 'Google sign-in failed',
      missingToken: 'Missing identity token.',
    },
    appleUnavailable: {
      title: 'Apple Sign In unavailable',
      message: 'Apple Sign In is not available on this device.',
    },
    appleFailed: {
      title: 'Apple sign-in failed',
      missingToken: 'Missing identity token.',
    },
  },
  testIds: {
    email: 'auth-email',
    password: 'auth-password',
    signin: 'auth-signin',
    forgot: 'auth-forgot',
    register: 'auth-register',
    togglePassword: 'toggle-password',
  },
};
