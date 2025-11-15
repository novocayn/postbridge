import { Schema, BridgeConnection, BridgeConnectOptions } from './types';
/**
 * Bridge Connect
 * ───────────────────
 * Establishes a cross-tab broadcasting connection via SharedWorker.
 *
 * FLOW:
 * ────
 * 1. Extract methods from schema
 * 2. Create SharedWorker (or use provided URL)
 * 3. Send BRIDGE_HANDSHAKE with tabID and method names
 * 4. Wait for BRIDGE_HANDSHAKE_ACK
 * 5. Create broadcast proxy functions for each method
 * 6. Set up relay handler for broadcasts from other tabs
 * 7. Return BridgeConnection with remote, getConnectedTabs, close
 *
 * BROADCAST SEMANTICS:
 * ───────────────────
 * When calling remote.method(args):
 * - Method executes locally first
 * - Result is returned to caller
 * - Broadcast is sent to all other tabs
 * - Other tabs execute the same schema function automatically
 * - Sender does NOT receive own broadcast (no echo)
 *
 * POSTBRIDGE PHILOSOPHY:
 * ──────────────────────
 * Just like PostBridge, your schema functions ARE the handlers!
 * No need to set up separate listeners - the functions you define
 * execute automatically in all tabs when any tab calls them.
 *
 * CLEANUP:
 * ───────
 * Always call conn.close() when done:
 * - Sends BRIDGE_DISCONNECT
 * - Closes MessagePort
 *
 * @param schema Object with functions to broadcast
 * @param options Optional configuration (workerURL, channel, tabID)
 * @returns Promise that resolves to BridgeConnection
 */
declare function connect(schema?: Schema, options?: BridgeConnectOptions): Promise<BridgeConnection>;
/**
 * Bridge API Export
 * ──────────────────────
 * Exports the connect function for use in tabs.
 *
 * Usage:
 * import { bridge } from 'postbridge';
 * const conn = await bridge.connect({ ... });
 */
declare const _default: {
    connect: typeof connect;
};
export default _default;
