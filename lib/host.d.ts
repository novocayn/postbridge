import { Guest, Connection, Schema } from './types';
declare function connect(guest: Guest, schema?: Schema): Promise<Connection>;
declare const _default: {
    connect: typeof connect;
};
export default _default;
