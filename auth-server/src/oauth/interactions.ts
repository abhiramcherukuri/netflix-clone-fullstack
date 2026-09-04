import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { oidcProvider } from './provider.ts';
import { OIDC_ERRORS, OIDC_MESSAGES } from './oauth.constants.ts';
import { userService, USER_ROLES } from '#modules/users';
import { logger } from '#utils';

const router = Router();

/**
 * GET /interaction/:uid
 * Main interaction handler - renders login or consent based on oidc-provider prompt
 */
router.get('/:uid', async (req: Request, res: Response): Promise<void> => {
  try {
    const interaction = await oidcProvider.interactionDetails(req, res);
    const { uid, prompt, params, session } = interaction;

    // 1. Handle Login Prompt
    if (prompt.name === 'login') {
      res.render('login', {
        uid,
        params,
        error: null,
        email: '',
      });
      return;
    }

    // 2. Handle Consent Prompt (Auto-grant for first-party client "netflix-web")
    if (prompt.name === 'consent') {
      let grant = interaction.grantId
        ? await oidcProvider.Grant.find(interaction.grantId)
        : undefined;

      if (!grant) {
        grant = new oidcProvider.Grant({
          accountId: session!.accountId,
          clientId: params.client_id as string,
        });
      }

      if (prompt.details.missingOIDCScope) {
        grant.addOIDCScope((prompt.details.missingOIDCScope as string[]).join(' '));
      }
      if (prompt.details.missingOIDCClaims) {
        grant.addOIDCClaims(prompt.details.missingOIDCClaims as string[]);
      }

      const grantId = await grant.save();
      const consent = { grantId };

      await oidcProvider.interactionFinished(
        req,
        res,
        { consent },
        { mergeWithLastSubmission: true },
      );
      return;
    }

    // Fallback: render error for unhandled prompt
    res.render('error', {
      message: `${OIDC_ERRORS.UNHANDLED_PROMPT_PREFIX}${prompt.name}`,
    });
  } catch (error) {
    logger.error('Failed to process OIDC interaction:', { error });
    res.status(500).render('error', {
      message: OIDC_MESSAGES.SESSION_EXPIRED,
    });
  }
});

router.get('/:uid/login', (req: Request, res: Response): void => {
  res.redirect(`/interaction/${req.params.uid}`);
});

/**
 * POST /interaction/:uid/login
 * Handles submission of credentials from login.ejs
 */
router.post(
  '/:uid/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.params;
      const { email, password } = req.body;

      let user;
      try {
        user = await userService.authenticate({ email, password });
      } catch {
        // Authentication failed: re-render login with friendly error message
        res.status(401).render('login', {
          uid,
          error: OIDC_MESSAGES.INVALID_CREDENTIALS,
          email,
        });

        return;
      }

      // Inform oidc-provider that the login prompt is fulfilled
      const result = {
        login: {
          accountId: user._id.toString(),
        },
      };

      await oidcProvider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /interaction/:uid/register
 * Renders the registration view for the ongoing interaction
 */
router.get('/:uid/register', (req: Request, res: Response): void => {
  res.render('register', {
    uid: req.params.uid,
    error: null,
    name: '',
    email: '',
  });
});

/**
 * POST /interaction/:uid/register
 * Handles user sign-up and immediately finishes login interaction
 */
router.post(
  '/:uid/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.params;
      const { name, email, password } = req.body;

      let newUser;
      try {
        newUser = await userService.register({ name, email, password, role: USER_ROLES.USER });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : OIDC_MESSAGES.REGISTRATION_FAILED;
        res.status(400).render('register', {
          uid,
          error: errorMessage,
          name,
          email,
        });
        return;
      }

      // Automatically fulfill login interaction for the newly registered user
      const result = {
        login: {
          accountId: newUser.id,
        },
      };

      await oidcProvider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /interaction/:uid/abort
 * Allows user to cancel the login process
 */
router.get(
  '/:uid/abort',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = {
        error: OIDC_ERRORS.ACCESS_DENIED,
        error_description: OIDC_ERRORS.USER_ABORTED,
      };

      await oidcProvider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (error) {
      next(error);
    }
  },
);

export const interactionRouter = router;
