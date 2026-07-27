import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolve API base URL for Expo Go / emulators / simulators.
 * Physical devices must use the PC LAN IP, not localhost.
 */
const resolveDevHost = () => {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
    Constants.linkingUri
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const normalized = String(candidate)
        .replace(/^[a-z]+:\/\//i, '')
        .split('/')[0];
      const host = normalized.split(':')[0];
      if (
        host
        && host !== 'localhost'
        && host !== '127.0.0.1'
        && host !== '10.0.2.2'
        && host !== '[::1]'
      ) {
        return host;
      }
    } catch (error) {
      // ignore and try next candidate
    }
  }

  return null;
};

const extraUrl = Constants.expoConfig?.extra?.apiBaseUrl;
const envUrl = process.env.EXPO_PUBLIC_API_URL;
const lanHost = resolveDevHost();

const defaultUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:4000'
  : 'http://localhost:4000';

export const API_BASE_URL = envUrl
  || (lanHost ? `http://${lanHost}:4000` : null)
  || (extraUrl && !/localhost|127\.0\.0\.1/i.test(extraUrl) ? extraUrl : null)
  || defaultUrl;

export const resolveAssetUrl = (path) => {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
