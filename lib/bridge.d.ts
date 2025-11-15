import { Schema, BridgeConnection, BridgeConnectOptions } from './types';
declare function connect(schema?: Schema, options?: BridgeConnectOptions): Promise<BridgeConnection>;
declare const _default: {
    connect: typeof connect;
};
export default _default;
