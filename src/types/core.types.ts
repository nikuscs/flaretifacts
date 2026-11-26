import * as z from 'zod';

export const coreAuthClaims = z.object({
  email: z.string().trim().toLowerCase().min(1).optional().catch(undefined)
    .describe('set on a person\'s Access token, verified by the identity provider'),
  common_name: z.string().trim().toLowerCase().min(1).optional().catch(undefined)
    .describe('the client id of the Access service token; only on service token logins'),
});

export const coreDevEnv = z.object({
  DEV_USER_EMAIL: z.string().trim().toLowerCase().pipe(z.email())
    .describe('who local dev signs in as, from .dev.vars; Cloudflare Access does not run locally'),
});

export interface CoreAuthVerifyParams {
  token: string | null;
  teamDomain: string;
  audience: string;
}
