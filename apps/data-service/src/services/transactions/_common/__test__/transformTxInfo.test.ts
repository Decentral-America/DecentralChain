import { transformTxInfo } from '../transformTxInfo';

const txRaw = {
  proofs: [],
  sender_public_key: 'AiXERNpnVgGM25Au55kfcz39K9FUoysqD5nCSpew4MYo',
  signature:
    '5CVsdA6Weyx28MyGAQoFD8HdSBMmop3RQJvGv8w4k2axRyJ4f76oV4vWoCoV31B4Dv2dRcSfG6N88AzszccH9xV',
  time_stamp: new Date('2017-07-29 05:22:01.407000'),
  tx_type: 8,
  tx_version: 1,
};

describe('Common transactions info transform', () => {
  const tx = transformTxInfo(txRaw);

  it('transforms field names', () => {
    expect(tx).toHaveProperty('type');
    expect(tx).toHaveProperty('version');
    expect(tx).toHaveProperty('timestamp');
    expect(tx).toHaveProperty('senderPublicKey');
  });

  it('handles proofs/signature', () => {
    expect(tx).toHaveProperty('signature');
    expect(tx).not.toHaveProperty('proofs');

    const txWithProofs = transformTxInfo({
      ...txRaw,
      proofs: [
        '5CVsdA6Weyx28MyGAQoFD8HdSBMmop3RQJvGv8w4k2axRyJ4f76oV4vWoCoV31B4Dv2dRcSfG6N88AzszccH9xV',
      ],
      signature: null,
    });
    expect(txWithProofs).not.toHaveProperty('signature');
    expect(txWithProofs).toHaveProperty('proofs');
  });

  it('if tx version is null removes it', () => {
    const txVersionNull = { ...txRaw, tx_version: null };
    expect(transformTxInfo(txVersionNull)).not.toHaveProperty('version');
  });
});
