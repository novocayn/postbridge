import { Guest, NodeWorker, Target, WorkerLike } from './types';
/**
 * Environment Detection: Web Worker
 * ──────────────────────────────────
 * Checks if the current code is running inside a Web Worker (browser).
 *
 * How it works:
 * - Web Workers don't have access to the `window` object (security isolation)
 * - But they do have access to `self` (global object in workers)
 * - If window is undefined and self is defined, we're in a worker
 *
 * Why this matters:
 * - Workers can't access the DOM but can do heavy computation
 * - Different message passing APIs than main thread
 * - Different global scope (self vs window)
 *
 * Example usage:
 * if (isWorker()) {
 *   // We're in a worker, can use self.postMessage()
 * }
 *
 * @returns true if running in a Web Worker, false otherwise
 */
export declare function isWorker(): boolean;
/**
 * Environment Detection: Node.js
 * ───────────────────────────────
 * Checks if the current code is running in Node.js (not browser).
 *
 * How it works:
 * - Node.js has a global `process` object with version information
 * - `process.versions.node` exists only in Node.js
 * - Browsers don't have this property
 *
 * Why this matters:
 * - Node.js has different APIs (no window, no DOM, but has fs, http, etc.)
 * - Worker threads in Node.js use different APIs than Web Workers
 * - Need to require() modules instead of importing browser APIs
 *
 * Example usage:
 * if (isNodeEnv()) {
 *   // Can use Node.js APIs like require('worker_threads')
 * }
 *
 * @returns true if running in Node.js, false otherwise
 */
export declare function isNodeEnv(): boolean;
/**
 * Environment Detection: iframe
 * ──────────────────────────────
 * Checks if the current code is running inside an iframe.
 *
 * How it works:
 * - In a regular window: window.self === window.top (they're the same)
 * - In an iframe: window.self !== window.top (iframe is nested)
 * - window.self always refers to the current window
 * - window.top refers to the topmost window in the frame hierarchy
 *
 * Why this matters:
 * - iframes need to communicate with parent window via postMessage
 * - Security restrictions apply (same-origin policy)
 * - Different context for accessing global variables
 *
 * Example usage:
 * if (isIframe()) {
 *   // We're in an iframe, can use window.parent.postMessage()
 * }
 *
 * @returns true if running in an iframe, false otherwise
 */
export declare function isIframe(): boolean;
/**
 * Schema Processing: Extract Methods
 * ───────────────────────────────────
 * Recursively extracts all functions from a nested object and returns them as
 * a flat map with dot-notation paths. This is necessary because functions
 * cannot be serialized and sent via postMessage.
 *
 * THE PROBLEM:
 * postMessage can only send serializable data (JSON-compatible). Functions,
 * DOM nodes, and other complex objects cannot be sent directly.
 *
 * THE SOLUTION:
 * 1. Extract all functions from the schema object
 * 2. Store them in a flat map with their paths (e.g., "math.add")
 * 3. Remove the functions from the original object (mutates it)
 * 4. Send the function names (strings) via postMessage
 * 5. The receiver creates proxy functions using these names
 *
 * Example:
 * Input schema:
 * {
 *   add: (a, b) => a + b,
 *   math: {
 *     multiply: (a, b) => a * b,
 *     divide: (a, b) => a / b
 *   },
 *   config: { timeout: 5000 }  // non-function data
 * }
 *
 * Output methods:
 * {
 *   "add": [Function],
 *   "math.multiply": [Function],
 *   "math.divide": [Function]
 * }
 *
 * Modified schema (original object is mutated):
 * {
 *   math: {},
 *   config: { timeout: 5000 }  // non-function data preserved
 * }
 *
 * How it works:
 * - Recursively traverses the object tree
 * - When it finds a function, extracts it with its full path
 * - Deletes the function from the original object
 * - Non-function values (numbers, strings, objects) are left intact
 *
 * Why delete from original?
 * - The modified schema is sent via postMessage during handshake
 * - We don't want to lose non-function configuration data
 * - Functions must be removed because they can't be serialized
 *
 * @param obj The schema object to extract methods from (will be mutated!)
 * @returns A flat map of method paths to functions
 */
export declare function extractMethods(obj: any): Record<string, (...args: any) => any>;
/**
 * URL Processing: Extract Origin
 * ───────────────────────────────
 * Converts a full URL into its origin (protocol + hostname + port), removing
 * the path, query, and fragment. This is used for iframe security validation.
 *
 * WHY THIS IS NEEDED:
 * When using postMessage with iframes, we need to validate the origin of
 * messages for security. The origin must match exactly, and should not include
 * default ports.
 *
 * Examples:
 * - "https://example.com/path?query=1" → "https://example.com"
 * - "http://localhost:8080/app" → "http://localhost:8080"
 * - "http://example.com:80/path" → "http://example.com" (port 80 is default)
 * - "file:///path/to/file.html" → "file://"
 *
 * How it works:
 * 1. Parse URL with regex to extract protocol, hostname, port
 * 2. Handle special case for file:// protocol
 * 3. Omit port if it's the default for the protocol
 * 4. Return normalized origin
 *
 * Security implications:
 * - Origin validation prevents malicious iframes from impersonating trusted ones
 * - Same-origin policy enforcement
 * - Must match exactly (including protocol and port)
 *
 * @param url The full URL to extract origin from
 * @returns The origin string (protocol + hostname + port) or null if invalid
 */
export declare function getOriginFromURL(url: string | null): string | null;
/**
 * Object Path Utilities: Get
 * ──────────────────────────
 * Safely retrieves a value from a nested object using a path string or array.
 * Returns a default value if the path doesn't exist.
 *
 * WHY THIS IS NEEDED:
 * When working with nested schemas (e.g., schema.math.add), we need to safely
 * access properties without throwing errors if intermediate keys don't exist.
 *
 * Examples:
 * const obj = { math: { add: fn, multiply: fn }, config: { timeout: 5000 } };
 *
 * get(obj, "math.add") → [Function]
 * get(obj, ["math", "add"]) → [Function]
 * get(obj, "math.subtract") → undefined
 * get(obj, "math.subtract", "default") → "default"
 * get(obj, "config.timeout") → 5000
 *
 * @param obj The object to retrieve value from
 * @param path Dot-notation string or array of keys (e.g., "a.b.c" or ["a", "b", "c"])
 * @param defaultValue Value to return if path doesn't exist
 * @returns The value at the path, or defaultValue if not found
 */
export declare function get(obj: any, path: string | Array<string | number>, defaultValue?: any): any;
/**
 * Object Path Utilities: Set
 * ──────────────────────────
 * Sets a value in a nested object using a path string or array. Creates
 * intermediate objects/arrays as needed.
 *
 * WHY THIS IS NEEDED:
 * When creating proxy functions for nested schemas (e.g., remote.math.add),
 * we need to build the object structure dynamically. This function handles
 * that, creating intermediate objects as needed.
 *
 * Examples:
 * const obj = {};
 * set(obj, "math.add", fn) → obj becomes { math: { add: fn } }
 * set(obj, ["math", "multiply"], fn) → obj becomes { math: { add: fn, multiply: fn } }
 * set(obj, "items.0.name", "foo") → obj becomes { items: [{ name: "foo" }] }
 *
 * How it works:
 * - Traverses the path, creating objects/arrays as needed
 * - If next key is a number, creates an array; otherwise creates an object
 * - Sets the final value at the end of the path
 *
 * @param obj The object to set value in (will be mutated)
 * @param path Dot-notation string or array of keys
 * @param value The value to set at the path
 * @returns The modified object
 */
export declare function set(obj: any, path: string | (string | number)[], value: any): any;
/**
 * ID Generation
 * ─────────────
 * Generates a random alphanumeric ID for uniquely identifying connections
 * and RPC calls.
 *
 * WHY THIS IS NEEDED:
 * - Connection IDs: Ensure messages are routed to the correct guest when
 *   multiple connections exist
 * - Call IDs: Match RPC requests with their responses when multiple calls
 *   are in-flight simultaneously
 *
 * How it works:
 * - Generates a random string of specified length
 * - Uses alphanumeric characters (A-Z, a-z, 0-9)
 * - Default length is 10 characters (62^10 ≈ 839 quadrillion possibilities)
 *
 * Example output:
 * - "aB3dE5fGhI"
 * - "Zx9Qw2Rt8Y"
 *
 * Note: This uses Math.random() which is not cryptographically secure.
 * For security-critical applications, use crypto.getRandomValues() instead.
 * However, for connection/call IDs, Math.random() is sufficient.
 *
 * @param length Number of characters in the ID (default: 10)
 * @returns A random alphanumeric ID
 */
export declare function generateId(length?: number): string;
/**
 * Message Passing: Get Target Host
 * ─────────────────────────────────
 * Automatically detects the appropriate message target based on the current
 * execution environment. This is used by guests to determine where to send
 * messages to reach the host.
 *
 * WHY THIS IS NEEDED:
 * Different environments have different targets:
 * - Node.js worker → parentPort (from worker_threads module)
 * - Web Worker → self (the global object in workers)
 * - iframe → window.parent (the parent window)
 *
 * This function abstracts away these differences so guest code can simply
 * call getTargetHost() without worrying about the environment.
 *
 * Examples:
 * // In a Web Worker:
 * const target = getTargetHost(); // Returns self
 * target.postMessage({ ... });
 *
 * // In an iframe:
 * const target = getTargetHost(); // Returns window.parent
 * target.postMessage({ ... }, "*");
 *
 * // In a Node.js worker thread:
 * const target = getTargetHost(); // Returns parentPort
 * target.postMessage({ ... });
 *
 * @returns The appropriate messaging target for the current environment
 * @throws Error if no valid target can be determined
 */
export declare function getTargetHost(): any;
/**
 * Message Passing: Post Message to Target
 * ────────────────────────────────────────
 * Sends a message to a target, automatically handling environment-specific
 * differences in the postMessage API.
 *
 * THE PROBLEM:
 * Different environments have different postMessage signatures:
 *
 * Browser (window/iframe):
 * - window.postMessage(message, targetOrigin, [transfer])
 * - OR window.postMessage(message, { targetOrigin, transfer })
 *
 * Web Worker:
 * - worker.postMessage(message, [transfer])
 * - OR worker.postMessage(message, { transfer })
 *
 * Node.js Worker:
 * - parentPort.postMessage(message, { transfer: [...] })
 *
 * THE SOLUTION:
 * This function detects the environment and calls postMessage with the
 * correct signature.
 *
 * TRANSFERABLES:
 * Some objects (ArrayBuffer, MessagePort, ImageBitmap, etc.) can be
 * "transferred" rather than cloned. This is more efficient because:
 * - Transferring moves ownership without copying
 * - Original context loses access (prevents race conditions)
 * - Particularly important for large data (video, audio, images)
 *
 * Examples:
 * // Send to iframe:
 * postMessageToTarget(iframe.contentWindow, { action: "ping" }, "https://example.com");
 *
 * // Send to worker with transferable:
 * const buffer = new ArrayBuffer(1024);
 * postMessageToTarget(worker, { buffer }, undefined, [buffer]);
 *
 * // Send to Node.js worker:
 * postMessageToTarget(parentPort, { data: "hello" });
 *
 * @param target The target to send the message to (window, worker, or port)
 * @param message The message to send (must be structured-cloneable)
 * @param origin Optional origin for iframe communication (default: "*")
 * @param transferables Optional array of transferable objects
 * @throws Error if target is invalid or postMessage fails
 */
export declare function postMessageToTarget(target: Target, message: any, origin?: string, transferables?: Transferable[]): void;
/**
 * Type Guard: Is Node Worker
 * ──────────────────────────
 * TypeScript type guard to check if a guest/target is a Node.js Worker.
 * This helps TypeScript understand the type and enables type-safe operations.
 *
 * Why type guards?
 * - TypeScript can't automatically narrow union types
 * - Type guards tell TypeScript "if this function returns true, the type is X"
 * - Enables autocomplete and type checking for worker-specific methods
 *
 * @param guest The guest or target to check
 * @returns true if it's a Node.js Worker (type narrowed to NodeWorker)
 */
export declare function isNodeWorker(guest: Guest | Target): guest is NodeWorker;
/**
 * Type Guard: Is Worker-Like
 * ──────────────────────────
 * TypeScript type guard to check if a guest is any kind of worker (Web or Node.js).
 *
 * Why check both?
 * - Node.js workers and Web Workers have similar but different APIs
 * - Both can be treated as "worker-like" for certain operations
 * - This guard includes both types in the WorkerLike union
 *
 * @param guest The guest to check
 * @returns true if it's a worker (type narrowed to WorkerLike)
 */
export declare function isWorkerLike(guest: Guest): guest is WorkerLike;
/**
 * Event Handling: Add Event Listener
 * ───────────────────────────────────
 * Adds an event listener to a target, handling different APIs across environments.
 *
 * THE PROBLEM:
 * - Web APIs use: target.addEventListener(event, handler)
 * - Node.js APIs use: target.on(event, handler)
 *
 * THE SOLUTION:
 * Detect the target type and use the appropriate method.
 *
 * Why this matters:
 * - Single unified API for event subscription
 * - Works across all environments
 * - Type-safe (TypeScript knows which API to use)
 *
 * Example usage:
 * addEventListener(worker, "message", (event) => {
 *   console.log("Received:", event.data);
 * });
 *
 * @param target The target to add listener to
 * @param event The event name (usually "message")
 * @param handler The event handler function
 */
export declare function addEventListener(target: Target, event: string, handler: EventListenerOrEventListenerObject): void;
/**
 * Event Handling: Remove Event Listener
 * ──────────────────────────────────────
 * Removes an event listener from a target, handling different APIs across
 * environments.
 *
 * THE PROBLEM:
 * - Web APIs use: target.removeEventListener(event, handler)
 * - Node.js APIs use: target.off(event, handler)
 *
 * THE SOLUTION:
 * Detect the target type and use the appropriate method.
 *
 * Why this is important:
 * - Prevents memory leaks by properly cleaning up listeners
 * - Essential when closing connections
 * - Must use same handler reference that was added
 *
 * Example usage:
 * const handler = (event) => { ... };
 * addEventListener(worker, "message", handler);
 * // Later...
 * removeEventListener(worker, "message", handler);
 *
 * @param target The target to remove listener from
 * @param event The event name (usually "message")
 * @param handler The exact handler function that was added
 */
export declare function removeEventListener(target: Target, event: string, handler: EventListenerOrEventListenerObject): void;
/**
 * Event Data Normalization
 * ────────────────────────
 * Normalizes message event data across Web and Node.js environments.
 *
 * THE PROBLEM:
 * Different environments structure message events differently:
 *
 * Web (workers, iframes):
 * - Event is an object: { data: { ... }, source, origin, ... }
 * - Actual message is in event.data
 *
 * Node.js (worker threads):
 * - Event IS the message: { action: "...", ... }
 * - No wrapper, message is directly passed
 *
 * THE SOLUTION:
 * Try event.data first (Web), fall back to event itself (Node.js).
 *
 * Why this matters:
 * - Rest of codebase doesn't need to know about environment differences
 * - Single way to access message data
 * - Works correctly in all contexts
 *
 * Examples:
 * // Web environment:
 * const data = getEventData({ data: { action: "ping" }, origin: "..." });
 * // Returns: { action: "ping" }
 *
 * // Node.js environment:
 * const data = getEventData({ action: "ping", callID: "123" });
 * // Returns: { action: "ping", callID: "123" }
 *
 * @param event The message event
 * @returns The actual message data
 */
export declare function getEventData(event: any): any;
