import React from 'react';

import { type Language } from '@/types';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Popular Features Section

    aboutYourCasinoRevenue:
      'As a node owner with {ownership}% ownership of your node, you receive profits from the CR Coin Casino app running on the DecentralChain network. The total casino profit of {totalPnl} is divided equally among all {totalNodes} nodes in the network ({perNode} per node). Your share is then calculated based on your {ownership}% ownership, resulting in {yourProfit} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',
    active: 'Active',
    activeLeases: 'Active Leases',
    address: 'Address',
    addressColon: 'Address:',
    addressDetails: 'Address Details',
    advancedAnalytics: 'Advanced analytics and performance metrics',
    allKnownPeers: 'All Known Peers',
    allPeers: 'All Peers',
    allTradingPairs: 'All Trading Pairs',
    allTypes: 'All Types',
    amount: 'Amount',
    // nodeInformation: "Node Information", - ALREADY EXISTS
    // DistributionTool - new additions
    analyzeHolderDistribution: 'Analyze the holder distribution of any asset',
    // Layout & Navigation
    appName: 'DecentralChain',
    appSubtitle: 'Blockchain Explorer',

    asNodeOwner:
      'As a node owner with {ownership}% ownership of your node, you receive profits from the CR Coin Casino application running on the DecentralChain network. The total casino profit of {totalProfit} is divided equally among all {totalNodes} nodes in the network ({profitPerNode} per node). Your share is then calculated based on your {ownership}% ownership, resulting in {yourProfit} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',
    asset: 'Asset',
    assetActivity: 'Asset Activity (Last 24h Est.)',

    assetAlreadyHasLogo:
      'This asset already has an approved logo. You cannot submit a new request to change it.',
    assetBalances: 'Asset Balances',
    // enterAssetId: "Enter Asset ID...", - ALREADY EXISTS
    assetDetails: 'Asset Details',

    // DistributionTool
    assetDistributionTool: 'Asset Distribution Tool',
    assetId: 'Asset ID',
    assetInformation: 'Asset Information',

    assetLogoDesc:
      'Add a custom logo to your asset. Once submitted, an admin will review and approve your request.',
    assetName: 'Asset Name',
    assets: 'Assets',
    autoRefresh: 'Auto-refresh',
    avgBlockSize: 'Avg Block Size',
    avgBlockTime: 'Avg Block Time',
    avgTxPerBlock: 'Avg Tx per Block',
    back: 'Back',
    balance: 'Balance',
    blacklisted: 'Blacklisted',

    // Connection Status
    blockchainHeight: 'Blockchain Height',

    // Blocks Page
    blockExplorer: 'Block Explorer',
    blockFeed: 'Block Feed',
    blockGeneratorStatus: 'Block Generator Status',

    // Time

    // Errors

    blockHeight: 'Block Height',
    blockId: 'Block ID',
    blocks: 'Blocks',
    blocksAnalyzed: 'Blocks Analyzed',
    blockTime: 'Block Time (Last 50 Blocks)',
    bytes: 'Bytes',

    casinoRevenueExplanation:
      'As a node owner with {percent}% ownership of your node, you receive profits from the CR Coin Casino app running on the DecentralChain network. The total casino profit of {total} is divided equally among all {nodes} nodes in the network ({perNode} per node). Your share is then calculated based on your {percent}% ownership, resulting in {yourShare} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',
    change24h: 'Change 24h',
    comprehensiveAnalysis: 'Comprehensive Analysis',
    configureNode:
      'Configure your custom node endpoint. Leave empty to use the default public node.',
    configureNodeEndpoint:
      'Configure your custom node endpoint. Leave empty to use the default public node.',

    configureNodeUrl:
      'Please configure your node URL in the "Node Configuration" tab to use these features.',
    confirmed: 'Confirmed',
    connected: 'Connected',
    connectedPeers: 'Connected Peers',
    connectedPeersList: 'Connected Peers',
    copyAddress: 'Copy address',
    copyAssetId: 'Copy asset ID',
    copyBlockId: 'Copy Block ID',
    // transactionId: "Transaction ID", - ALREADY EXISTS
    copyTransactionId: 'Copy transaction ID',
    corsNote:
      'Local nodes (127.0.0.1) may fail the browser test due to CORS restrictions, but will still work within the application. Public HTTPS nodes work best for browser testing.',
    corsRestriction:
      'Local nodes (127.0.0.1) may fail the browser test due to CORS restrictions, but will still work within the application. Public HTTPS nodes work best for browser testing.',
    cumulativePercent: 'Cumulative %',
    currentHeight: 'Current Height',

    // Navigation
    dashboard: 'Dashboard',

    dccReportsDesc:
      'Access comprehensive monthly reports about the DecentralChain ecosystem, including blockchain metrics, user growth, and network performance.',
    decimals: 'Decimals',
    declaredAddress: 'Declared Address',
    defaultHeightValue: 'Default: {height}',
    demoDataDescription:
      'This map displays simulated transaction data for demonstration purposes. In a production environment, it would show real transaction relationships from the blockchain.',
    demoDataNote: 'Demo Data',
    demoMode: 'Demo Mode',
    description: 'Description',

    // DEX Pairs
    dexPairs: 'DEX Pairs',
    dexTradingPairs: 'DEX Trading Pairs',
    disabled: 'Disabled',
    distribution: 'Distribution',

    // Logo Requests

    // Popular Features
    distributionAnalysis: 'Distribution Analysis',
    enabled: 'Enabled',
    ensureCorrectAssetId: '• Ensure the asset ID is correct',
    enterAddress: 'Enter address...',
    enterAssetId: 'Enter asset ID...',
    enterTransactionId: 'Enter transaction ID...',
    errorOccurred: 'Error',
    exploreDexPairs: 'Explore all available trading pairs on the decentralized exchange',
    // distributionAnalysis: "Distribution Analysis", - ALREADY EXISTS
    exploreHolderDistribution: 'Explore Holder Distribution',
    failedToFetchData: 'Failed to fetch data.',
    failedToLoadAsset: 'Failed to load asset',
    // fee: "Fee", - ALREADY EXISTS
    failedToLoadUnconfirmed: 'Failed to load unconfirmed transactions',
    fee: 'Fee',
    fetchDistribution: 'Fetch Distribution',
    fetchesAllHolders:
      'This tool fetches ALL holders by paginating through the API (1000 addresses per page).',
    fetching: 'Fetching...',
    fetchingData: 'Fetching distribution data...',
    forBestResults:
      'For best results, use a height at least {buffer} blocks behind current ({current}).',
    from: 'From',
    generator: 'Generator',
    geographicalDistribution: 'Geographical distribution of connected peers',
    geolocatedPeers: 'Geolocated Peers',
    giniCoefficient: 'Gini Coefficient',
    height: 'Height',
    heightOptional: 'Height (Optional)',
    hideTransactions: 'Hide Transactions',
    high24h: '24h High',
    highConcentration: 'High concentration',
    historyReplier: 'History Replier',
    holderList: 'Holder List',
    holderTiers: 'Holder Tiers',
    inactive: 'Inactive',
    issuer: 'Issuer',
    lastBlock: 'Last Block',
    lastPrice: 'Last Price',
    lastSeen: 'Last Seen',
    latestBlock: 'Latest Block',
    launchDistributionTool: 'Launch Distribution Tool',
    leaseId: 'Lease ID',

    // BlockFeed
    liveBlockFeed: 'Live Block Feed',
    loadingHeight: 'Loading...',
    locationColon: 'Location:',
    low24h: '24h Low',
    lowConcentration: 'Low concentration',
    maxBlockSize: 'Max Block Size',
    mediumConcentration: 'Medium concentration',
    monitoringNewBlocks: 'Monitoring for new blocks',
    morePagesLoading: 'More pages loading...',
    networkMap: 'Network Map',

    // NetworkMap - new additions
    networkMapTitle: 'Network Map',

    // Dashboard
    networkOverview: 'Network Overview',

    // Peers - new additions
    networkPeers: 'Network Peers',

    // NetworkStatistics - new additions
    networkStatisticsTitle: 'Network Statistics',
    networkStats: 'Network Stats',
    networkUtilization: 'Network Utilization - Block Size (Last 50 Blocks)',
    newUsers: 'New Users',
    next: 'Next',
    nftCollection: 'NFT Collection',
    no: 'No',
    noActiveLeases: 'No active leases',

    // Dashboard - Asset Activity
    // Note: Some of these keys are now also defined under the main Dashboard section as per outline.
    // If there's a conflict, the last definition in the object takes precedence.
    // However, for clarity and adherence to instructions, existing keys here are preserved.
    noAssetActivity: 'No asset activity data available',
    noBalancesFound: 'No balances found',
    node: 'Node',
    nodeInformation: 'Node Information',

    // Node - new additions
    nodeInformationTitle: 'Node Information',

    // Node Configuration

    nodeName: 'Node Name',
    nodeStatus: 'Node Status',
    nodeVersion: 'Node Version',
    noNFTsFound: 'No NFTs found',
    noPeersFound: 'No peers found',
    noResultsFound: 'No results found.',
    noTradingPairs: 'No trading pairs available',
    noTransactionsInBlock: 'No transactions in this block',
    noTransactionsMatch: 'No transactions match your search',
    noUnconfirmedTransactions: 'No unconfirmed transactions',
    pageOf: 'Page {current} of {total}',
    pagesFetched: 'Page {pages} • {holders} holders found',
    pair: 'Pair',
    pauseFeed: 'Pause Feed',
    peerDetails: 'Peer Details',
    peerDistribution: 'Peer Distribution',
    peers: 'Peers',
    pendingTransactions: 'Pending Transactions',
    prev: 'Prev',
    previous: 'Previous',
    rank: 'Rank',
    rawAssetData: 'Raw Asset Data',
    rawNodeData: 'Raw Node Data',
    // sender: "Sender", - ALREADY EXISTS
    // recipient: "Recipient", - ALREADY EXISTS
    // amount: "Amount", - ALREADY EXISTS
    rawTransactionData: 'Raw Transaction Data',
    realtimeBlockUpdates: 'Real-time block updates from the blockchain',
    realtimeStats: 'Real-time blockchain statistics and metrics',
    recentBlocks: 'Recent Blocks',
    recentTransactions: 'Recent Transactions',
    recipient: 'Recipient',
    refreshDccReportsDesc:
      'Clear cache for all DCC Monthly Ecosystem Reports (English and Spanish)',
    regionsSimulated: 'Regions (Simulated)',
    reissuable: 'Reissuable',
    reportsCacheCleared:
      'Reports cache cleared! All users will fetch fresh data on their next visit.',

    reportsCacheDesc:
      'Manage cached report data. When reports are updated or regenerated, you can clear the cache to force all users to fetch the latest versions.',
    resumeFeed: 'Resume Feed',
    reward: 'Reward',

    // Search
    search: 'Search',

    // Address
    searchAddress: 'Search Address',

    // Asset
    searchAsset: 'Search Asset',
    searchByIdOrAddress: 'Search by ID or address...',
    searchBySenderRecipient: 'Search by ID, sender, recipient...',
    searchPairs: 'Search pairs...',

    // Transaction
    searchTransaction: 'Search Transaction',
    seconds: 'Seconds',
    sender: 'Sender',
    showingBlocks: 'Showing blocks',
    showingHolders: 'Showing {from} to {to} of {total} holders',
    showTransactions: 'Show Transactions',
    simulated: '(simulated)',
    simulatedData:
      'This map uses simulated geolocation data for demonstration purposes. In a production environment, peer IP addresses would be geolocated using a dedicated geolocation service. The actual locations may differ significantly.',
    snapshotAt: 'Snapshot at height {height}',
    stateHeight: 'State Height',

    // Transaction Types

    // Common
    status: 'Status',
    summaryStats: 'Summary Statistics (Last 100 Blocks)',
    supply: 'Supply',
    supplyPercent: '% Supply',
    suspended: 'Suspended',
    time: 'Time',
    timestamp: 'Timestamp',
    to: 'To',
    toolFetchesAllHolders:
      'This tool fetches ALL holders by paginating through the API (1000 addresses per page). For best results, use a height at least {buffer} blocks behind current ({current}). Valid range: {min} to {max}.',
    // transactionDistribution: "Transaction Distribution" - ALREADY EXISTS
    topAssets: 'Top Assets',
    totalHolders: 'Total Holders',
    totalInParens: '({total} Total)',
    totalPairs: 'Total Pairs',
    totalQuantity: 'Total Quantity',
    totalRevenue: 'Total Revenue',
    totalTrades24h: 'Total Trades (24h)',
    totalTransactions: 'Total Transactions',
    totalUsers: 'Total Users',
    totalVolume: 'Total Volume',
    totalVolume24h: 'Total Volume (24h)',
    trades: 'Trades',
    transactionDetails: 'Transaction Details',

    transactionDistribution: 'Transaction Distribution (Network)',
    transactionHistoryUnavailable:
      'Transaction history is currently unavailable. The recent transactions API endpoint is not responding.',
    transactionId: 'Transaction ID',
    transactionInformation: 'Transaction Information',
    transactionMap: 'Transaction Map',

    // TransactionMap - new additions
    transactionMapTitle: 'Transaction Network Map',
    transactionNotFound:
      'Transaction not found. It may be invalid or not yet propagated through the network.',
    // blockHeight: "Block Height", - ALREADY EXISTS
    transactionParties: 'Transaction Parties',
    transactions: 'Transactions',
    transactionsPerBlock: 'Transactions per Block (Last 50 Blocks)',

    transactionsPerSecond: 'Transactions/Second',
    transactionsWaitingBlocks: 'Transactions waiting to be included in blocks',
    transactionVolume: 'Transaction Volume',
    transactionVolumeTrend: 'Transaction Volume Trend (Last 24h Estimate)',
    transferred: 'transferred',
    troubleshooting: 'Troubleshooting:',
    tryAgain: 'Try Again',
    tryOlderHeight: "• Try a height that's {buffer}+ blocks behind current height {current}",
    txAbbreviation: 'tx',
    txs: 'Txs',
    txsShort: 'tx',
    type: 'Type',
    unconfirmed: 'Unconfirmed',

    // UnconfirmedTransactions
    unconfirmedTransactions: 'Unconfirmed Transactions',
    uniqueAddresses: 'Unique Addresses (All Pages)',
    uniqueAssetsTraded: 'Unique Assets Traded',
    units: 'units',
    unknownNode: 'Unknown Node',
    unnamedNFT: 'Unnamed NFT',
    updatedDate: 'Updated Date',
    updatedTimestamp: 'Updated Timestamp',
    uploadLogoDesc:
      'Upload a logo for your asset. The logo will be reviewed by an admin before appearing on the explorer.',
    useAdvancedTool: 'Use our advanced tool to analyze holder tiers, concentration, and more.',
    useHeightOrOlder: 'Use height {height} or older (within range {min}-{max})',
    validRange: 'Valid range: {min} to {max}.',
    version: 'Version',
    viewDetails: 'View Details',
    viewFullReport: 'View Full Report',
    viewNodeStatus: 'View node status and configuration',
    viewPeerConnections: 'View network peer connections and status',
    // next: "Next", - ALREADY EXISTS
    // pageOf: "Page {current} of {total}", - ALREADY EXISTS

    // TransactionMap
    visualizeTransactionFlow: 'Visualize transaction flow between addresses',
    volume24h: 'Volume 24h',

    withdrawalSubmitted:
      'Withdrawal request submitted successfully! An admin will process your request shortly.',
    yes: 'Yes',
  },

  es: {
    // Popular Features Section

    aboutYourCasinoRevenue:
      'Como propietario de nodo con {ownership}% de propiedad de tu nodo, recibes ganancias de la aplicación CR Coin Casino que se ejecuta en la red DecentralChain. El total casino profit of {totalPnl} is divided equally among all {totalNodes} nodes in the network ({perNode} per node). Your share is then calculated based on your {ownership}% ownership, resulting in {yourProfit} USD in profits. All calculations are transparent and based on actual deposit/withdrawal data from the casino.',
    active: 'Activo',
    activeLeases: 'Arrendamientos Activos',
    address: 'Dirección',
    addressColon: 'Dirección:',
    addressDetails: 'Detalles de la Dirección',
    advancedAnalytics: 'Análisis avanzado y métricas de rendimiento',
    allKnownPeers: 'Todos los Pares Conocidos',
    allPeers: 'Todos los Pares',
    allTradingPairs: 'Todos los Pares de Trading',
    allTypes: 'Todos los Tipos',
    amount: 'Cantidad',
    // DistributionTool - new additions
    analyzeHolderDistribution: 'Analizar la distribución de tenedores de cualquier activo',
    // Layout & Navigation
    appName: 'DecentralChain',
    appSubtitle: 'Explorador de Blockchain',

    asNodeOwner:
      'Como propietario de nodo con {ownership}% de propiedad de tu nodo, recibes ganancias de la aplicación CR Coin Casino que se ejecuta en la red DecentralChain. El total de ganancias del casino de {totalProfit} se divide equitativamente entre todos los {totalNodes} nodos en la red ({profitPerNode} por nodo). Tu participación se calcula entonces basándose en tu {ownership}% de propiedad, resultando en {yourProfit} USD en ganancias. Todos los cálculos son transparentes y se basan en datos reales de depósitos/retiros del casino.',
    asset: 'Activo',
    assetActivity: 'Actividad del Activo (Últ. 24h Est.)',

    assetAlreadyHasLogo:
      'Este activo ya tiene un logo aprobado. No puedes enviar una nueva solicitud para cambiarlo.',
    assetBalances: 'Saldos de Activos',
    // enterAssetId: "Ingrese ID del Activo...", - ALREADY EXISTS
    assetDetails: 'Detalles del Activo',

    // DistributionTool
    assetDistributionTool: 'Herramienta de Distribución de Activos',
    assetId: 'ID de Activo',
    assetInformation: 'Información del Activo',

    assetLogoDesc:
      'Agrega un logo personalizado a tu activo. Una vez enviado, un administrador revisará y aprobará tu solicitud.',
    assetName: 'Nombre del Activo',
    assets: 'Activos',
    autoRefresh: 'Actualización Automática',
    avgBlockSize: 'Tamaño Promedio de Bloque',
    avgBlockTime: 'Tiempo Promedio de Bloque',
    avgTxPerBlock: 'Prom. Tx por Bloque',
    back: 'Atrás',
    balance: 'Saldo',
    blacklisted: 'Lista Negra',

    // Connection Status
    blockchainHeight: 'Altura de Blockchain',

    // Blocks Page
    blockExplorer: 'Explorador de Bloques',
    blockFeed: 'Feed de Bloques',
    blockGeneratorStatus: 'Estado del Generador de Bloques',

    // Time

    // Errors

    blockHeight: 'Altura de Bloque',
    blockId: 'ID del Bloque',
    blocks: 'Bloques',
    blocksAnalyzed: 'Bloques Analizados',
    blockTime: 'Tiempo de Bloque (Últimos 50 Bloques)',
    bytes: 'Bytes',
    cacheInfo1:
      'Los reportes se almacenan en caché durante 24 horas después de la primera obtención',

    casinoRevenueExplanation:
      'Como propietario de nodo con {percent}% de propiedad de tu nodo, recibes ganancias de la aplicación CR Coin Casino que se ejecuta en la red DecentralChain. La ganancia total del casino de {total} se divide equitativamente entre todos los {nodes} nodos de la red ({perNode} por nodo). Tu parte se calcula luego en función de tu propiedad del {percent}%, lo que resulta en {yourShare} USD en ganancias. Todos los cálculos son transparentes y se basan en datos reales de depósitos/retiros del casino.',
    change24h: 'Cambio 24h',
    clearAllCacheDesc:
      'Limpiar TODOS los datos en caché en toda la aplicación (usar con precaución)',
    // nodeInformation: "Información del Nodo", - ALREADY EXISTS
    clickNodesForDetails:
      'Haz clic en los nodos para ver más detalles sobre direcciones y transacciones',
    comprehensiveAnalysis: 'Análisis Integral',
    configureNode:
      'Configura tu endpoint de nodo personalizado. Déjalo vacío para usar el nodo público predeterminado.',
    configureNodeEndpoint:
      'Configura tu endpoint de nodo personalizado. Déjalo vacío para usar el nodo público predeterminado.',
    configureNodeUrl:
      'Por favor configura la URL de tu nodo en la pestaña "Configuración de Nodo" para usar estas funciones.',
    confirmed: 'Confirmado',
    connected: 'Conectado',
    connectedPeers: 'Pares Conectados',
    connectedPeersList: 'Pares Conectados',
    copyAddress: 'Copiar dirección',
    copyAssetId: 'Copiar ID del activo',
    copyBlockId: 'Copiar ID del Bloque',
    // transactionId: "ID de Transacción", - ALREADY EXISTS
    copyTransactionId: 'Copiar ID de transacción',
    corsNote:
      'Los nodos locales (127.0.0.1) pueden fallar la prueba del navegador debido a restricciones CORS, pero seguirán funcionando dentro de la aplicación. Los nodos públicos HTTPS funcionan mejor para pruebas en navegador.',
    corsRestriction:
      'Los nodos locales (127.0.0.1) pueden fallar la prueba del navegador debido a restricciones CORS, pero seguirán funcionando dentro de la aplicación. Los nodos públicos HTTPS funcionan mejor para pruebas en navegador.',
    cumulativePercent: '% Acumulativo',
    currentHeight: 'Altura Actual',

    // Navigation
    dashboard: 'Panel',

    dccReportsDesc:
      'Accede a reportes mensuales completos sobre el ecosistema DecentralChain, incluyendo métricas blockchain, crecimiento de usuarios y rendimiento de la red.',
    decimals: 'Decimales',
    declaredAddress: 'Dirección Declarada',
    defaultHeightValue: 'Predeterminado: {height}',
    demoDataDescription:
      'Este mapa muestra datos de transacciones simuladas con fines demostrativos. En un entorno de producción, mostraría relaciones de transacciones reales de la blockchain.',
    demoDataNote: 'Datos de Demostración',
    demoMode: 'Modo Demo',
    description: 'Descripción',

    // DEX Pairs
    dexPairs: 'Pares DEX',
    dexTradingPairs: 'Pares de Trading DEX',
    disabled: 'Deshabilitado',
    distribution: 'Distribución',

    // Logo Requests

    // Popular Features
    distributionAnalysis: 'Análisis de Distribución',
    enabled: 'Habilitado',
    ensureCorrectAssetId: '• Asegúrese de que el ID del activo sea correcto',
    enterAddress: 'Ingrese dirección...',
    enterAssetId: 'Ingresa el ID de activo...',
    enterTransactionId: 'Ingrese ID de transacción...',
    errorOccurred: 'Error',
    exploreDexPairs:
      'Explora todos los pares de trading disponibles en el exchange descentralizado',
    // distributionAnalysis: "Análisis de Distribución", - ALREADY EXISTS
    exploreHolderDistribution: 'Explorar Distribución de Tenedores',
    failedToFetchData: 'Error al obtener datos.',
    failedToLoadAsset: 'Error al cargar activo',
    // fee: "Tarifa", - ALREADY EXISTS
    failedToLoadUnconfirmed: 'Error al cargar transacciones no confirmadas',
    fee: 'Tarifa',
    fetchDistribution: 'Obtener Distribución',
    fetchesAllHolders:
      'Esta herramienta obtiene TODOS los tenedores paginando a través de la API (1000 direcciones por página).',
    fetching: 'Obteniendo...',
    fetchingData: 'Obteniendo datos de distribución...',
    forBestResults:
      'Para mejores resultados, use una altura de al menos {buffer} bloques detrás de la actual ({current}).',
    from: 'De',
    generator: 'Generador',
    geographicalDistribution: 'Distribución geográfica de pares conectados',
    geolocatedPeers: 'Pares Geolocalizados',
    giniCoefficient: 'Coeficiente de Gini',
    height: 'Altura',
    heightOptional: 'Altura (Opcional)',
    hideTransactions: 'Ocultar Transacciones',
    high24h: 'Máximo 24h',
    highConcentration: 'Alta concentración',
    historyReplier: 'Replicador de Historial',
    holderList: 'Lista de Tenedores',
    holderTiers: 'Niveles de Tenedores',
    inactive: 'Inactivo',
    issuer: 'Emisor',
    lastBlock: 'Último Bloque',
    lastPrice: 'Último Precio',
    lastSeen: 'Última Vez Visto',
    latestBlock: 'Bloque Más Reciente',
    launchDistributionTool: 'Lanzar Herramienta de Distribución',
    leaseId: 'ID de Arrendamiento',

    // BlockFeed
    liveBlockFeed: 'Feed de Bloques en Vivo',
    loadingHeight: 'Cargando...',
    locationColon: 'Ubicación:',
    low24h: 'Mínimo 24h',
    lowConcentration: 'Baja concentración',
    maxBlockSize: 'Tamaño Máximo de Bloque',
    mediumConcentration: 'Concentración media',
    monitoringNewBlocks: 'Monitoreando nuevos bloques',
    morePagesLoading: 'Cargando más páginas...',
    networkMap: 'Mapa de Red',

    // NetworkMap - new additions
    networkMapTitle: 'Mapa de Red',

    // Dashboard
    networkOverview: 'Resumen de la Red',

    // Peers - new additions
    networkPeers: 'Pares de Red',

    // NetworkStatistics - new additions
    networkStatisticsTitle: 'Estadísticas de Red',
    networkStats: 'Estadísticas de Red',
    networkUtilization: 'Utilización de Red - Tamaño de Bloque (Últimos 50 Bloques)',
    newUsers: 'Nuevos Usuarios',
    next: 'Siguiente',
    nftCollection: 'Colección de NFT',
    no: 'No',
    noActiveLeases: 'No hay arrendamientos activos',

    // Dashboard - Asset Activity
    // Note: Some of these keys are now also defined under the main Dashboard section as per outline.
    // If there's a conflict, the last definition in the object takes precedence.
    // However, for clarity and adherence to instructions, existing keys here are preserved.
    noAssetActivity: 'No hay datos de actividad de activos disponibles',
    noBalancesFound: 'No se encontraron saldos',
    node: 'Nodo',
    nodeInformation: 'Información del Nodo',

    // Node - new additions
    nodeInformationTitle: 'Información del Nodo',

    // Node Configuration

    nodeName: 'Nombre del Nodo',
    nodeStatus: 'Estado del Nodo',
    nodeVersion: 'Versión del Nodo',
    noNFTsFound: 'No se encontraron NFTs',
    noPeersFound: 'No se encontraron pares',
    noResultsFound: 'No se encontraron resultados.',
    noTradingPairs: 'No hay pares de trading disponibles',
    noTransactionsInBlock: 'No hay transacciones en este bloque',
    noTransactionsMatch: 'Ninguna transacción coincide con tu búsqueda',
    noUnconfirmedTransactions: 'No hay transacciones no confirmadas',
    pageOf: 'Página {current} de {total}',
    pagesFetched: 'Página {pages} • {holders} tenedores encontrados',
    pair: 'Par',
    pauseFeed: 'Pausar Feed',
    peerDetails: 'Detalles de Pares',
    peerDistribution: 'Distribución de Pares',
    peers: 'Pares',
    pendingTransactions: 'Transacciones Pendientes',
    prev: 'Anterior',
    previous: 'Anterior',
    rank: 'Rango',
    rawAssetData: 'Datos Crudos del Activo',
    rawNodeData: 'Datos Crudos del Nodo',
    // sender: "Remitente", - ALREADY EXISTS
    // recipient: "Destinatario", - ALREADY EXISTS
    // amount: "Cantidad", - ALREADY EXISTS
    rawTransactionData: 'Datos Crudos de la Transacción',
    realtimeBlockUpdates: 'Actualizaciones de bloques en tiempo real de la blockchain',
    realtimeStats: 'Estadísticas y métricas de blockchain en tiempo real',
    recentBlocks: 'Bloques Recientes',
    recentTransactions: 'Transacciones Recientes',
    recipient: 'Destinatario',
    refreshDccReportsDesc:
      'Limpiar caché para todos los Reportes Mensuales del Ecosistema DCC (Inglés y Español)',
    regionsSimulated: 'Regiones (Simuladas)',
    reissuable: 'Reemitible',
    reportsCacheCleared:
      '¡Caché de reportes limpiado! Todos los usuarios obtendrán datos frescos en su próxima visita.',

    reportsCacheDesc:
      'Gestionar datos de reportes en caché. Cuando los reportes se actualicen o regeneren, puede limpiar el caché para obligar a todos los usuarios a obtener las últimas versiones.',
    resumeFeed: 'Reanudar Feed',
    reward: 'Recompensa',
    search: 'Buscar',

    // Address
    searchAddress: 'Buscar Dirección',

    // Asset
    searchAsset: 'Buscar Activo',
    searchByIdOrAddress: 'Buscar por ID o dirección...',
    searchBySenderRecipient: 'Buscar por ID, remitente, destinatario...',
    searchPairs: 'Buscar pares...',

    // Search
    searchPlaceholder:
      'Buscar por altura de bloque, ID de bloque, ID de transacción, dirección o ID de activo...',

    // Transaction
    searchTransaction: 'Buscar Transacción',
    seconds: 'Segundos',
    sender: 'Remitente',
    showingBlocks: 'Mostrando bloques',
    showingHolders: 'Mostrando {from} a {to} de {total} tenedores',
    showTransactions: 'Mostrar Transacciones',
    simulated: '(simulado)',
    simulatedData:
      'Este mapa utiliza datos de geolocalización simulados con fines demostrativos. En un entorno de producción, las direcciones IP de los pares se geolocalizarían utilizando un servicio de geolocalización dedicado. Las ubicaciones reales pueden diferir significativamente.',
    snapshotAt: 'Instantánea en altura {height}',
    stateHeight: 'Altura de Estado',

    // Transaction Types

    // Common
    status: 'Estado',
    summaryStats: 'Estadísticas Resumidas (Últimos 100 Bloques)',
    supply: 'Suministro',
    supplyPercent: '% Suministro',
    suspended: 'Suspendido',
    time: 'Tiempo',
    timestamp: 'Marca de Tiempo',
    to: 'Para',
    toolFetchesAllHolders:
      'Esta herramienta obtiene TODOS los tenedores paginando a través de la API (1000 direcciones por página). Para mejores resultados, use una altura de al menos {buffer} bloques detrás de la actual ({current}). Rango válido: {min} a {max}.',
    // transactionDistribution: "Distribución de Transacciones", - ALREADY EXISTS
    topAssets: 'Principales Activos',
    totalHolders: 'Total de Tenedores',
    totalInParens: '({total} Total)',
    totalPairs: 'Pares Totales',
    totalQuantity: 'Cantidad Total',
    totalRevenue: 'Ingresos Totales',
    totalTrades24h: 'Operaciones Totales (24h)',
    totalTransactions: 'Total de Transacciones',
    totalUsers: 'Usuarios Totales',
    totalVolume: 'Volumen Total',
    totalVolume24h: 'Volumen Total (24h)',

    trackEarnings:
      'Rastrea tus ganancias y estadísticas de las aplicaciones que se ejecutan en tu nodo.',
    trades: 'Operaciones',
    transactionDetails: 'Detalles de la Transacción',

    transactionDistribution: 'Distribución de Transacciones (Red)',
    transactionHistoryUnavailable:
      'El historial de transacciones no está disponible actualmente. El endpoint de la API de transacciones recientes no responde.',
    transactionId: 'ID de Transacción',
    transactionInformation: 'Información de la Transacción',
    transactionMap: 'Mapa de Transacciones',

    // TransactionMap - new additions
    transactionMapTitle: 'Mapa de Red de Transacciones',
    transactionNotFound:
      'Transacción no encontrada. Puede ser inválida o aún no propagada por la red.',
    // blockHeight: "Altura del Bloque", - ALREADY EXISTS
    transactionParties: 'Partes de la Transacción',
    transactions: 'Transacciones',
    transactionsPerBlock: 'Transacciones por Bloque (Últimos 50 Bloques)',

    transactionsPerSecond: 'Transacciones/Segundo',
    transactionsWaitingBlocks: 'Transacciones esperando ser incluidas en bloques',
    transactionVolume: 'Volumen de Transacciones',
    transactionVolumeTrend: 'Tendencia de Volumen de Transacciones (Estimación Últimas 24h)',
    transferred: 'transferido',
    troubleshooting: 'Resolución de problemas:',
    tryAgain: 'Intentar de Nuevo',
    tryHeightBehind:
      'Intente con una altura que esté {buffer}+ bloques detrás de la altura actual {current}',
    tryOlderHeight:
      '• Intente con una altura que esté {buffer}+ bloques detrás de la altura actual {current}',
    txAbbreviation: 'tx',
    txs: 'Txs',
    txsShort: 'tx',
    type: 'Tipo',
    unconfirmed: 'No Confirmadas',

    // UnconfirmedTransactions
    unconfirmedTransactions: 'Transacciones No Confirmadas',
    uniqueAddresses: 'Direcciones Únicas (Todas las Páginas)',
    uniqueAssetsTraded: 'Activos Únicos Comerciados',
    units: 'unidades',
    unknownNode: 'Nodo Desconocido',
    unnamedNFT: 'NFT Sin Nombre',
    updatedDate: 'Fecha de Actualización',
    updatedTimestamp: 'Marca de Tiempo Actualizada',
    uploadLogoDesc:
      'Sube un logo para tu activo. El logo será revisado por un administrador antes de aparecer en el explorador.',
    useAdvancedTool:
      'Usa nuestra herramienta avanzada para analizar niveles de tenedores, concentración y más.',
    useHeightOrOlder: 'Use altura {height} o anterior (dentro del rango {min}-{max})',
    validRange: 'Rango válido: {min} a {max}.',
    version: 'Versión',

    viewDetailedInfo:
      'Ver información detallada sobre el estado de tu nodo y los pares conectados.',
    viewDetails: 'Ver Detalles',
    viewFullReport: 'Ver Reporte Completo',
    viewNodeStatus: 'Ver estado y configuración del nodo',
    viewPeerConnections: 'Ver conexiones y estado de pares de red',
    // next: "Siguiente", - ALREADY EXISTS
    // pageOf: "Página {current} de {total}", - ALREADY EXISTS

    // TransactionMap
    visualizeTransactionFlow: 'Visualizar el flujo de transacciones entre direcciones',
    volume24h: 'Volumen 24h',
    withdrawalSubmitted:
      '¡Solicitud de retiro enviada exitosamente! Un administrador procesará tu solicitud pronto.',
    yes: 'Sí',
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

  return { changeLanguage, language, t };
};
