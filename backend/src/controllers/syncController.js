const CentralSyncState = require('../models/CentralSyncState');
const { APP_ID } = require('../utils/centralEntitlement');
const { sendSuccess } = require('../utils/response');

// What the last sync with Central saw. The sync runs by itself (jobs/centralSync.js), so this only reports.
const getSyncStatus = async (req, res) => {
    const state = await CentralSyncState.findById(APP_ID).lean();
    return sendSuccess(res, 'Sync status retrieved', {
        checkedAt: state?.checkedAt || null,
        syncedAt: state?.syncedAt || null,
        profilesSyncedAt: state?.profilesSyncedAt || null,
        lastError: state?.lastError || null,
        warnings: state?.warnings || [],
        summary: state?.lastSummary || null,
    });
};

module.exports = { getSyncStatus };
