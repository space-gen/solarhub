import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';

const TOKEN_KEY = 'solarhub_app_gh_token';
const USER_KEY = 'solarhub_app_gh_user';

type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<GitHubUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GitHubUser;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function storeCredentials(token: string, user: GitHubUser): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function startGitHubAuthSession(clientId: string): Promise<string> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'solarhub' });
  const query = new URLSearchParams({
    client_id: clientId,
    scope: 'public_repo',
    redirect_uri: redirectUri,
  });
  const authUrl = `https://github.com/login/oauth/authorize?${query.toString()}`;
  const result = await AuthSession.startAsync({ authUrl });
  if (result.type !== 'success' || !result.params?.code) {
    throw new Error('GitHub auth cancelled or failed.');
  }
  return result.params.code;
}
