export const thirdPartyApi = (antiSpamUrl, decompilerUrl) => ({
  antispamList: () =>
    fetch(antiSpamUrl, { signal: AbortSignal.timeout(30_000) }).then((res) => res.json()),
  decompileScript: (scriptBase64) =>
    fetch(decompilerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scriptBase64),
      signal: AbortSignal.timeout(30_000),
    }).then((res) => res.json()),
});
