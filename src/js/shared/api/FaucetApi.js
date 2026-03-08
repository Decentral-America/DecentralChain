export const faucetApi = (baseUrl) => ({
  requestMoney: (address, captchaToken) => {
    return fetch(`${baseUrl}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: captchaToken,
        recipient: address,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed with status ${res.status}`);
      }
      return res.json();
    });
  },
});
