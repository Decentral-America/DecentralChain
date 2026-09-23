// @vitest-environment node
//
// See pda.test.ts: jsdom misreports the ed25519 curve check, so anything
// deriving a program address runs under node.

import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import { SOLANA_PROGRAM_ID } from '@/config/bridge';
import { dccAddressToBytes32 } from '@/services/bridge/address';
import { buildDepositInstruction, buildDepositSplInstruction } from '@/services/bridge/deposit';
import idl from '@/services/bridge/sol_bridge_lock.json';

const SENDER = new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const RECIPIENT = dccAddressToBytes32('3Dfw9hasyUyeRBr8H7NJhcWZLRbVfHzt64D');
const TRANSFER_ID = new Uint8Array(32).fill(9);

const args = {
  amount: 1_000_000n,
  recipientDcc: RECIPIENT,
  sender: SENDER,
  transferId: TRANSFER_ID,
};

/** The program's own account list for an instruction, in declaration order. */
const idlAccounts = (name: string): { name: string; signer: boolean; writable: boolean }[] => {
  const ix = (idl.instructions as { accounts: unknown[]; name: string }[]).find(
    (i) => i.name === name,
  );
  if (!ix) throw new Error(`No ${name} instruction in the IDL`);

  return (ix.accounts as { name: string; signer?: boolean; writable?: boolean }[]).map((a) => ({
    name: a.name,
    signer: a.signer === true,
    writable: a.writable === true,
  }));
};

describe('IDL agreement', () => {
  it('is the IDL for the program we target', () => {
    expect((idl as { address: string }).address).toBe(SOLANA_PROGRAM_ID);
  });

  it('builds deposit with the accounts the program declares, in order', () => {
    const declared = idlAccounts('deposit');
    const built = buildDepositInstruction(args).keys;

    expect(built).toHaveLength(declared.length);
    declared.forEach((account, index) => {
      expect(built[index]?.isSigner, `${account.name}.isSigner`).toBe(account.signer);
      expect(built[index]?.isWritable, `${account.name}.isWritable`).toBe(account.writable);
    });
  });

  it('builds deposit_spl with the accounts the program declares, in order', () => {
    const declared = idlAccounts('deposit_spl');
    const built = buildDepositSplInstruction({ ...args, splMint: USDC_MINT }).keys;

    expect(built).toHaveLength(declared.length);
    declared.forEach((account, index) => {
      expect(built[index]?.isSigner, `${account.name}.isSigner`).toBe(account.signer);
      expect(built[index]?.isWritable, `${account.name}.isWritable`).toBe(account.writable);
    });
  });

  it('keeps mint_limits at index 5, where the program puts it', () => {
    // The trap: it is inserted between spl_mint and sender_token_account, not
    // appended. Omit it and every later account shifts by one, and the program
    // reports AccountOwnedByWrongProgram (3007) — which reads like a wrong
    // address, not a missing account. This asserts against the IDL so an
    // upstream reorder fails here rather than on chain.
    const declared = idlAccounts('deposit_spl');

    expect(declared[4]?.name).toBe('mint_limits');
    expect(declared).toHaveLength(11);
  });

  it('gives native deposit six accounts and no token program', () => {
    const built = buildDepositInstruction(args).keys;

    expect(built).toHaveLength(6);
    expect(built.map((k) => k.pubkey.toBase58())).not.toContain(
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    );
  });
});

describe('instruction data', () => {
  it('uses the discriminator from the IDL', () => {
    const declared = (idl.instructions as { discriminator: number[]; name: string }[]).find(
      (i) => i.name === 'deposit',
    );

    expect([...buildDepositInstruction(args).data.subarray(0, 8)]).toEqual(declared?.discriminator);
  });

  it('distinguishes deposit from deposit_spl', () => {
    const native = buildDepositInstruction(args).data.subarray(0, 8);
    const spl = buildDepositSplInstruction({ ...args, splMint: USDC_MINT }).data.subarray(0, 8);

    expect([...native]).not.toEqual([...spl]);
  });

  it('carries the recipient field and transfer id at full width', () => {
    // 8 discriminator + 32 recipient_dcc + 8 amount + 32 transfer_id
    expect(buildDepositInstruction(args).data).toHaveLength(80);
  });

  it('preserves a recipient whose checksum ends in zero', () => {
    // The 1-in-256 case. If anything trimmed it, the encoded field would be
    // short and this length assertion would fail.
    const zeroTail = dccAddressToBytes32('3DcZCYUNSopwNd13wUTTKaLbYXb5ACLMoYK');
    const data = buildDepositInstruction({ ...args, recipientDcc: zeroTail }).data;

    expect([...data.subarray(8, 40)]).toEqual([...zeroTail]);
    expect(data.subarray(8, 40)[25]).toBe(0);
  });
});

describe('argument validation', () => {
  it('refuses a recipient field of the wrong width', () => {
    expect(() => buildDepositInstruction({ ...args, recipientDcc: new Uint8Array(26) })).toThrow(
      /32 bytes/,
    );
  });

  it('refuses a transfer id of the wrong width', () => {
    expect(() => buildDepositInstruction({ ...args, transferId: new Uint8Array(31) })).toThrow(
      /32 bytes/,
    );
  });

  it('refuses a non-positive amount', () => {
    expect(() => buildDepositInstruction({ ...args, amount: 0n })).toThrow(/greater than zero/);
  });
});
