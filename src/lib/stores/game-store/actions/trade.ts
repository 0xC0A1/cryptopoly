// ============================================
// CRYPTOPOLI - Trade actions
// ============================================

import { nanoid } from 'nanoid';
import type { GameAction, TradeOffer } from '../../../game/types';
import type { StoreGet } from '../types';

export function createTradeActions(get: StoreGet) {
  return {
    proposeTrade: (offer: Omit<TradeOffer, 'id' | 'status'>) => {
      const { isHost, broadcastAction, sendToHost } = get();

      const fullOffer: TradeOffer = {
        ...offer,
        id: nanoid(),
        status: 'pending',
      };

      const action: GameAction = { type: 'PROPOSE_TRADE', offer: fullOffer };
      if (isHost) {
        get().applyActionFromNetwork(action);
        broadcastAction?.(action);
      } else sendToHost?.(action);
    },

    acceptTrade: (tradeId: string) => {
      const { isHost, broadcastAction, sendToHost } = get();
      const action: GameAction = { type: 'ACCEPT_TRADE', tradeId };
      if (isHost) {
        get().applyActionFromNetwork(action);
        broadcastAction?.(action);
      } else sendToHost?.(action);
    },

    rejectTrade: (tradeId: string) => {
      const { isHost, broadcastAction, sendToHost } = get();
      const action: GameAction = { type: 'REJECT_TRADE', tradeId };
      if (isHost) {
        get().applyActionFromNetwork(action);
        broadcastAction?.(action);
      } else sendToHost?.(action);
    },
  };
}
