'use client';

import { useGameStore } from '@/lib/stores/game-store';
import { TILES } from '@/lib/game/board-data';
import { PropertyTile, RailroadTile, UtilityTile, GROUP_COLORS, GROUP_NAMES, TOKEN_COLORS } from '@/lib/game/types';
import { cn } from '@/lib/utils';

export function PropertyCard() {
  const showPropertyCard = useGameStore(state => state.showPropertyCard);
  const setShowPropertyCard = useGameStore(state => state.setShowPropertyCard);
  const gameState = useGameStore(state => state.gameState);

  if (showPropertyCard === null) return null;

  const tile = TILES[showPropertyCard];
  if (!tile || (tile.type !== 'property' && tile.type !== 'railroad' && tile.type !== 'utility')) {
    return null;
  }

  const propertyState = gameState?.properties[showPropertyCard];
  const owner = propertyState?.ownerId ? gameState?.players[propertyState.ownerId] : null;

  return (
    <div className="modal-overlay" onClick={() => setShowPropertyCard(null)}>
      <div
        className="glass rounded-2xl p-6 w-80 max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with color band */}
        {tile.type === 'property' && (
          <div
            className="h-20 -m-6 mb-4 rounded-t-2xl flex items-end p-4"
            style={{ backgroundColor: GROUP_COLORS[(tile as PropertyTile).group] }}
          >
            <div className="text-white">
              <div className="text-xs opacity-80">
                {GROUP_NAMES[(tile as PropertyTile).group]}
              </div>
              <div className="text-xl font-bold">{tile.name}</div>
            </div>
          </div>
        )}

        {tile.type !== 'property' && (
          <div className="text-xl font-bold text-white mb-4">{tile.name}</div>
        )}

        {/* Ownership */}
        {owner && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: TOKEN_COLORS[owner.token] }}
            />
            <div>
              <div className="text-xs text-white/60">Owned by</div>
              <div className="font-semibold text-white">{owner.name}</div>
            </div>
          </div>
        )}

        {/* Property details */}
        {tile.type === 'property' && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Price</span>
              <span className="text-white font-mono">${(tile as PropertyTile).price}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="text-xs text-white/40 mb-1">RENT</div>
              <div className="flex justify-between">
                <span className="text-white/60">Base</span>
                <span className="text-white font-mono">${(tile as PropertyTile).rent[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">With 1 House</span>
                <span className="text-white font-mono">${(tile as PropertyTile).rent[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">With 2 Houses</span>
                <span className="text-white font-mono">${(tile as PropertyTile).rent[2]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">With 3 Houses</span>
                <span className="text-white font-mono">${(tile as PropertyTile).rent[3]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">With 4 Houses</span>
                <span className="text-white font-mono">${(tile as PropertyTile).rent[4]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">With Hotel</span>
                <span className="text-white font-mono">${(tile as PropertyTile).rent[5]}</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-white/60">House Cost</span>
                <span className="text-white font-mono">${(tile as PropertyTile).houseCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Mortgage Value</span>
                <span className="text-white font-mono">${(tile as PropertyTile).mortgage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Railroad details */}
        {tile.type === 'railroad' && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Price</span>
              <span className="text-white font-mono">${(tile as RailroadTile).price}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="text-xs text-white/40 mb-1">RENT</div>
              <div className="flex justify-between">
                <span className="text-white/60">1 Exchange owned</span>
                <span className="text-white font-mono">${(tile as RailroadTile).rent[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">2 Exchanges owned</span>
                <span className="text-white font-mono">${(tile as RailroadTile).rent[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">3 Exchanges owned</span>
                <span className="text-white font-mono">${(tile as RailroadTile).rent[2]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">4 Exchanges owned</span>
                <span className="text-white font-mono">${(tile as RailroadTile).rent[3]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Utility details */}
        {tile.type === 'utility' && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Price</span>
              <span className="text-white font-mono">${(tile as UtilityTile).price}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="text-xs text-white/40 mb-1">RENT</div>
              <div className="text-white/60 text-xs">
                If 1 utility is owned, rent is 4 times the dice roll.
                <br />
                If 2 utilities are owned, rent is 10 times the dice roll.
              </div>
            </div>
          </div>
        )}

        {/* Houses indicator */}
        {propertyState && propertyState.houses > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-white/5">
            <div className="text-xs text-white/40 mb-1">BUILDINGS</div>
            <div className="flex gap-1">
              {propertyState.houses < 5 ? (
                Array.from({ length: propertyState.houses }).map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-green-500 rounded" />
                ))
              ) : (
                <div className="px-3 py-1 bg-red-500 rounded text-white text-sm">
                  Hotel
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mortgaged indicator */}
        {propertyState?.isMortgaged && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 text-red-400 text-center">
            MORTGAGED
          </div>
        )}

        <button
          onClick={() => setShowPropertyCard(null)}
          className="btn btn-secondary w-full mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
}
