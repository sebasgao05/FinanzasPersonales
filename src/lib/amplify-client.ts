import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

/**
 * Amplify Data Client tipado.
 * Usa el schema definido en amplify/data/resource.ts para generar
 * un cliente con tipos para todas las operaciones CRUD.
 *
 * Uso:
 *   import { client } from '@/lib/amplify-client';
 *   const { data } = await client.models.Transaction.list();
 */
export const client = generateClient<Schema>();
