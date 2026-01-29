/**
 * Feature Detector
 * 
 * Detects common features and patterns in code.
 */

import { SourceFile, SyntaxKind } from 'ts-morph';
import type { DetectedFeature } from '@kodex/shared';

/**
 * Feature detection patterns
 */
interface FeaturePattern {
  id: string;
  patterns: RegExp[];
  confidence: number;
}

const FEATURE_PATTERNS: FeaturePattern[] = [
  // Authentication
  {
    id: 'authentication.login-logout',
    patterns: [/login/i, /logout/i, /sign[-_]?in/i, /sign[-_]?out/i, /auth/i],
    confidence: 0.9,
  },
  {
    id: 'authentication.password-reset',
    patterns: [/password[-_]?reset/i, /forgot[-_]?password/i, /reset[-_]?password/i],
    confidence: 0.95,
  },
  {
    id: 'authentication.signup-registration',
    patterns: [/sign[-_]?up/i, /register/i, /create[-_]?account/i, /registration/i],
    confidence: 0.9,
  },
  {
    id: 'authentication.two-factor-auth',
    patterns: [/2fa/i, /two[-_]?factor/i, /mfa/i, /authenticator/i, /totp/i, /otp/i],
    confidence: 0.95,
  },
  {
    id: 'authentication.session-management',
    patterns: [/session/i, /active[-_]?devices/i, /logout[-_]?all/i],
    confidence: 0.7,
  },

  // Navigation
  {
    id: 'navigation.getting-started',
    patterns: [/onboarding/i, /welcome/i, /getting[-_]?started/i, /tutorial/i],
    confidence: 0.9,
  },
  {
    id: 'navigation.keyboard-shortcuts',
    patterns: [/shortcut/i, /hotkey/i, /useHotkeys/i, /key[-_]?binding/i],
    confidence: 0.95,
  },
  {
    id: 'navigation.search',
    patterns: [/search/i, /command[-_]?palette/i, /quick[-_]?actions/i],
    confidence: 0.8,
  },

  // Data
  {
    id: 'data.import-export',
    patterns: [/import/i, /export/i, /download/i, /csv/i, /excel/i],
    confidence: 0.8,
  },
  {
    id: 'data.autosave',
    patterns: [/auto[-_]?save/i, /draft/i, /unsaved[-_]?changes/i],
    confidence: 0.9,
  },
  {
    id: 'data.filtering-sorting',
    patterns: [/filter/i, /sort/i, /order[-_]?by/i],
    confidence: 0.7,
  },

  // Settings
  {
    id: 'settings.profile-management',
    patterns: [/profile/i, /account[-_]?settings/i, /update[-_]?profile/i],
    confidence: 0.85,
  },
  {
    id: 'settings.notifications',
    patterns: [/notification/i, /email[-_]?pref/i, /push[-_]?notif/i, /alert[-_]?settings/i],
    confidence: 0.9,
  },
  {
    id: 'settings.theme-appearance',
    patterns: [/theme/i, /dark[-_]?mode/i, /appearance/i, /light[-_]?mode/i],
    confidence: 0.9,
  },
  {
    id: 'settings.language-locale',
    patterns: [/language/i, /locale/i, /i18n/i, /internationalization/i],
    confidence: 0.85,
  },

  // Errors
  {
    id: 'errors.error-boundary',
    patterns: [/error[-_]?boundary/i, /error[-_]?page/i, /error[-_]?handler/i],
    confidence: 0.9,
  },
  {
    id: 'errors.connection-issues',
    patterns: [/offline/i, /network[-_]?error/i, /connection[-_]?lost/i, /reconnect/i],
    confidence: 0.9,
  },
  {
    id: 'errors.not-found',
    patterns: [/404/i, /not[-_]?found/i, /page[-_]?not[-_]?found/i],
    confidence: 0.95,
  },

  // Billing
  {
    id: 'billing.subscription',
    patterns: [/subscription/i, /pricing/i, /plan/i, /upgrade/i, /downgrade/i],
    confidence: 0.85,
  },
  {
    id: 'billing.payment-methods',
    patterns: [/payment/i, /credit[-_]?card/i, /billing/i, /stripe/i],
    confidence: 0.9,
  },

  // Integrations
  {
    id: 'integrations.api-access',
    patterns: [/api[-_]?key/i, /api[-_]?token/i, /access[-_]?token/i],
    confidence: 0.9,
  },
  {
    id: 'integrations.webhooks',
    patterns: [/webhook/i, /webhook[-_]?config/i, /webhook[-_]?url/i],
    confidence: 0.95,
  },
  {
    id: 'integrations.sso',
    patterns: [/sso/i, /saml/i, /oidc/i, /single[-_]?sign[-_]?on/i],
    confidence: 0.95,
  },

  // Collaboration
  {
    id: 'collaboration.inviting-members',
    patterns: [/invite/i, /add[-_]?member/i, /team[-_]?invite/i],
    confidence: 0.9,
  },
  {
    id: 'collaboration.sharing',
    patterns: [/share/i, /share[-_]?link/i, /public[-_]?link/i],
    confidence: 0.85,
  },
  {
    id: 'collaboration.comments',
    patterns: [/comment/i, /mention/i, /thread/i],
    confidence: 0.8,
  },
];

/**
 * Detect features in a source file
 */
export function detectFeatures(
  sourceFile: SourceFile,
  relativePath: string
): DetectedFeature[] {
  const features: DetectedFeature[] = [];
  const fileContent = sourceFile.getFullText();
  const filePath = relativePath;

  // Check each pattern
  for (const pattern of FEATURE_PATTERNS) {
    const evidence: DetectedFeature['evidence'] = [];

    for (const regex of pattern.patterns) {
      // Check file path
      if (regex.test(filePath)) {
        evidence.push({
          pattern: regex.source,
          sourceFile: relativePath,
          line: 1,
        });
      }

      // Check file content
      const matches = fileContent.matchAll(new RegExp(regex, 'gi'));
      for (const match of matches) {
        if (match.index !== undefined) {
          const line = getLineNumber(fileContent, match.index);
          evidence.push({
            pattern: match[0],
            sourceFile: relativePath,
            line,
          });
        }
      }
    }

    // If we found evidence, add the feature
    if (evidence.length > 0) {
      // Adjust confidence based on amount of evidence
      let confidence = pattern.confidence;
      if (evidence.length >= 3) confidence = Math.min(confidence + 0.05, 1);
      if (evidence.length >= 5) confidence = Math.min(confidence + 0.05, 1);

      features.push({
        id: pattern.id,
        confidence,
        evidence: evidence.slice(0, 10), // Limit evidence items
      });
    }
  }

  return features;
}

/**
 * Get line number from character index
 */
function getLineNumber(content: string, index: number): number {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}
