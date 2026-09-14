const mongoose = require('mongoose');

// Singleton document (_id always 'manual-sync') tracking the shared, global
// cooldown for the manual "Sync Now" button. Backed by Mongo (not an
// in-memory cache) so the cooldown is real across restarts and would stay
// correct even if the app ever runs more than one instance.
const syncStatusSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: 'manual-sync'
    },
    isRunning: {
        type: Boolean,
        default: false
    },
    lastTriggeredAt: Date,
    lastTriggeredBy: String,
    lastResult: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('SyncStatus', syncStatusSchema);
