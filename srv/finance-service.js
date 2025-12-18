const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { FinanceRequests, ApprovalHistory } = this.entities;

    // Helper: get current user safely
    function currentUser(req) {
        return req.user && req.user.id ? req.user.id : 'anonymous';
    }

    // ================================
    // CREATE: requester creates a request
    // ================================
    this.before('CREATE', FinanceRequests, (req) => {
        const user = currentUser(req);

        req.data.requester = user;
        req.data.status = 'SUBMITTED';
        req.data.createdAt = new Date();
        req.data.updatedAt = new Date();

        // NOTE: currentApprover assignment will later come from rules / workflow
        if (!req.data.currentApprover) {
            req.data.currentApprover = 'finance.approver'; // placeholder role
        }
    });

    // ================================
    // APPROVE
    // ================================
    this.on('approveRequest', async (req) => {
        const user = currentUser(req);
        const { ID } = req.data;

        const tx = cds.transaction(req);

        const [fr] = await tx.read(FinanceRequests).where({ ID });
        if (!fr) req.reject(404, 'Finance request not found');

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

        return {
            outcome: 'APPROVED',
            message: `Finance request ${ID} approved`
        };
    });

    // ================================
    // REJECT
    // ================================
    this.on('rejectRequest', async (req) => {
        const user = currentUser(req);
        const { ID, reason } = req.data;

        const tx = cds.transaction(req);

        const [fr] = await tx.read(FinanceRequests).where({ ID });
        if (!fr) req.reject(404, 'Finance request not found');

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

        return {
            outcome: 'REJECTED',
            message: `Finance request ${ID} rejected: ${reason}`
        };
    });

});
