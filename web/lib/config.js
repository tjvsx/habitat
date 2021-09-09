const DEV_ENV_BASE = `http://${window.location.hostname}`;
const WANT_TESTNET = window.location.href.indexOf('testnet') !== -1;
export const DEV_ENV = WANT_TESTNET && window.location.hostname.indexOf('localhost') !== -1;
export const ROOT_CHAIN_ID = WANT_TESTNET ? 4 : 1;
export const L2_RPC_URL = DEV_ENV ? `${DEV_ENV_BASE}:8111/` : `https://mainnet-habitat-l2.fly.dev/`;
export const DEV_ENV_L1_RPC = `${DEV_ENV_BASE}:8222/`;
export const CONFIGS = {
  1: {
    HBT: '0x0aCe32f6E87Ac1457A5385f8eb0208F37263B415',
    HBT_LIQUIDITY_TOKEN: '0xa023cca9de8486d867e8b2f7bfd133a96455f850',
    TOKEN_TURNER: '0x51F93C014A185c2cA4877F7d97f0bD6Fc7EFf5de',
    UNISWAP_FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    INPUT_TOKEN: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    FUNDING_EPOCHS: 12,
    FUNDING_SUPPLY: 2_000_000,
    EPOCH_SECONDS: 604800,
    FUNDING_START_DATE: 1615370400,
    DEFAULT_ROLLUP_OPERATOR_ADDRESS: '0x2951da2ba72dfe30da94988b4b3835a62f438c78',
    MULTI_CALL_HELPER: '0xBBb3d2Ea97D2859eA391aBEb691DfD23192B1ded',
    EXECUTION_PROXY_ADDRESS: '0x32bbDEf16B4e0404191a8B879956280539036DEA',
    EVOLUTION_ENDPOINT: DEV_ENV ? `${DEV_ENV_BASE}:1111` : 'https://habitat-evolution.fly.dev',
    EVOLUTION_SIGNAL_VAULT: '0xD689084F07291eedC307eeEa550A15f0Dc5c50cE',
    EVOLUTION_ACTION_VAULT: '0x5d136Ef53fC4d85AE3A5e28Cc6762ec9975d18Dc',
    EVOLUTION_COMMUNITY_ID: '0xf8ef49342671511f41807ffd4259749e2d43fde3b158df1dec7893f8a6ab481f',
    VERC_FACTORY_ADDRESS: '0x62490e5e9f811f4b17083d3efa3198b27ff83da6',
  },
};
