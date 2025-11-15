/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BRIDGE SHAREDWORKER - DUMB RELAY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This SharedWorker acts as a message relay for cross-tab broadcasting.
 * It contains ZERO business logic - it only routes messages between tabs.
 *
 * WHY A DUMB RELAY?
 * ────────────────
 * - Business logic stays in tabs (easier debugging, hot-reload friendly)
 * - Worker doesn't need schema updates (generic and reusable)
 * - Reduces serialization overhead (no function transfer needed)
 * - Simplifies architecture (worker is just a router)
 *
 * HOW IT WORKS:
 * ────────────
 * 1. Tabs connect via SharedWorker and get unique tabIDs
 * 2. Each tab registers which methods it supports
 * 3. When a tab broadcasts a method call:
 *    - Worker receives BRIDGE_BROADCAST message
 *    - Worker relays as BRIDGE_RELAY to ALL other tabs (excludes sender)
 * 4. Receiving tabs execute the method locally and fire listeners
 *
 * MESSAGE FLOW:
 * ────────────
 * Tab A: remote.increment(5)
 *   ↓ BRIDGE_BROADCAST { methodName: "increment", args: [5], senderTabID: "A" }
 * Worker: Relay to all tabs except A
 *   ↓ BRIDGE_RELAY to Tab B
 *   ↓ BRIDGE_RELAY to Tab C
 *   ↓ BRIDGE_RELAY to Tab D
 * Tabs B,C,D: Execute increment(5), fire listeners
 *
 * STATE MANAGEMENT:
 * ────────────────
 * Worker maintains a map of connected tabs:
 * {
 *   "tabID1": { port: MessagePort, methods: ["increment", "decrement"] },
 *   "tabID2": { port: MessagePort, methods: ["increment", "decrement"] }
 * }
 *
 * This allows:
 * - Broadcasting to all tabs except sender
 * - Cleanup when tabs disconnect
 * - (Future) Method filtering based on available methods
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export {};
/**
 * EMBEDDING INSTRUCTIONS:
 * ──────────────────────
 * To embed this worker as a Blob URL, the Bridge client will:
 * 1. Convert this file to a string
 * 2. Create a Blob: new Blob([workerCode], { type: 'application/javascript' })
 * 3. Create URL: URL.createObjectURL(blob)
 * 4. Create SharedWorker: new SharedWorker(url)
 *
 * This enables zero-configuration deployment - no separate worker file needed!
 */
