import React from 'react';

import type { Language } from '@/types';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Layout & Navigation
    appName: 'DecentralChain',
    appSubtitle: 'Blockchain Explorer',

    // Navigation
    dashboard: 'Dashboard',
    blocks: 'Blocks',
    blockFeed: 'Block Feed',
    unconfirmed: 'Unconfirmed',
    address: 'Address',
    assets: 'Assets',
    distribution: 'Distribution',
    transactionMap: 'Transaction Map',
    networkStats: 'Network Stats',
    networkMap: 'Network Map',
    peers: 'Peers',
    node: 'Node',

    // Search
    search: 'Search',

    // Dashboard
    networkOverview: 'Network Overview',
    realtimeStats: 'Real-time blockchain statistics and metrics',
    autoRefresh: 'Auto-refresh',
    currentHeight: 'Current Height',
    nodeVersion: 'Node Version',
    lastBlock: 'Last Block',
    latestBlock: 'Latest Block',
    blockId: 'Block ID',
    copyBlockId: 'Copy Block ID',
    height: 'Height',
    transactions: 'Transactions',
    timestamp: 'Timestamp',
    reward: 'Reward',
    generator: 'Generator',
    recentBlocks: 'Recent Blocks',
    time: 'Time',
    txs: 'Txs',
    avgBlockTime: 'Avg Block Time',
    txAbbreviation: 'tx',
    dexTradingPairs: 'DEX Trading Pairs',
    noTradingPairs: 'No trading pairs available',
    pair: 'Pair',
    lastPrice: 'Last Price',
    change24h: 'Change 24h',
    volume24h: 'Volume 24h',
    trades: 'Trades',

    transactionsPerSecond: 'Transactions/Second',
    avgTxPerBlock: 'Avg Tx per Block',
    transactionVolumeTrend: 'Transaction Volume Trend (Last 24h Estimate)',
    transactionsPerBlock: 'Transactions per Block (Last 50 Blocks)',
    blockTime: 'Block Time (Last 50 Blocks)',
    networkUtilization: 'Network Utilization - Block Size (Last 50 Blocks)',
    totalTransactions: 'Total Transactions',
    blocksAnalyzed: 'Blocks Analyzed',
    avgBlockSize: 'Avg Block Size',
    maxBlockSize: 'Max Block Size',
    nodeStatus: 'Node Status',
    configureNode:
      'Configure your custom node endpoint. Leave empty to use the default public node.',
    corsNote:
      'Local nodes (127.0.0.1) may fail the browser test due to CORS restrictions, but will still work within the application. Public HTTPS nodes work best for browser testing.',

    // Connection Status
    blockchainHeight: 'Blockchain Height',
    stateHeight: 'State Height',

    assetLogoDesc:
      'Add a custom logo to your asset. Once submitted, an admin will review and approve your request.',
    uploadLogoDesc:
      'Upload a logo for your asset. The logo will be reviewed by an admin before appearing on the explorer.',
    assetId: 'Asset ID',
    enterAssetId: 'Enter asset ID...',

    // Logo Requests

    // Popular Features
    distributionAnalysis: 'Distribution Analysis',

    // Blocks Page
    blockExplorer: 'Block Explorer',
    showingBlocks: 'Showing blocks',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {current} of {total}',

    // Transaction Types

    // Common
    status: 'Status',
    amount: 'Amount',
    fee: 'Fee',
    type: 'Type',
    sender: 'Sender',
    recipient: 'Recipient',
    back: 'Back',

    // Time

    // Errors

    blockHeight: 'Block Height',
    seconds: 'Seconds',
    bytes: 'Bytes',
    configureNodeEndpoint:
      'Configure your custom node endpoint. Leave empty to use the default public node.',
    corsRestriction:
      'Local nodes (127.0.0.1) may fail the browser test due to CORS restrictions, but will still work within the application. Public HTTPS nodes work best for browser testing.',

    withdrawalSubmitted:
      'Withdrawal request submitted successfully! An admin will process your request shortly.',

    transactionDistribution: 'Transaction Distribution (Network)',
    transactionId: 'Transaction ID',
    transactionHistoryUnavailable:
      'Transaction history is currently unavailable. The recent transactions API endpoint is not responding.',

    casinoRevenueExplanation:
      'As a node owner with {percent}% ownership of your node, you receive profits from the CR Coin Casino app running on the DecentralChain network. The total casino profit of {total} is divided equally among all {nodes} nodes in the network ({perNode} per node). Your share is then calculated based on your {percent}% ownership, resulting in {yourShare} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',

    configureNodeUrl:
      'Please configure your node URL in the "Node Configuration" tab to use these features.',

    assetAlreadyHasLogo:
      'This asset already has an approved logo. You cannot submit a new request to change it.',

    // Popular Features Section

    aboutYourCasinoRevenue:
      'As a node owner with {ownership}% ownership of your node, you receive profits from the CR Coin Casino app running on the DecentralChain network. The total casino profit of {totalPnl} is divided equally among all {totalNodes} nodes in the network ({perNode} per node). Your share is then calculated based on your {ownership}% ownership, resulting in {yourProfit} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',
    asset: 'Asset',

    asNodeOwner:
      'As a node owner with {ownership}% ownership of your node, you receive profits from the CR Coin Casino application running on the DecentralChain network. The total casino profit of {totalProfit} is divided equally among all {totalNodes} nodes in the network ({profitPerNode} per node). Your share is then calculated based on your {ownership}% ownership, resulting in {yourProfit} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',

    // Dashboard - Asset Activity
    // Note: Some of these keys are now also defined under the main Dashboard section as per outline.
    // If there's a conflict, the last definition in the object takes precedence.
    // However, for clarity and adherence to instructions, existing keys here are preserved.
    noAssetActivity: 'No asset activity data available',
    // transactionDistribution: "Transaction Distribution" - ALREADY EXISTS
    topAssets: 'Top Assets',
    transferred: 'transferred',
    txsShort: 'tx',
    uniqueAssetsTraded: 'Unique Assets Traded',
    transactionVolume: 'Transaction Volume',

    // BlockFeed
    liveBlockFeed: 'Live Block Feed',
    realtimeBlockUpdates: 'Real-time block updates from the blockchain',
    pauseFeed: 'Pause Feed',
    resumeFeed: 'Resume Feed',
    monitoringNewBlocks: 'Monitoring for new blocks',
    hideTransactions: 'Hide Transactions',
    showTransactions: 'Show Transactions',
    viewDetails: 'View Details',
    noTransactionsInBlock: 'No transactions in this block',

    // Transaction
    searchTransaction: 'Search Transaction',
    enterTransactionId: 'Enter transaction ID...',
    transactionDetails: 'Transaction Details',
    confirmed: 'Confirmed',
    transactionInformation: 'Transaction Information',
    // transactionId: "Transaction ID", - ALREADY EXISTS
    copyTransactionId: 'Copy transaction ID',
    version: 'Version',
    // blockHeight: "Block Height", - ALREADY EXISTS
    transactionParties: 'Transaction Parties',
    // sender: "Sender", - ALREADY EXISTS
    // recipient: "Recipient", - ALREADY EXISTS
    // amount: "Amount", - ALREADY EXISTS
    rawTransactionData: 'Raw Transaction Data',
    transactionNotFound:
      'Transaction not found. It may be invalid or not yet propagated through the network.',

    // UnconfirmedTransactions
    unconfirmedTransactions: 'Unconfirmed Transactions',
    transactionsWaitingBlocks: 'Transactions waiting to be included in blocks',
    pendingTransactions: 'Pending Transactions',
    searchByIdOrAddress: 'Search by ID or address...',
    from: 'From',
    to: 'To',
    // fee: "Fee", - ALREADY EXISTS
    failedToLoadUnconfirmed: 'Failed to load unconfirmed transactions',
    noUnconfirmedTransactions: 'No unconfirmed transactions',
    noTransactionsMatch: 'No transactions match your search',

    // Address
    searchAddress: 'Search Address',
    enterAddress: 'Enter address...',
    addressDetails: 'Address Details',
    copyAddress: 'Copy address',
    assetBalances: 'Asset Balances',
    units: 'units',
    noBalancesFound: 'No balances found',
    recentTransactions: 'Recent Transactions',
    searchBySenderRecipient: 'Search by ID, sender, recipient...',
    allTypes: 'All Types',
    nftCollection: 'NFT Collection',
    unnamedNFT: 'Unnamed NFT',
    noNFTsFound: 'No NFTs found',
    activeLeases: 'Active Leases',
    leaseId: 'Lease ID',
    active: 'Active',
    noActiveLeases: 'No active leases',

    // Asset
    searchAsset: 'Search Asset',
    // enterAssetId: "Enter Asset ID...", - ALREADY EXISTS
    assetDetails: 'Asset Details',
    assetActivity: 'Asset Activity (Last 24h Est.)',
    assetInformation: 'Asset Information',
    assetName: 'Asset Name',
    decimals: 'Decimals',
    copyAssetId: 'Copy asset ID',
    totalQuantity: 'Total Quantity',
    reissuable: 'Reissuable',
    yes: 'Yes',
    no: 'No',
    issuer: 'Issuer',
    description: 'Description',
    // distributionAnalysis: "Distribution Analysis", - ALREADY EXISTS
    exploreHolderDistribution: 'Explore Holder Distribution',
    useAdvancedTool: 'Use our advanced tool to analyze holder tiers, concentration, and more.',
    launchDistributionTool: 'Launch Distribution Tool',
    rawAssetData: 'Raw Asset Data',
    failedToLoadAsset: 'Failed to load asset',

    // DistributionTool
    assetDistributionTool: 'Asset Distribution Tool',
    comprehensiveAnalysis: 'Comprehensive Analysis',
    toolFetchesAllHolders:
      'This tool fetches ALL holders by paginating through the API (1000 addresses per page). For best results, use a height at least {buffer} blocks behind current ({current}). Valid range: {min} to {max}.',
    heightOptional: 'Height (Optional)',
    loadingHeight: 'Loading...',
    fetchDistribution: 'Fetch Distribution',
    fetching: 'Fetching...',
    morePagesLoading: 'More pages loading...',
    failedToFetchData: 'Failed to fetch data.',
    troubleshooting: 'Troubleshooting:',
    useHeightOrOlder: 'Use height {height} or older (within range {min}-{max})',
    supply: 'Supply',
    totalHolders: 'Total Holders',
    uniqueAddresses: 'Unique Addresses (All Pages)',
    giniCoefficient: 'Gini Coefficient',
    highConcentration: 'High concentration',
    mediumConcentration: 'Medium concentration',
    lowConcentration: 'Low concentration',
    holderTiers: 'Holder Tiers',
    holderList: 'Holder List',
    rank: 'Rank',
    balance: 'Balance',
    supplyPercent: '% Supply',
    cumulativePercent: 'Cumulative %',
    noResultsFound: 'No results found.',
    prev: 'Prev',
    // next: "Next", - ALREADY EXISTS
    // pageOf: "Page {current} of {total}", - ALREADY EXISTS

    // TransactionMap
    visualizeTransactionFlow: 'Visualize transaction flow between addresses',
    // nodeInformation: "Node Information", - ALREADY EXISTS
    // DistributionTool - new additions
    analyzeHolderDistribution: 'Analyze the holder distribution of any asset',
    fetchesAllHolders:
      'This tool fetches ALL holders by paginating through the API (1000 addresses per page).',
    forBestResults:
      'For best results, use a height at least {buffer} blocks behind current ({current}).',
    validRange: 'Valid range: {min} to {max}.',
    demoMode: 'Demo Mode',
    defaultHeightValue: 'Default: {height}',
    fetchingData: 'Fetching distribution data...',
    pagesFetched: 'Page {pages} • {holders} holders found',
    errorOccurred: 'Error',
    ensureCorrectAssetId: '• Ensure the asset ID is correct',
    tryOlderHeight: "• Try a height that's {buffer}+ blocks behind current height {current}",
    snapshotAt: 'Snapshot at height {height}',
    totalInParens: '({total} Total)',
    showingHolders: 'Showing {from} to {to} of {total} holders',

    // TransactionMap - new additions
    transactionMapTitle: 'Transaction Network Map',
    demoDataNote: 'Demo Data',
    demoDataDescription:
      'This map displays simulated transaction data for demonstration purposes. In a production environment, it would show real transaction relationships from the blockchain.',

    // NetworkStatistics - new additions
    networkStatisticsTitle: 'Network Statistics',
    advancedAnalytics: 'Advanced analytics and performance metrics',
    nodeInformation: 'Node Information',
    summaryStats: 'Summary Statistics (Last 100 Blocks)',

    // NetworkMap - new additions
    networkMapTitle: 'Network Map',
    geographicalDistribution: 'Geographical distribution of connected peers',
    simulatedData:
      'This map uses simulated geolocation data for demonstration purposes. In a production environment, peer IP addresses would be geolocated using a dedicated geolocation service. The actual locations may differ significantly.',
    connectedPeers: 'Connected Peers',
    allKnownPeers: 'All Known Peers',
    regionsSimulated: 'Regions (Simulated)',
    peerDistribution: 'Peer Distribution',
    connectedPeersList: 'Connected Peers',
    unknownNode: 'Unknown Node',
    addressColon: 'Address:',
    locationColon: 'Location:',
    simulated: '(simulated)',

    // Peers - new additions
    networkPeers: 'Network Peers',
    viewPeerConnections: 'View network peer connections and status',
    connected: 'Connected',
    allPeers: 'All Peers',
    suspended: 'Suspended',
    blacklisted: 'Blacklisted',
    peerDetails: 'Peer Details',
    declaredAddress: 'Declared Address',

    // Node Configuration

    nodeName: 'Node Name',
    lastSeen: 'Last Seen',
    noPeersFound: 'No peers found',

    // Node - new additions
    nodeInformationTitle: 'Node Information',
    viewNodeStatus: 'View node status and configuration',
    blockGeneratorStatus: 'Block Generator Status',
    historyReplier: 'History Replier',
    enabled: 'Enabled',
    disabled: 'Disabled',
    inactive: 'Inactive',
    updatedTimestamp: 'Updated Timestamp',
    updatedDate: 'Updated Date',
    rawNodeData: 'Raw Node Data',

    // DEX Pairs
    dexPairs: 'DEX Pairs',
    exploreDexPairs: 'Explore all available trading pairs on the decentralized exchange',
    totalPairs: 'Total Pairs',
    totalVolume24h: 'Total Volume (24h)',
    totalTrades24h: 'Total Trades (24h)',
    allTradingPairs: 'All Trading Pairs',
    searchPairs: 'Search pairs...',
    high24h: '24h High',
    low24h: '24h Low',

    dccReportsDesc:
      'Access comprehensive monthly reports about the DecentralChain ecosystem, including blockchain metrics, user growth, and network performance.',
    viewFullReport: 'View Full Report',
    totalUsers: 'Total Users',
    newUsers: 'New Users',
    totalVolume: 'Total Volume',
    totalRevenue: 'Total Revenue',
    tryAgain: 'Try Again',

    reportsCacheDesc:
      'Manage cached report data. When reports are updated or regenerated, you can clear the cache to force all users to fetch the latest versions.',
    refreshDccReportsDesc:
      'Clear cache for all DCC Monthly Ecosystem Reports (English and Spanish)',
    reportsCacheCleared:
      'Reports cache cleared! All users will fetch fresh data on their next visit.',
  },

  es: {
    // Layout & Navigation
    appName: 'DecentralChain',
    appSubtitle: 'Explorador de Blockchain',

    // Navigation
    dashboard: 'Panel',
    blocks: 'Bloques',
    blockFeed: 'Feed de Bloques',
    unconfirmed: 'No Confirmadas',
    address: 'Dirección',
    assets: 'Activos',
    distribution: 'Distribución',
    transactionMap: 'Mapa de Transacciones',
    networkStats: 'Estadísticas de Red',
    networkMap: 'Mapa de Red',
    peers: 'Pares',
    node: 'Nodo',

    // Search
    searchPlaceholder:
      'Buscar por altura de bloque, ID de bloque, ID de transacción, dirección o ID de activo...',
    search: 'Buscar',

    // Dashboard
    networkOverview: 'Resumen de la Red',
    realtimeStats: 'Estadísticas y métricas de blockchain en tiempo real',
    autoRefresh: 'Actualización Automática',
    currentHeight: 'Altura Actual',
    nodeVersion: 'Versión del Nodo',
    lastBlock: 'Último Bloque',
    latestBlock: 'Bloque Más Reciente',
    blockId: 'ID del Bloque',
    copyBlockId: 'Copiar ID del Bloque',
    height: 'Altura',
    transactions: 'Transacciones',
    timestamp: 'Marca de Tiempo',
    reward: 'Recompensa',
    generator: 'Generador',
    recentBlocks: 'Bloques Recientes',
    time: 'Tiempo',
    txs: 'Txs',
    avgBlockTime: 'Tiempo Promedio de Bloque',
    txAbbreviation: 'tx',
    pair: 'Par',
    lastPrice: 'Último Precio',
    change24h: 'Cambio 24h',
    volume24h: 'Volumen 24h',
    trades: 'Operaciones',

    transactionsPerSecond: 'Transacciones/Segundo',
    avgTxPerBlock: 'Prom. Tx por Bloque',
    transactionVolumeTrend: 'Tendencia de Volumen de Transacciones (Estimación Últimas 24h)',
    transactionsPerBlock: 'Transacciones por Bloque (Últimos 50 Bloques)',
    blockTime: 'Tiempo de Bloque (Últimos 50 Bloques)',
    networkUtilization: 'Utilización de Red - Tamaño de Bloque (Últimos 50 Bloques)',
    totalTransactions: 'Total de Transacciones',
    blocksAnalyzed: 'Bloques Analizados',
    avgBlockSize: 'Tamaño Promedio de Bloque',
    maxBlockSize: 'Tamaño Máximo de Bloque',
    nodeStatus: 'Estado del Nodo',
    configureNode:
      'Configura tu endpoint de nodo personalizado. Déjalo vacío para usar el nodo público predeterminado.',
    corsNote:
      'Los nodos locales (127.0.0.1) pueden fallar la prueba del navegador debido a restricciones CORS, pero seguirán funcionando dentro de la aplicación. Los nodos públicos HTTPS funcionan mejor para pruebas en navegador.',

    // Connection Status
    blockchainHeight: 'Altura de Blockchain',
    stateHeight: 'Altura de Estado',

    assetLogoDesc:
      'Agrega un logo personalizado a tu activo. Una vez enviado, un administrador revisará y aprobará tu solicitud.',
    uploadLogoDesc:
      'Sube un logo para tu activo. El logo será revisado por un administrador antes de aparecer en el explorador.',
    assetId: 'ID de Activo',
    enterAssetId: 'Ingresa el ID de activo...',

    // Logo Requests

    // Popular Features
    distributionAnalysis: 'Análisis de Distribución',

    // Blocks Page
    blockExplorer: 'Explorador de Bloques',
    showingBlocks: 'Mostrando bloques',
    previous: 'Anterior',
    next: 'Siguiente',
    pageOf: 'Página {current} de {total}',

    // Transaction Types

    // Common
    status: 'Estado',
    amount: 'Cantidad',
    fee: 'Tarifa',
    type: 'Tipo',
    sender: 'Remitente',
    recipient: 'Destinatario',
    back: 'Atrás',

    // Time

    // Errors

    blockHeight: 'Altura de Bloque',
    seconds: 'Segundos',
    bytes: 'Bytes',
    configureNodeEndpoint:
      'Configura tu endpoint de nodo personalizado. Déjalo vacío para usar el nodo público predeterminado.',
    corsRestriction:
      'Los nodos locales (127.0.0.1) pueden fallar la prueba del navegador debido a restricciones CORS, pero seguirán funcionando dentro de la aplicación. Los nodos públicos HTTPS funcionan mejor para pruebas en navegador.',

    trackEarnings:
      'Rastrea tus ganancias y estadísticas de las aplicaciones que se ejecutan en tu nodo.',
    withdrawalSubmitted:
      '¡Solicitud de retiro enviada exitosamente! Un administrador procesará tu solicitud pronto.',

    transactionDistribution: 'Distribución de Transacciones (Red)',
    transactionId: 'ID de Transacción',
    transactionHistoryUnavailable:
      'El historial de transacciones no está disponible actualmente. El endpoint de la API de transacciones recientes no responde.',

    casinoRevenueExplanation:
      'Como propietario de nodo con {percent}% de propiedad de tu nodo, recibes ganancias de la aplicación CR Coin Casino que se ejecuta en la red DecentralChain. La ganancia total del casino de {total} se divide equitativamente entre todos los {nodes} nodos de la red ({perNode} por nodo). Tu parte se calcula luego en función de tu propiedad del {percent}%, lo que resulta en {yourShare} USD en ganancias. Todos los cálculos son transparentes y se basan en datos reales de depósitos/retiros del casino.',

    viewDetailedInfo:
      'Ver información detallada sobre el estado de tu nodo y los pares conectados.',
    configureNodeUrl:
      'Por favor configura la URL de tu nodo en la pestaña "Configuración de Nodo" para usar estas funciones.',

    assetAlreadyHasLogo:
      'Este activo ya tiene un logo aprobado. No puedes enviar una nueva solicitud para cambiarlo.',

    // Popular Features Section

    aboutYourCasinoRevenue:
      'Como propietario de nodo con {ownership}% de propiedad de tu nodo, recibes ganancias de la aplicación CR Coin Casino que se ejecuta en la red DecentralChain. El total casino profit of {totalPnl} is divided equally among all {totalNodes} nodes in the network ({perNode} per node). Your share is then calculated based on your {ownership}% ownership, resulting in {yourProfit} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',
    asset: 'Activo',

    asNodeOwner:
      'Como propietario de nodo con {ownership}% de propiedad de tu nodo, recibes ganancias de la aplicación CR Coin Casino que se ejecuta en la red DecentralChain. El total de ganancias del casino de {totalProfit} se divide equitativamente entre todos los {totalNodes} nodos en la red ({profitPerNode} por nodo). Tu participación se calcula entonces basándose en tu {ownership}% de propiedad, resultando en {yourProfit} USD en ganancias. Todos los cálculos son transparentes y se basan en datos reales de depósitos/retiros del casino.',

    // Dashboard - Asset Activity
    // Note: Some of these keys are now also defined under the main Dashboard section as per outline.
    // If there's a conflict, the last definition in the object takes precedence.
    // However, for clarity and adherence to instructions, existing keys here are preserved.
    noAssetActivity: 'No hay datos de actividad de activos disponibles',
    // transactionDistribution: "Distribución de Transacciones", - ALREADY EXISTS
    topAssets: 'Principales Activos',
    transferred: 'transferido',
    txsShort: 'tx',
    uniqueAssetsTraded: 'Activos Únicos Comerciados',
    transactionVolume: 'Volumen de Transacciones',

    // BlockFeed
    liveBlockFeed: 'Feed de Bloques en Vivo',
    realtimeBlockUpdates: 'Actualizaciones de bloques en tiempo real de la blockchain',
    pauseFeed: 'Pausar Feed',
    resumeFeed: 'Reanudar Feed',
    monitoringNewBlocks: 'Monitoreando nuevos bloques',
    hideTransactions: 'Ocultar Transacciones',
    showTransactions: 'Mostrar Transacciones',
    viewDetails: 'Ver Detalles',
    noTransactionsInBlock: 'No hay transacciones en este bloque',

    // Transaction
    searchTransaction: 'Buscar Transacción',
    enterTransactionId: 'Ingrese ID de transacción...',
    transactionDetails: 'Detalles de la Transacción',
    confirmed: 'Confirmado',
    transactionInformation: 'Información de la Transacción',
    // transactionId: "ID de Transacción", - ALREADY EXISTS
    copyTransactionId: 'Copiar ID de transacción',
    version: 'Versión',
    // blockHeight: "Altura del Bloque", - ALREADY EXISTS
    transactionParties: 'Partes de la Transacción',
    // sender: "Remitente", - ALREADY EXISTS
    // recipient: "Destinatario", - ALREADY EXISTS
    // amount: "Cantidad", - ALREADY EXISTS
    rawTransactionData: 'Datos Crudos de la Transacción',
    transactionNotFound:
      'Transacción no encontrada. Puede ser inválida o aún no propagada por la red.',

    // UnconfirmedTransactions
    unconfirmedTransactions: 'Transacciones No Confirmadas',
    transactionsWaitingBlocks: 'Transacciones esperando ser incluidas en bloques',
    pendingTransactions: 'Transacciones Pendientes',
    searchByIdOrAddress: 'Buscar por ID o dirección...',
    from: 'De',
    to: 'Para',
    // fee: "Tarifa", - ALREADY EXISTS
    failedToLoadUnconfirmed: 'Error al cargar transacciones no confirmadas',
    noUnconfirmedTransactions: 'No hay transacciones no confirmadas',
    noTransactionsMatch: 'Ninguna transacción coincide con tu búsqueda',

    // Address
    searchAddress: 'Buscar Dirección',
    enterAddress: 'Ingrese dirección...',
    addressDetails: 'Detalles de la Dirección',
    copyAddress: 'Copiar dirección',
    assetBalances: 'Saldos de Activos',
    units: 'unidades',
    noBalancesFound: 'No se encontraron saldos',
    recentTransactions: 'Transacciones Recientes',
    searchBySenderRecipient: 'Buscar por ID, remitente, destinatario...',
    allTypes: 'Todos los Tipos',
    nftCollection: 'Colección de NFT',
    unnamedNFT: 'NFT Sin Nombre',
    noNFTsFound: 'No se encontraron NFTs',
    activeLeases: 'Arrendamientos Activos',
    leaseId: 'ID de Arrendamiento',
    active: 'Activo',
    noActiveLeases: 'No hay arrendamientos activos',

    // Asset
    searchAsset: 'Buscar Activo',
    // enterAssetId: "Ingrese ID del Activo...", - ALREADY EXISTS
    assetDetails: 'Detalles del Activo',
    assetActivity: 'Actividad del Activo (Últ. 24h Est.)',
    assetInformation: 'Información del Activo',
    assetName: 'Nombre del Activo',
    decimals: 'Decimales',
    copyAssetId: 'Copiar ID del activo',
    totalQuantity: 'Cantidad Total',
    reissuable: 'Reemitible',
    yes: 'Sí',
    no: 'No',
    issuer: 'Emisor',
    description: 'Descripción',
    // distributionAnalysis: "Análisis de Distribución", - ALREADY EXISTS
    exploreHolderDistribution: 'Explorar Distribución de Tenedores',
    useAdvancedTool:
      'Usa nuestra herramienta avanzada para analizar niveles de tenedores, concentración y más.',
    launchDistributionTool: 'Lanzar Herramienta de Distribución',
    rawAssetData: 'Datos Crudos del Activo',
    failedToLoadAsset: 'Error al cargar activo',

    // DistributionTool
    assetDistributionTool: 'Herramienta de Distribución de Activos',
    comprehensiveAnalysis: 'Análisis Integral',
    toolFetchesAllHolders:
      'Esta herramienta obtiene TODOS los tenedores paginando a través de la API (1000 direcciones por página). Para mejores resultados, use una altura de al menos {buffer} bloques detrás de la actual ({current}). Rango válido: {min} a {max}.',
    heightOptional: 'Altura (Opcional)',
    loadingHeight: 'Cargando...',
    fetchDistribution: 'Obtener Distribución',
    fetching: 'Obteniendo...',
    morePagesLoading: 'Cargando más páginas...',
    failedToFetchData: 'Error al obtener datos.',
    troubleshooting: 'Resolución de problemas:',
    useHeightOrOlder: 'Use altura {height} o anterior (dentro del rango {min}-{max})',
    tryHeightBehind:
      'Intente con una altura que esté {buffer}+ bloques detrás de la altura actual {current}',
    supply: 'Suministro',
    totalHolders: 'Total de Tenedores',
    uniqueAddresses: 'Direcciones Únicas (Todas las Páginas)',
    giniCoefficient: 'Coeficiente de Gini',
    highConcentration: 'Alta concentración',
    mediumConcentration: 'Concentración media',
    lowConcentration: 'Baja concentración',
    holderTiers: 'Niveles de Tenedores',
    holderList: 'Lista de Tenedores',
    rank: 'Rango',
    balance: 'Saldo',
    supplyPercent: '% Suministro',
    cumulativePercent: '% Acumulativo',
    noResultsFound: 'No se encontraron resultados.',
    prev: 'Anterior',
    // next: "Siguiente", - ALREADY EXISTS
    // pageOf: "Página {current} de {total}", - ALREADY EXISTS

    // TransactionMap
    visualizeTransactionFlow: 'Visualizar el flujo de transacciones entre direcciones',
    // nodeInformation: "Información del Nodo", - ALREADY EXISTS
    clickNodesForDetails:
      'Haz clic en los nodos para ver más detalles sobre direcciones y transacciones',
    // DistributionTool - new additions
    analyzeHolderDistribution: 'Analizar la distribución de tenedores de cualquier activo',
    fetchesAllHolders:
      'Esta herramienta obtiene TODOS los tenedores paginando a través de la API (1000 direcciones por página).',
    forBestResults:
      'Para mejores resultados, use una altura de al menos {buffer} bloques detrás de la actual ({current}).',
    validRange: 'Rango válido: {min} a {max}.',
    demoMode: 'Modo Demo',
    defaultHeightValue: 'Predeterminado: {height}',
    fetchingData: 'Obteniendo datos de distribución...',
    pagesFetched: 'Página {pages} • {holders} tenedores encontrados',
    errorOccurred: 'Error',
    ensureCorrectAssetId: '• Asegúrese de que el ID del activo sea correcto',
    tryOlderHeight:
      '• Intente con una altura que esté {buffer}+ bloques detrás de la altura actual {current}',
    snapshotAt: 'Instantánea en altura {height}',
    totalInParens: '({total} Total)',
    showingHolders: 'Mostrando {from} a {to} de {total} tenedores',

    // TransactionMap - new additions
    transactionMapTitle: 'Mapa de Red de Transacciones',
    demoDataNote: 'Datos de Demostración',
    demoDataDescription:
      'Este mapa muestra datos de transacciones simuladas con fines demostrativos. En un entorno de producción, mostraría relaciones de transacciones reales de la blockchain.',

    // NetworkStatistics - new additions
    networkStatisticsTitle: 'Estadísticas de Red',
    advancedAnalytics: 'Análisis avanzado y métricas de rendimiento',
    nodeInformation: 'Información del Nodo',
    summaryStats: 'Estadísticas Resumidas (Últimos 100 Bloques)',

    // NetworkMap - new additions
    networkMapTitle: 'Mapa de Red',
    geographicalDistribution: 'Distribución geográfica de pares conectados',
    simulatedData:
      'Este mapa utiliza datos de geolocalización simulados con fines demostrativos. En un entorno de producción, las direcciones IP de los pares se geolocalizarían utilizando un servicio de geolocalización dedicado. Las ubicaciones reales pueden diferir significativamente.',
    connectedPeers: 'Pares Conectados',
    allKnownPeers: 'Todos los Pares Conocidos',
    regionsSimulated: 'Regiones (Simuladas)',
    peerDistribution: 'Distribución de Pares',
    connectedPeersList: 'Pares Conectados',
    unknownNode: 'Nodo Desconocido',
    addressColon: 'Dirección:',
    locationColon: 'Ubicación:',
    simulated: '(simulado)',

    // Peers - new additions
    networkPeers: 'Pares de Red',
    viewPeerConnections: 'Ver conexiones y estado de pares de red',
    connected: 'Conectado',
    allPeers: 'Todos los Pares',
    suspended: 'Suspendido',
    blacklisted: 'Lista Negra',
    peerDetails: 'Detalles de Pares',
    declaredAddress: 'Dirección Declarada',

    // Node Configuration

    nodeName: 'Nombre del Nodo',
    lastSeen: 'Última Vez Visto',
    noPeersFound: 'No se encontraron pares',

    // Node - new additions
    nodeInformationTitle: 'Información del Nodo',
    viewNodeStatus: 'Ver estado y configuración del nodo',
    blockGeneratorStatus: 'Estado del Generador de Bloques',
    historyReplier: 'Replicador de Historial',
    enabled: 'Habilitado',
    disabled: 'Deshabilitado',
    inactive: 'Inactivo',
    updatedTimestamp: 'Marca de Tiempo Actualizada',
    updatedDate: 'Fecha de Actualización',
    rawNodeData: 'Datos Crudos del Nodo',

    // DEX Pairs
    dexPairs: 'Pares DEX',
    dexTradingPairs: 'Pares de Trading DEX',
    exploreDexPairs:
      'Explora todos los pares de trading disponibles en el exchange descentralizado',
    totalPairs: 'Pares Totales',
    totalVolume24h: 'Volumen Total (24h)',
    totalTrades24h: 'Operaciones Totales (24h)',
    allTradingPairs: 'Todos los Pares de Trading',
    searchPairs: 'Buscar pares...',
    high24h: 'Máximo 24h',
    low24h: 'Mínimo 24h',
    noTradingPairs: 'No hay pares de trading disponibles',

    dccReportsDesc:
      'Accede a reportes mensuales completos sobre el ecosistema DecentralChain, incluyendo métricas blockchain, crecimiento de usuarios y rendimiento de la red.',
    viewFullReport: 'Ver Reporte Completo',
    totalUsers: 'Usuarios Totales',
    newUsers: 'Nuevos Usuarios',
    totalVolume: 'Volumen Total',
    totalRevenue: 'Ingresos Totales',
    tryAgain: 'Intentar de Nuevo',

    reportsCacheDesc:
      'Gestionar datos de reportes en caché. Cuando los reportes se actualicen o regeneren, puede limpiar el caché para obligar a todos los usuarios a obtener las últimas versiones.',
    refreshDccReportsDesc:
      'Limpiar caché para todos los Reportes Mensuales del Ecosistema DCC (Inglés y Español)',
    reportsCacheCleared:
      '¡Caché de reportes limpiado! Todos los usuarios obtendrán datos frescos en su próxima visita.',
    clearAllCacheDesc:
      'Limpiar TODOS los datos en caché en toda la aplicación (usar con precaución)',
    cacheInfo1:
      'Los reportes se almacenan en caché durante 24 horas después de la primera obtención',
  },
};

export const useTranslation = (): {
  t: (key: string) => string;
  language: string;
  changeLanguage: (lang: Language) => void;
} => {
  const [language, setLanguage] = React.useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const t = React.useCallback(
    (key: string): string => {
      // Check if the key exists in the current language, then in English as a fallback
      return translations[language]?.[key] || translations.en?.[key] || key;
    },
    [language],
  );

  const changeLanguage = React.useCallback((lang: Language): void => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);

  return { t, language, changeLanguage };
};
