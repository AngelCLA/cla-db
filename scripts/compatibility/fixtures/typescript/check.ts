// CLA-DB: Type resolution fixture for NodeNext and Bundler consumer configs.
import { createRxDatabase, type RxDatabase, type RxJsonSchema } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { replicateRxCollection } from '@clatech/db/plugins/replication';

type Item = {
    id: string;
    label: string;
};

const schema: RxJsonSchema<Item> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' }
    },
    required: ['id', 'label']
};

export async function check(): Promise<RxDatabase> {
    const db = await createRxDatabase({
        name: 'ts_check',
        storage: getRxStorageMemory()
    });
    await db.addCollections({ items: { schema } });
    void replicateRxCollection;
    return db;
}
