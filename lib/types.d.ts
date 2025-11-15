export interface NodeWorker {
    on(event: string, handler: any): void;
    off(event: string, handler: any): void;
    postMessage(message: any): void;
    terminate(): void;
}
export type WorkerLike = Worker | NodeWorker;
export declare enum events {
    MESSAGE = "message"
}
export declare enum actions {
    HANDSHAKE_REQUEST = "POSTBRIDGE/HANDSHAKE_REQUEST",
    HANDSHAKE_REPLY = "POSTBRIDGE/HANDSHAKE_REPLY",
    RPC_REQUEST = "POSTBRIDGE/RPC_REQUEST",
    RPC_RESOLVE = "POSTBRIDGE/RPC_RESOLVE",
    RPC_REJECT = "POSTBRIDGE/RPC_REJECT"
}
export type Schema = Record<string, any>;
export interface Connection {
    id: string;
    remote: Schema;
    close: () => void;
}
export type Connections = Record<string, Connection>;
export interface PostBridgeEvent extends EventListener {
    source?: Window;
    origin?: string;
    data: HandshakeRequestPayload | HandshakeConfirmationPayload | RPCRequestPayload | RPCResolvePayload;
}
export interface HandshakeRequestPayload {
    action: actions.HANDSHAKE_REQUEST;
    connectionID: string;
    methodNames: string[];
    schema: Schema;
}
export interface HandshakeConfirmationPayload {
    action: actions.HANDSHAKE_REPLY;
    connectionID: string;
    methodNames: string[];
    schema: Schema;
}
export interface RPCRequestPayload {
    action: actions.RPC_REQUEST;
    args: any[];
    callID: string;
    callName: string;
    connectionID: string;
}
export interface RPCResolvePayload {
    action: actions.RPC_RESOLVE | actions.RPC_REJECT;
    result?: any | null;
    error?: Error | null;
    callID: string;
    callName: string;
    connectionID: string;
}
export type GuestConnectOptions = {
    hostTarget?: Target;
    onConnectionSetup?: (remote: Schema) => Promise<void>;
};
export type Guest = WorkerLike | HTMLIFrameElement | SharedWorker;
export type Target = Window | WorkerLike | MessagePort;
export type Environment = Window | WorkerLike | MessagePort;
export declare enum bridgeActions {
    BRIDGE_HANDSHAKE = "SOCKBRIDGE/HANDSHAKE",
    BRIDGE_HANDSHAKE_ACK = "SOCKBRIDGE/HANDSHAKE_ACK",
    BRIDGE_BROADCAST = "SOCKBRIDGE/BROADCAST",
    BRIDGE_RELAY = "SOCKBRIDGE/RELAY",
    BRIDGE_DISCONNECT = "SOCKBRIDGE/DISCONNECT",
    BRIDGE_GET_STATE = "SOCKBRIDGE/GET_STATE",
    BRIDGE_STATE_RESPONSE = "SOCKBRIDGE/STATE_RESPONSE",
    BRIDGE_SET_STATE = "SOCKBRIDGE/SET_STATE",
    BRIDGE_STATE_UPDATE = "SOCKBRIDGE/STATE_UPDATE",
    BRIDGE_HANDSHAKE_ERROR = "SOCKBRIDGE/HANDSHAKE_ERROR",
    BRIDGE_GET_TABS = "SOCKBRIDGE/GET_TABS",
    BRIDGE_TABS_RESPONSE = "SOCKBRIDGE/TABS_RESPONSE",
    BRIDGE_DIRECT_MESSAGE = "SOCKBRIDGE/DIRECT_MESSAGE"
}
export interface BridgeHandshakePayload {
    action: bridgeActions.BRIDGE_HANDSHAKE;
    tabID: string;
    methodNames: string[];
    schema?: Schema;
    channel?: string;
}
export interface BridgeHandshakeAckPayload {
    action: bridgeActions.BRIDGE_HANDSHAKE_ACK;
    tabID: string;
    channel: string;
    sharedState?: Schema;
}
export interface BridgeHandshakeErrorPayload {
    action: bridgeActions.BRIDGE_HANDSHAKE_ERROR;
    error: string;
    code: "DUPLICATE_TAB_ID" | "INVALID_PAYLOAD" | "UNKNOWN_ERROR";
    tabID?: string;
    channel?: string;
}
export interface BridgeBroadcastPayload {
    action: bridgeActions.BRIDGE_BROADCAST;
    senderTabID: string;
    channel: string;
    methodName: string;
    args: any[];
    result?: any;
    error?: any;
}
export interface BridgeRelayPayload {
    action: bridgeActions.BRIDGE_RELAY;
    senderTabID: string;
    methodName: string;
    args: any[];
    senderResult?: any;
    senderError?: any;
}
export interface BridgeDirectMessagePayload {
    action: bridgeActions.BRIDGE_DIRECT_MESSAGE;
    senderTabID: string;
    targetTabID: string;
    channel: string;
    methodName: string;
    args: any[];
    result?: any;
    error?: any;
}
export interface BridgeDisconnectPayload {
    action: bridgeActions.BRIDGE_DISCONNECT;
    tabID: string;
    channel: string;
}
export interface BridgeGetTabsPayload {
    action: bridgeActions.BRIDGE_GET_TABS;
    channel: string;
    requestingTabID: string;
}
export interface BridgeTabsResponsePayload {
    action: bridgeActions.BRIDGE_TABS_RESPONSE;
    tabIDs: string[];
    channel: string;
}
export interface BridgeConnection {
    id: string;
    remote: Schema & ((targetTabID: string) => Schema);
    getConnectedTabs(): Promise<string[]>;
    close: () => void;
}
export type BridgeConnectOptions = {
    workerURL?: string;
    channel?: string;
    tabID?: string;
};
