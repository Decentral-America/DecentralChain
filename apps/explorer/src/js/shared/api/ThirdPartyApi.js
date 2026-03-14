export const thirdPartyApi = (antiSpamUrl, decompilerUrl) => ({
  antispamList: () =>
    fetch(antiSpamUrl, { signal: AbortSignal.timeout(30_000) }).then((res) => {
      if (!res.ok) throw new Error(`Antispam list request failed: ${res.status}`);
      return res.json();
    }),
  decompileScript: (scriptBase64) =>
    fetch(decompilerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scriptBase64),
      signal: AbortSignal.timeout(30_000),
    }).then((res) => {
      if (!res.ok) throw new Error(`Decompile request failed: ${res.status}`);
      return res.json();
    }),
});
