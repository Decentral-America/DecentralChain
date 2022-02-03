const nodeUrl = 'https://mainnet-node.decentralchain.io';

export default {
    networkId: 'mainnet',
    displayName: 'Mainnet',
    apiBaseUrl: nodeUrl,
    useCustomRequestConfig: true,
    dataServicesBaseUrl: 'https://data-service.decentralchain.io/v0',
    spamListUrl: 'https://raw.githubusercontent.com/Decentral-America/dcc-token-filters/main/scam-v1.csv',
    nodes: [{url: nodeUrl, maintainer: 'DCC',showAsLink: true}
    , {
        url: "https://mainnet-node1.decentralchain.io",
        maintainer: "DCC",
        showAsLink: true,
    },
        {
            url: "https://mainnet-node2.decentralchain.io",
            maintainer: "DCC",
            showAsLink: true,
        },
        {
            url: "https://mainnet-node2.decentralchain.io",
            maintainer: "DCC",
            showAsLink: true,
        }
    ]
};
