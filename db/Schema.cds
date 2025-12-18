namespace finance.approval;

using { cuid } from '@sap/cds/common';

/**
 * Root entity for finance approval requests
 */
entity FinanceRequests : cuid {
  requestType     : String(20);
  referenceNumber : String(30);
  amount          : Decimal(15,2);
  currency        : String(3);
  costCenter      : String(10);
  requester       : String(80);
  status          : String(20);
  currentApprover : String(80);
  createdAt       : Timestamp;
  updatedAt       : Timestamp;
}

/**
 * Child entity to store approval decisions
 */
entity ApprovalHistory : cuid {
  request   : Association to FinanceRequests;
  approver  : String(80);
  decision  : String(20);
  comment   : String(255);
  decidedAt : Timestamp;
}
