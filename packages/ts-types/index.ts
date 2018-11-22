export * from './transactions/general';


export enum TRANSACTION_TYPE {
    GENESIS = 1,
    PAYMENT = 2,
    ISSUE = 3,
    TRANSFER = 4,
    REISSUE = 5,
    BURN = 6,
    EXCHANGE = 7,
    LEASE = 8,
    CANCEL_LEASE = 9,
    ALIAS = 10,
    MASS_TRANSFER = 11,
    DATA = 12,
    SET_SCRIPT = 13,
    SPONSORSHIP = 14
}

export enum DATA_FIELD_TYPE {
    INTEGER = 'integer',
    BOOLEAN = 'boolean',
    STRING = 'string',
    BINARY = 'binary'
}
