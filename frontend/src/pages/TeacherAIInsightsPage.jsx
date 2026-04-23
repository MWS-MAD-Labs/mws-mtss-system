import React, { useState, useEffect } from 'react';
import { Bell, Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import * as aiInsightService from '@/services/aiInsightService';

/**
 * Teacher AI Insights Page - Phase 2
 * View AI-generated student insights and alerts
 */
export default function TeacherAIInsightsPage() {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'new', severity: '', alertType: '' });

    useEffect(() => {
        loadAlerts();
        loadStats();
    }, [filter]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const data = await aiInsightService.getMyAlerts({
                status: filter.status || undefined,
                severity: filter.severity || undefined,
                alertType: filter.alertType || undefined,
                limit: 20
            });
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await aiInsightService.getAlertStatistics(30);
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await aiInsightService.markAlertAsRead(alertId);
            loadAlerts();
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    const handleResolve = async (alertId) => {
        try {
            await aiInsightService.resolveAlert(alertId, 'Resolved by teacher');
            loadAlerts();
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800 border-blue-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            urgent: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[severity] || colors.medium;
    };

    const getAlertIcon = (alertType) => {
        const icons = {
            academic_struggle: AlertTriangle,
            learning_style_detected: Brain,
            emotional_pattern: TrendingUp,
            breakthrough: CheckCircle,
            intervention_needed: Bell
        };
        const Icon = icons[alertType] || Bell;
        return <Icon className="w-5 h-5" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        AI Student Insights
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        AI-powered pattern detection and personalized student alerts
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && stats.totalStats && stats.totalStats[0] && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats.totalStats[0].total || 0}
                                    </p>
                                </div>
                                <Bell className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {stats.totalStats[0].highPriority || 0}
                                    </p>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-orange-500" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Priority</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(stats.totalStats[0].avgPriorityScore || 0)}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Success Stories</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {stats.byType?.find(t => t._id === 'breakthrough')?.count || 0}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All</option>
                                <option value="new">New</option>
                                <option value="acknowledged">Acknowledged</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Severity
                            </label>
                            <select
                                value={filter.severity}
                                onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type
                            </label>
                            <select
                                value={filter.alertType}
                                onChange={(e) => setFilter({ ...filter, alertType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">All Types</option>
                                <option value="academic_struggle">Academic Struggle</option>
                                <option value="learning_style_detected">Learning Style</option>
                                <option value="emotional_pattern">Emotional Pattern</option>
                                <option value="breakthrough">Breakthrough</option>
                                <option value="intervention_needed">Intervention Needed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading alerts...</p>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                All caught up!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                No alerts match your current filters.
                            </p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert._id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="mt-1">
                                            {getAlertIcon(alert.alertType)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {alert.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Student: <span className="font-medium">{alert.studentName}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Score: {alert.priorityScore}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {alert.message}
                                </p>

                                {/* Recommendations */}
                                {alert.insights?.recommendations && alert.insights.recommendations.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                            Recommended Actions:
                                        </p>
                                        <ul className="space-y-1">
                                            {alert.insights.recommendations.slice(0, 2).map((rec, idx) => (
                                                <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                                                    • {rec.action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center space-x-2">
                                    {alert.status === 'new' && (
                                        <button
                                            onClick={() => handleMarkAsRead(alert._id)}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Mark as Read</span>
                                        </button>
                                    )}
                                    {alert.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleResolve(alert._id)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Resolve</span>
                                        </button>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(alert.generatedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
