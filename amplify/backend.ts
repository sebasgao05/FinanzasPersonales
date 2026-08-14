import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({ auth, data });

/**
 * Etiquetas para separación de costos en AWS (Cost Allocation Tags).
 * Estas tags se propagan a TODOS los recursos creados por este backend
 * (Cognito, AppSync, DynamoDB, IAM roles, etc.)
 *
 * Para activar en facturación:
 * 1. Ir a AWS Billing > Cost Allocation Tags
 * 2. Activar las tags con prefijo "project:" como "User-defined cost allocation tags"
 * 3. Esperar ~24h para que aparezcan en Cost Explorer
 */
const tags = Tags.of(backend.stack);

tags.add('project:name', 'finanzas-personales');
tags.add('project:environment', 'production');
tags.add('project:owner', 'sebasgao05');
tags.add('project:cost-center', 'finanzas-personales');
tags.add('project:managed-by', 'amplify-gen2');
