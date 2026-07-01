import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Transaction: a.model({
    date: a.date().required(),
    month: a.string().required(),
    year: a.integer().required(),
    type: a.enum(['Ingreso', 'Egreso']),
    categoryId: a.id().required(),
    categoryName: a.string().required(),
    conceptId: a.id().required(),
    conceptName: a.string().required(),
    detail: a.string(),
    budget: a.float(),
    amount: a.float().required(),
    currency: a.string().required(),
    notes: a.string(),
  }).authorization(allow => [allow.owner()]),

  Category: a.model({
    name: a.string().required(),
    type: a.enum(['Ingreso', 'Egreso']),
    isActive: a.boolean().required().default(true),
    isBase: a.boolean().required().default(false),
    concepts: a.hasMany('Concept', 'categoryId'),
  }).authorization(allow => [allow.owner()]),

  Concept: a.model({
    name: a.string().required(),
    categoryId: a.id().required(),
    category: a.belongsTo('Category', 'categoryId'),
    isActive: a.boolean().required().default(true),
    isBase: a.boolean().required().default(false),
  }).authorization(allow => [allow.owner()]),

  CashAccount: a.model({
    name: a.string().required(),
    isActive: a.boolean().required().default(true),
    order: a.integer(),
  }).authorization(allow => [allow.owner()]),

  CashReconciliation: a.model({
    cutoffDate: a.date().required(),
    month: a.string().required(),
    year: a.integer().required(),
    automaticAccumulated: a.float().required(),
    manualAdjustment: a.float().required().default(0),
    totalBase: a.float().required(),
    totalLocated: a.float().required(),
    pendingToLocate: a.float().required(),
    locatedPercentage: a.float().required(),
    status: a.enum(['Cuadrado', 'FaltaUbicar', 'Sobra']),
    balances: a.hasMany('CashBalance', 'reconciliationId'),
  }).authorization(allow => [allow.owner()]),

  CashBalance: a.model({
    reconciliationId: a.id().required(),
    reconciliation: a.belongsTo('CashReconciliation', 'reconciliationId'),
    accountId: a.id().required(),
    accountName: a.string().required(),
    balance: a.float().required(),
  }).authorization(allow => [allow.owner()]),

  RecurringPayment: a.model({
    name: a.string().required(),
    type: a.enum(['Ingreso', 'Egreso']),
    categoryId: a.id().required(),
    categoryName: a.string().required(),
    conceptId: a.id().required(),
    conceptName: a.string().required(),
    estimatedAmount: a.float().required(),
    payDay: a.integer().required(),
    frequency: a.enum(['mensual', 'quincenal', 'anual', 'personalizada']),
    customIntervalDays: a.integer(),
    isActive: a.boolean().required().default(true),
    notes: a.string(),
  }).authorization(allow => [allow.owner()]),

  AppSetting: a.model({
    defaultCurrency: a.string().required().default('COP'),
    defaultYear: a.integer().required(),
    defaultMonth: a.string().required(),
  }).authorization(allow => [allow.owner()]),

  ImportBatch: a.model({
    filename: a.string().required(),
    totalRows: a.integer().required(),
    successfulRows: a.integer().required(),
    failedRows: a.integer().required(),
    errors: a.json(),
    status: a.enum(['completed', 'partial', 'failed']),
  }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
