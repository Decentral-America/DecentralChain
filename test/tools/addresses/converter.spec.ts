import ethAddress2dcc from '../../../src/tools/adresses/ethAddress2dcc';

test('eth 2 dcc address', async () => {
    const ethAddress = '0x11242d6ec6B50713026a3757cAeb027294C2242a';
    const dccAddress = '3EzjTrzQB57shiN4RwUi9ikC44FBGRzZ81G';
    const chainId = 67; // C

    const convertedAddress = ethAddress2dcc(ethAddress, chainId);

    expect(convertedAddress).toBe(dccAddress);
});
