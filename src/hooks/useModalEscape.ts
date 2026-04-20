import { useEffect, useRef } from 'react';

type ModalRegistration = {
  id: string;
  zIndex: number;
  closeRef: React.MutableRefObject<() => void>;
};

class ModalManager {
  modals: ModalRegistration[] = [];

  register(modal: ModalRegistration) {
    this.modals = this.modals.filter(m => m.id !== modal.id);
    this.modals.push(modal);
    this.modals.sort((a, b) => b.zIndex - a.zIndex);
  }

  unregister(id: string) {
    this.modals = this.modals.filter(m => m.id !== id);
  }

  closeTopModal() {
    if (this.modals.length > 0) {
      const topModal = this.modals[0];
      if (topModal.closeRef.current) {
         topModal.closeRef.current();
      }
    }
  }
}

export const modalManager = new ModalManager();

let isListenerAdded = false;

export function useModalEscape(isOpen: boolean, onClose: () => void, zIndex: number = 50) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isListenerAdded) {
      const handleGlobalKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          modalManager.closeTopModal();
        }
      };
      window.addEventListener('keydown', handleGlobalKeydown);
      isListenerAdded = true;
    }

    const modalId = Math.random().toString(36).substr(2, 9);
    
    if (isOpen) {
      modalManager.register({ id: modalId, zIndex, closeRef });
    } else {
      modalManager.unregister(modalId);
    }

    return () => {
      modalManager.unregister(modalId);
    };
  }, [isOpen, zIndex]);
}
