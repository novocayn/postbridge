import { Guest, Connection, Schema } from './types';
/**
 * Host Connect
 * ────────────
 * Establishes an RPC connection from a host to a guest (worker, iframe, etc).
 *
 * USAGE EXAMPLES:
 * ──────────────
 *
 * Example 1: Connect to Web Worker
 * // In main thread
 * import { host } from 'postbridge';
 *
 * const worker = new Worker('worker.js');
 * const connection = await host.connect(worker, {
 *   getSettings: () => ({ theme: 'dark' }),
 *   processResult: (result) => {
 *     console.log('Got result:', result);
 *   }
 * });
 *
 * // Call worker methods:
 * const result = await connection.remote.processData([1, 2, 3]);
 *
 * // Cleanup when done:
 * connection.close();
 *
 * Example 2: Connect to iframe
 * // In parent window
 * const iframe = document.getElementById('my-iframe');
 * const connection = await host.connect(iframe, {
 *   config: { apiKey: 'abc123' },
 *   notifyUser: (message) => alert(message)
 * });
 *
 * Example 3: Multiple connections
 * const worker1 = new Worker('worker1.js');
 * const worker2 = new Worker('worker2.js');
 * const conn1 = await host.connect(worker1, schema);
 * const conn2 = await host.connect(worker2, schema);
 * // Each has unique connectionID and independent RPC channels
 *
 * HOW IT WORKS:
 * ────────────
 * 1. Generate unique connectionID
 * 2. Determine correct targets for listening/sending based on guest type
 * 3. Set up two handlers:
 *    a. handleHandshake - processes initial HANDSHAKE_REQUEST
 *    b. handleHandshakeReply - waits for confirmation
 * 4. When HANDSHAKE_REQUEST arrives:
 *    - Validate guest (security check for iframes)
 *    - Extract local methods from schema
 *    - Register remote methods (guest → proxy functions)
 *    - Register local methods (host → event handlers)
 *    - Send HANDSHAKE_REPLY with connectionID and methods
 *    - Store connection in global map
 * 5. When confirmation HANDSHAKE_REPLY arrives:
 *    - Resolve promise with Connection object
 * 6. Both sides can now make RPC calls
 *
 * GUEST TYPE DETECTION:
 * ────────────────────
 * The function detects guest type and sets up correct targets:
 *
 * Worker (Web or Node.js):
 * - listenTo: guest (the worker itself)
 * - sendTo: guest (the worker itself)
 *
 * SharedWorker:
 * - listenTo: guest.port (MessagePort)
 * - sendTo: guest.port (MessagePort)
 *
 * iframe:
 * - listenTo: window (main window)
 * - sendTo: event.source (iframe's window)
 *
 * SECURITY:
 * ────────
 * For iframes, validates origin and source to prevent message spoofing.
 * Workers don't need validation (browser-isolated by design).
 *
 * CONNECTION LIFECYCLE:
 * ────────────────────
 * 1. connect() called → Promise created
 * 2. Wait for HANDSHAKE_REQUEST from guest
 * 3. Send HANDSHAKE_REPLY to guest
 * 4. Wait for confirmation HANDSHAKE_REPLY
 * 5. Promise resolves → Connection active
 * 6. Make RPC calls via connection.remote.*
 * 7. connection.close() → Cleanup all listeners
 *
 * CLEANUP:
 * ───────
 * The close() function:
 * - Removes from global connections map
 * - Removes all event listeners (handshake + RPC)
 * - Clears all RPC handlers
 * - Terminates worker (if guest is a worker)
 *
 * Always call close() when done to prevent memory leaks!
 *
 * ERROR HANDLING:
 * ──────────────
 * - Throws if guest is null/undefined
 * - Throws if confirmation arrives but connection doesn't exist
 * - Returns false from isValidTarget if iframe origin doesn't match
 *
 * @param guest The guest to connect to (Worker, iframe, etc.)
 * @param schema Object with functions and data to expose to guest
 * @returns Promise that resolves to Connection object
 */
declare function connect(guest: Guest, schema?: Schema): Promise<Connection>;
/**
 * Host API Export
 * ──────────────
 * Exports the host.connect() function for use in host contexts.
 *
 * Usage:
 * import { host } from 'postbridge';
 * const worker = new Worker('worker.js');
 * const connection = await host.connect(worker, { ... });
 */
declare const _default: {
    connect: typeof connect;
};
export default _default;
