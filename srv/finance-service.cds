using finance.approval as fa from '../db/schema';

service FinanceApprovalService {

  @restrict: [
    // Requesters can CREATE and READ their own requests
    { grant: ['CREATE','READ'], to: 'FinanceRequester', where: 'requester = $user' },

    // Approvers can READ requests assigned to them
    { grant: 'READ', to: 'FinanceApprover', where: 'currentApprover = $user' }
  ]
  entity FinanceRequests as projection on fa.FinanceRequests;

  entity ApprovalHistory as projection on fa.ApprovalHistory;

  // Only approvers can invoke approval actions
  @restrict: [{ grant: 'invoke', to: 'FinanceApprover' }]
  action approveRequest(ID : UUID);

  @restrict: [{ grant: 'invoke', to: 'FinanceApprover' }]
  action rejectRequest(ID : UUID, reason : String);

}
