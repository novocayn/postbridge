import { GuestConnectOptions, Connection, Schema } from './types';
declare function connect(schema?: Schema, options?: GuestConnectOptions): Promise<Connection>;
declare const _default: {
    connect: typeof connect;
};
export default _default;
