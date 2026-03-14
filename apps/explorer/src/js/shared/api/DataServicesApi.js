export const dataServicesApi = (baseUrl) => {
  const get = (url) => fetch(baseUrl + url).then((res) => res.json());

  return {
    aliases: {
      address: (alias) => get(`/aliases/${encodeURI(alias)}`),
    },
  };
};
