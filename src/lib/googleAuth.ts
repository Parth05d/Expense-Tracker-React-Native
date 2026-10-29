import { Alert } from 'react-native';
import { showGlassAlert } from '../components/common/GlassAlert';

let GoogleSigninModule: any = null;
let statusCodesEnum: any = null;
let isSupported = false;

try {
  const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
  GoogleSigninModule = GoogleSignin;
  statusCodesEnum = statusCodes;

  if (GoogleSigninModule && typeof GoogleSigninModule.configure === 'function') {
    GoogleSigninModule.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
    isSupported = true;
  }
} catch (e) {
  // Expo Go standard app does not contain native RNGoogleSignin native module.
  isSupported = false;
}

export const isGoogleAuthSupported = () => isSupported;
export const GoogleSignin = GoogleSigninModule;
export const statusCodes = statusCodesEnum;

export const performGoogleSignIn = async () => {
  if (!isSupported || !GoogleSigninModule) {
    showGlassAlert(
      'Expo Go Limitation',
      'Native Google Sign-In is not supported in the standard Expo Go app. Please use Email/Password sign in, or create an Expo Development Build (eas build).',
      undefined,
      'warning'
    );
    return null;
  }

  await GoogleSigninModule.hasPlayServices();
  const userInfo = await GoogleSigninModule.signIn();
  return userInfo?.data?.idToken || null;
};
