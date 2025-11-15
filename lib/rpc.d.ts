import { Environment, PostBridgeEvent, Schema, Target } from './types';
declare const SYM_TRANSFERABLES: unique symbol;
export declare function registerLocalMethods(methods: Record<string, (...args: any[]) => any> | undefined, rpcConnectionID: string, listenTo: Environment, sendTo: Target, remote: Schema): () => void;
export declare function createRPC(rpcCallName: string, rpcConnectionID: string, event: PostBridgeEvent, listeners: Array<() => void> | undefined, listenTo: Environment, sendTo: Target): (...args: any[]) => Promise<unknown>;
export declare function registerRemoteMethods(schema: Schema | undefined, methodNames: Iterable<string> | undefined, connectionID: string, event: PostBridgeEvent, listenTo: Environment, sendTo: Target): {
    remote: {
        [x: string]: any;
    };
    unregisterRemote: () => void;
};
export declare const withTransferable: <Transferable, Result extends object>(cb: (transfer: <T extends Transferable>(transferable: T) => T) => Result) => Result & {
    [SYM_TRANSFERABLES]: Transferable[];
};
export {};
