import { USERS } from '@/services/users/users.constants';
import { usersIdentity } from '@/types/users.types';
import type { UsersIdentity } from '@/types/users.types';

export function usersOfRequest(headers: Headers): UsersIdentity | null {
  const header = headers.get(USERS.userHeader);

  return header ? (usersIdentity.safeParse(JSON.parse(decodeURIComponent(header))).data ?? null) : null;
}

export function usersAccessToken(headers: Headers) {
  const cookie = headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${USERS.accessCookie}=`));

  return headers.get('cf-access-jwt-assertion') ?? cookie?.slice(USERS.accessCookie.length + 1) ?? null;
}
