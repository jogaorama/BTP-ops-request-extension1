using finance.approval as fa from '../db/schema';

service FinanceApprovalService {

  entity FinanceRequests
    as projection on fa.FinanceRequests;

  entity ApprovalHistory
    as projection on fa.ApprovalHistory;

  action approveRequest(ID : UUID);
  action rejectRequest(ID : UUID, reason : String);

}
