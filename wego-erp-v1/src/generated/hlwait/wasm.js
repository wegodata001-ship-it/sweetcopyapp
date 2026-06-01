
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.HlwaitRoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  label: 'label',
  permissions: 'permissions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitUserScalarFieldEnum = {
  id: 'id',
  authUserId: 'authUserId',
  roleId: 'roleId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  parentId: 'parentId',
  sortOrder: 'sortOrder',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitSupplierScalarFieldEnum = {
  id: 'id',
  supplierCode: 'supplierCode',
  name: 'name',
  phone: 'phone',
  email: 'email',
  address: 'address',
  contactPerson: 'contactPerson',
  taxId: 'taxId',
  openingBalance: 'openingBalance',
  balance: 'balance',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitSupplierLedgerScalarFieldEnum = {
  id: 'id',
  supplierId: 'supplierId',
  entryDate: 'entryDate',
  docType: 'docType',
  description: 'description',
  debit: 'debit',
  credit: 'credit',
  referenceType: 'referenceType',
  referenceId: 'referenceId',
  createdAt: 'createdAt'
};

exports.Prisma.HlwaitCustomerScalarFieldEnum = {
  id: 'id',
  customerCode: 'customerCode',
  name: 'name',
  phone: 'phone',
  email: 'email',
  address: 'address',
  balance: 'balance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitProductScalarFieldEnum = {
  id: 'id',
  categoryId: 'categoryId',
  supplierId: 'supplierId',
  sku: 'sku',
  name: 'name',
  barcode: 'barcode',
  purchasePrice: 'purchasePrice',
  salePrice: 'salePrice',
  currentStock: 'currentStock',
  minStock: 'minStock',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitOrderScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  orderNumber: 'orderNumber',
  status: 'status',
  subtotal: 'subtotal',
  discount: 'discount',
  total: 'total',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deliveredAt: 'deliveredAt',
  cancelledAt: 'cancelledAt'
};

exports.Prisma.HlwaitOrderItemScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  productId: 'productId',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  lineTotal: 'lineTotal',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.HlwaitInventoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  location: 'location',
  quantity: 'quantity',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitInventoryMovementScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  movementType: 'movementType',
  quantity: 'quantity',
  fromLocation: 'fromLocation',
  toLocation: 'toLocation',
  referenceType: 'referenceType',
  referenceId: 'referenceId',
  note: 'note',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.HlwaitPaymentScalarFieldEnum = {
  id: 'id',
  customerId: 'customerId',
  supplierId: 'supplierId',
  amount: 'amount',
  paymentMethod: 'paymentMethod',
  referenceType: 'referenceType',
  referenceId: 'referenceId',
  paidAt: 'paidAt',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.HlwaitExpenseScalarFieldEnum = {
  id: 'id',
  expenseType: 'expenseType',
  supplierId: 'supplierId',
  employeeId: 'employeeId',
  amount: 'amount',
  description: 'description',
  expenseDate: 'expenseDate',
  paymentStatus: 'paymentStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitIncomeScalarFieldEnum = {
  id: 'id',
  incomeType: 'incomeType',
  customerId: 'customerId',
  orderId: 'orderId',
  amount: 'amount',
  description: 'description',
  incomeDate: 'incomeDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HlwaitTaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  assignedUserId: 'assignedUserId',
  dueDate: 'dueDate',
  status: 'status',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  completedAt: 'completedAt'
};

exports.Prisma.HlwaitNotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  body: 'body',
  type: 'type',
  data: 'data',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.HlwaitDocumentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  filePath: 'filePath',
  mimeType: 'mimeType',
  entityType: 'entityType',
  entityId: 'entityId',
  uploadedBy: 'uploadedBy',
  createdAt: 'createdAt'
};

exports.Prisma.HlwaitSettingScalarFieldEnum = {
  key: 'key',
  value: 'value',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  HlwaitRole: 'HlwaitRole',
  HlwaitUser: 'HlwaitUser',
  HlwaitCategory: 'HlwaitCategory',
  HlwaitSupplier: 'HlwaitSupplier',
  HlwaitSupplierLedger: 'HlwaitSupplierLedger',
  HlwaitCustomer: 'HlwaitCustomer',
  HlwaitProduct: 'HlwaitProduct',
  HlwaitOrder: 'HlwaitOrder',
  HlwaitOrderItem: 'HlwaitOrderItem',
  HlwaitInventory: 'HlwaitInventory',
  HlwaitInventoryMovement: 'HlwaitInventoryMovement',
  HlwaitPayment: 'HlwaitPayment',
  HlwaitExpense: 'HlwaitExpense',
  HlwaitIncome: 'HlwaitIncome',
  HlwaitTask: 'HlwaitTask',
  HlwaitNotification: 'HlwaitNotification',
  HlwaitDocument: 'HlwaitDocument',
  HlwaitSetting: 'HlwaitSetting'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
