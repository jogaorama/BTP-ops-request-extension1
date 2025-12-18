const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { FinanceRequests, ApprovalHistory } = this.entities;

    // Default handling on create
    this.before('CREATE', FinanceRequests, (req) => {
        if (!req.data.status) {
            req.data.status = 'SUBMITTED';
        }

        // For now, set a dummy approver (later comes from rules / S4)
        if (!req.data.currentApprover) {
            req.data.currentApprover = 'manager1';
        }

        req.data.createdAt = new Date();
        req.data.updatedAt = new Date();
    });

    // Approve action
    this.on('approve', FinanceRequests, async (req) => {
        const { ID } = req.params[0];
        const user = req.user.id || 'manager1';

        const tx = cds.transaction(req);

        const request = await tx.read(FinanceRequests).where({ ID });

        if (!request.length) {
            req.reject(404, 'Finance request not found');
        }

        const fr = request[0];

        if (fr.status !== 'SUBMITTED') {
            req.reject(400, 'Only SUBMITTED requests can be approved');
        }

        if (fr.currentApprover !== user) {
            req.reject(403, 'You are not the current approver');
        }

        await tx.update(FinanceRequests)
            .set({
                status: 'APPROVED',
                updatedAt: new Date()
            })
            .where({ ID });

        await tx.insert(ApprovalHistory).entries({
            request_ID: ID,
            approver: user,
            decision: 'APPROVED',
            decidedAt: new Date()
        });

        return { success: true };
    });

    // Reject action
    this.on('reject', FinanceRequests, async (req) => {
        const { ID } = req.params[0];
        const { reason } = req.data;
        const user = req.user.id || 'manager1';

        const tx = cds.transaction(req);

        const request = await tx.read(FinanceRequests).where({ ID });

        if (!request.length) {
            req.reject(404, 'Finance request not found');
        }

        const fr = request[0];

        if (fr.status !== 'SUBMITTED') {
            req.reject(400, 'Only SUBMITTED requests can be rejected');
        }

        if (fr.currentApprover !== user) {
            req.reject(403, 'You are not the current approver');
        }

        await tx.update(FinanceRequests)
            .set({
                status: 'REJECTED',
                updatedAt: new Date()
            })
            .where({ ID });

        await tx.insert(ApprovalHistory).entries({
            request_ID: ID,
            approver: user,
            decision: 'REJECTED',
            comment: reason,
            decidedAt: new Date()
        });

        return { success: true };
    });

});
