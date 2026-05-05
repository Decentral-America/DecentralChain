import { get } from 'node:https';
import { Effect } from 'effect';
import { InitError } from '../../errorHandling';

type MatcherSettings = {
  priceAssets: string[];
  orderVersions: number[];
};

const err = (matcherSettingsURL: string, originalError?: Error) =>
  new InitError(
    `Unable to get matcher settings for ${matcherSettingsURL}. Please check the MATCHER_SETTINGS_URL env variable.`,
    { error: originalError },
  );

export const loadMatcherSettings = (
  matcherSettingsURL: string,
): Effect.Effect<MatcherSettings, InitError> =>
  Effect.async<MatcherSettings, InitError>((resume) => {
    get(matcherSettingsURL, (res) => {
      let rawData = '';
      res.on('data', (chunk: any) => (rawData += chunk));
      res.on('end', () => {
        try {
          const settings: MatcherSettings = JSON.parse(rawData) as MatcherSettings;
          resume(Effect.succeed(settings));
        } catch (e) {
          resume(Effect.fail(err(matcherSettingsURL, e instanceof Error ? e : undefined)));
        }
      });
    }).on('error', (error) => resume(Effect.fail(err(matcherSettingsURL, error))));
  });
