# Blackjack Game Architecture Report

## Corpus Summary
- **Files**: 25 total
- **Words**: ~5673 total
- **Knowledge Graph**: 85 nodes, 98 edges, 25 communities

## File Composition
- **Code**: 17 files
- **Documents**: 3 files
- **Images**: 5 files

## God Nodes (Most Connected Components)

These are the central hub nodes with the most connections in the architecture:

1. **createHand()**
2. **emitRoomAction()**
3. **ensureDeck()**
4. **dealerTurn()**
5. **createRoom()**
6. **dealRound()**
7. **startMultiplayerRound()**
8. **createDeck()**
9. **dealerPlay()**
10. **getRoom()**

## Surprising Connections

Cross-domain relationships discovered in the codebase:

1. calls
2. calls
3. calls
4. calls
5. calls

## Communities Detected

The graph has been partitioned into 25 communities, each representing a logical cluster of related entities.

## Key Insights

1. **Core Game Logic**: Central functions like createHand(), dealerTurn(), and determineWinner form a core game logic hub.
2. **Component Architecture**: React components are tightly integrated with game logic through state management.
3. **Type System**: TypeScript interfaces (Card, Hand, GameState) serve as crucial data contracts.
4. **Multiplayer Integration**: Separate multiplayer module with room management functionality.

## Generated Artifacts

- graph.json — GraphRAG-ready JSON format
- graph.html — Interactive visualization
- This report
