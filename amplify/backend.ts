import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({ auth, data });

/**
 * Ambiente: Amplify define AWS_BRANCH durante el build de cada rama.
 * En sandbox local no existe, por eso el valor por defecto.
 */
const branch = process.env.AWS_BRANCH ?? 'sandbox';
const environment = branch === 'main' ? 'production' : branch;

/**
 * Etiquetas para separación de costos en AWS (Cost Allocation Tags).
 * Se propagan a TODOS los recursos creados por este backend
 * (Cognito, AppSync, DynamoDB, IAM roles, etc.)
 *
 * Para activar en facturación:
 * 1. Ir a AWS Billing > Cost Allocation Tags
 * 2. Activar la tag "Project" y las que tienen prefijo "project:" como
 *    "User-defined cost allocation tags"
 * 3. Esperar ~24h para que aparezcan en Cost Explorer
 */
const tags = Tags.of(backend.stack);

// Etiqueta principal. Valor exacto: "finanzas personales"
tags.add('Project', 'finanzas personales');

tags.add('project:name', 'finanzas-personales');
tags.add('project:environment', environment);
tags.add('project:owner', 'sebasgao05');
tags.add('project:cost-center', 'finanzas-personales');
tags.add('project:managed-by', 'amplify-gen2');

/**
 * Etiquetas "Name" legibles en la consola de AWS.
 * Cambiar una tag no reemplaza el recurso, por lo que no hay pérdida de datos.
 * (Renombrar la tabla DynamoDB, el User Pool o el Identity Pool sí los
 * reemplazaría, así que no se toca su nombre físico.)
 */
const prefix = `finanzas-personales-${environment}`;

Tags.of(backend.auth.resources.userPool).add('Name', `${prefix}-cognito-user-pool`);
Tags.of(backend.auth.resources.cfnResources.cfnIdentityPool).add(
  'Name',
  `${prefix}-cognito-identity-pool`,
);
Tags.of(backend.data.resources.graphqlApi).add('Name', `${prefix}-appsync-api`);

for (const [model, table] of Object.entries(backend.data.resources.tables)) {
  Tags.of(table).add('Name', `${prefix}-dynamodb-${model}`);
}
