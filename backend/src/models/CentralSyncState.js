const mongoose = require('mongoose');

// One document (_id is the application id) holding what the last sync with Central saw, and a lease so only one
// server instance syncs at a time.
const centralSyncStateSchema = new mongoose.Schema({
    _id: { type: String },
    key: { type: String, default: null },
    syncedAt: Date,
    checkedAt: Date,
    profilesSyncedAt: Date,
    lastError: { type: String, default: null },
    warnings: [String],
    lastSummary: mongoose.Schema.Types.Mixed,
    lockedUntil: Date,
}, { collection: 'centralsyncstates' });

module.exports = mongoose.model('CentralSyncState', centralSyncStateSchema);
