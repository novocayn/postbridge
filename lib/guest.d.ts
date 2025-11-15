import { GuestConnectOptions, Connection, Schema } from './types';
/**
 * Guest Connect
 * ─────────────
 * Establishes an RPC connection from a guest context to its host.
 *
 * USAGE EXAMPLES:
 * ──────────────
 *
 * Example 1: Simple Web Worker
 * // Inside worker.js
 * import { guest } from 'postbridge';
 *
 * const connection = await guest.connect({
 *   processData: (data) => {
 *     return data.map(x => x * 2);
 *   }
 * });
 *
 * // Now can call host methods:
 * const result = await connection.remote.hostMethod();
 *
 * Example 2: iframe with configuration
 * // Inside iframe
 * import { guest } from 'postbridge';
 *
 * const connection = await guest.connect({
 *   config: { version: '1.0' },  // Non-function data
 *   renderChart: (chartData) => {
 *     // Render chart in iframe
 *   }
 * }, {
 *   onConnectionSetup: async (remote) => {
 *     // Initialize with data from host
 *     const settings = await remote.getSettings();
 *     applySettings(settings);
 *   }
 * });
 *
 * HOW IT WORKS:
 * ────────────
 * 1. Extract methods from schema (functions → method map)
 * 2. Auto-detect host target (or use provided one)
 * 3. Set up handshake response listener
 * 4. Send HANDSHAKE_REQUEST to host
 * 5. When HANDSHAKE_REPLY arrives:
 *    - Register remote methods (host → proxy functions)
 *    - Register local methods (guest → event handlers)
 *    - Call onConnectionSetup if provided
 *    - Send confirmation HANDSHAKE_REPLY
 *    - Resolve promise with Connection object
 *
 * AUTO-DETECTION:
 * ──────────────
 * If hostTarget is not provided, it's auto-detected:
 * - Web Worker → self
 * - iframe → window.parent
 * - Node.js Worker → parentPort
 *
 * OPTIONS:
 * ───────
 * - hostTarget: Override auto-detection (advanced use cases)
 * - onConnectionSetup: Async callback for initialization
 *   - Receives remote object as parameter
 *   - Can call remote methods before connection resolves
 *   - Useful for loading initial state
 *
 * RETURN VALUE:
 * ────────────
 * Connection object with:
 * - id: Unique connection identifier
 * - remote: Proxy object for calling host methods
 * - close(): Function to tear down connection and cleanup
 *
 * CLEANUP:
 * ───────
 * Always call connection.close() when done to prevent memory leaks:
 * - Removes all event listeners
 * - Clears RPC handlers
 * - Invalidates the connection
 *
 * @param schema Object with functions and data to expose to host
 * @param options Configuration options (hostTarget, onConnectionSetup)
 * @returns Promise that resolves to Connection object
 */
declare function connect(schema?: Schema, options?: GuestConnectOptions): Promise<Connection>;
/**
 * Guest API Export
 * ───────────────
 * Exports the guest.connect() function for use in guest contexts.
 *
 * Usage:
 * import { guest } from 'postbridge';
 * const connection = await guest.connect({ ... });
 */
declare const _default: {
    connect: typeof connect;
};
export default _default;
