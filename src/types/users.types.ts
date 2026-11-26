import * as z from 'zod';

const usersKind = z.enum(['person', 'service']);

export const usersIdentity = z.object({
  login: z.string().min(1),
  kind: usersKind,
});

export type UsersIdentity = z.infer<typeof usersIdentity>;
