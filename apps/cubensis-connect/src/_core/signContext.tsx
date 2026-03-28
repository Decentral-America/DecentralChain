import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { LedgerConnectModal } from '#ledger/connectModal';
import { LedgerServiceStatus, ledgerService } from '#ledger/service';
import { usePopupSelector } from '#popup/store/react';
import { Modal } from '#ui/components/ui/modal/Modal';

type CreateSign = <P>(onConfirm: (params: P) => void) => (params: P) => Promise<void>;

const SignContext = createContext<{ createSign: null | CreateSign }>({
  createSign: null,
});

function usePromiseDialogController(initiallyOpen = false) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const modalPromiseRef = useRef<null | {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }>(null);

  const open = useCallback(() => {
    setIsOpen(true);

    return new Promise((resolve, reject) => {
      modalPromiseRef.current = { reject, resolve };
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onOk = useCallback((data?: unknown) => {
    modalPromiseRef.current?.resolve(data);
    modalPromiseRef.current = null;
  }, []);

  const onCancel = useCallback((reason?: unknown) => {
    setIsOpen(false);
    modalPromiseRef.current?.reject(reason);
    modalPromiseRef.current = null;
  }, []);

  return useMemo(
    () => ({
      close,
      isOpen,
      onCancel,
      onOk,
      open,
    }),
    [close, isOpen, onCancel, onOk, open],
  );
}

export function SignProvider({ children }: { children: ReactNode }) {
  const account = usePopupSelector((state) => state.selectedAccount);

  const confirmDialog = usePromiseDialogController();

  const createSign: CreateSign = useCallback(
    (onConfirm) => async (params) => {
      switch (account?.type) {
        case 'ledger':
          await ledgerService.updateStatus(account.networkCode);

          if (ledgerService.status === LedgerServiceStatus.Ready) {
            onConfirm(params);
          } else {
            await confirmDialog.open();
            onConfirm(params);
            confirmDialog.close();
          }
          break;
        default:
          onConfirm(params);
          break;
      }
    },
    [account, confirmDialog],
  );

  const contextValue = useMemo(() => ({ createSign }), [createSign]);

  return (
    <>
      <SignContext value={contextValue}>{children}</SignContext>

      {account?.type === 'ledger' && (
        <Modal animation={Modal.ANIMATION.FLASH} showModal={confirmDialog.isOpen}>
          <LedgerConnectModal
            networkCode={account.networkCode}
            onClose={confirmDialog.onCancel}
            onReady={confirmDialog.onOk}
          />
        </Modal>
      )}
    </>
  );
}

export function useSign<OnConfirmParams>(
  onConfirm: (params: OnConfirmParams) => void | Promise<void>,
) {
  const [isSignPending, setIsSignPending] = useState(false);

  const { createSign } = useContext(SignContext);

  invariant(createSign);

  const sign = useCallback(
    (params: OnConfirmParams) => {
      setIsSignPending(true);

      return createSign(onConfirm)(params).finally(() => setIsSignPending(false));
    },
    [createSign, onConfirm],
  );

  return { isSignPending, sign };
}
