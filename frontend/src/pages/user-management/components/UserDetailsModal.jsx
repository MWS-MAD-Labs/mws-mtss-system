import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import {
    X,
    Mail,
    Building,
    Briefcase,
    Calendar,
    Clock,
    User,
    Users,
    GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import OrganizationAssignmentModal from "./OrganizationAssignmentModal";

const UserDetailsModal = memo(({ user, onClose }) => {
    const [showOrganizationModal, setShowOrganizationModal] = useState(false);

    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatWorkingPeriod = (workingPeriod) => {
        if (!workingPeriod) return "N/A";
        const { years, months, days } = workingPeriod;
        return `${years} years, ${months} months, ${days} days`;
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "directorate":
                return "gold";
            case "head_unit":
                return "purple";
            case "teacher":
            case "se_teacher":
                return "blue";
            case "staff":
                return "green";
            case "support_staff":
                return "orange";
            case "student":
                return "gray";
            default:
                return "secondary";
        }
    };

    const formatRole = (role) => {
        switch (role) {
            case "directorate":
                return "Directorate";
            case "head_unit":
                return "Head Unit";
            case "teacher":
                return "Teacher";
            case "se_teacher":
                return "SE Teacher";
            case "support_staff":
                return "Support Staff";
            case "student":
                return "Student";
            default:
                return role?.charAt(0).toUpperCase() + role?.slice(1);
        }
    };

    return (
        <>
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            User Details
                        </DialogTitle>
                    </DialogHeader>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Full Name
                                    </label>
                                    <p className="text-foreground font-medium">{user.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Username
                                    </label>
                                    <p className="text-foreground">{user.username || "Not set"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email Address
                                </label>
                                <p className="text-foreground">{user.email}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Role
                                </label>
                                <Badge variant={getRoleColor(user.role)} className="text-sm">
                                    {formatRole(user.role)}
                                </Badge>
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Building className="w-4 h-4 mr-2" />
                                Organization
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Department
                                    </label>
                                    <p className="text-foreground">{user.department || "Not assigned"}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Unit
                                    </label>
                                    <p className="text-foreground">{user.unit || "Not assigned"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Job Level
                                    </label>
                                    <p className="text-foreground">{user.jobLevel || "Not specified"}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Job Position
                                    </label>
                                    <p className="text-foreground">{user.jobPosition || "Not specified"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Employment Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Briefcase className="w-4 h-4 mr-2" />
                                Employment Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <Badge
                                        variant={
                                            user.employmentStatus === "Permanent"
                                                ? "default"
                                                : user.employmentStatus === "Contract"
                                                    ? "secondary"
                                                    : "outline"
                                        }
                                    >
                                        {user.employmentStatus || "Unknown"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Account Status
                                    </label>
                                    <Badge variant={user.isActive ? "default" : "destructive"}>
                                        {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Working Period
                                    </label>
                                    <p className="text-foreground text-sm">
                                        {formatWorkingPeriod(user.workingPeriod)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Join Date
                                    </label>
                                    <p className="text-foreground">{formatDate(user.joinDate)}</p>
                                </div>

                                {user.endDate && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            End Date
                                        </label>
                                        <p className="text-foreground">{formatDate(user.endDate)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* System Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                System Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        User ID
                                    </label>
                                    <p className="text-foreground font-mono text-sm">{user.id}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Last Updated
                                    </label>
                                    <p className="text-foreground text-sm">
                                        {user.updatedAt ? formatDate(user.updatedAt) : "Unknown"}
                                    </p>
                                </div>
                            </div>

                            {user.createdAt && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Account Created
                                    </label>
                                    <p className="text-foreground text-sm">{formatDate(user.createdAt)}</p>
                                </div>
                            )}
                        </div>

                        {/* Classes */}
                        {user.classes && user.classes.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Teaching Assignments</h3>
                                <div className="space-y-2">
                                    {user.classes.map((classInfo, index) => {
                                        const labels = [classInfo.grade, classInfo.className || classInfo.subject]
                                            .filter(Boolean)
                                            .join(" • ");
                                        return (
                                            <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{labels}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Role: {classInfo.role || "Teacher"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Organizational Hierarchy */}
                        {(user.reportsTo ||
                            (user.subordinates && user.subordinates.length > 0)) && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Organizational Hierarchy</h3>

                                    {user.reportsTo && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Reports To
                                            </label>
                                            <div className="p-3 bg-muted/30 rounded-lg">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{user.reportsTo.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {user.reportsTo.jobPosition}
                                                        </p>
                                                        {user.reportsTo.department && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {user.reportsTo.department}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {user.subordinates && user.subordinates.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Direct Reports ({user.subordinates.length})
                                            </label>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {user.subordinates.map((subordinate, index) => (
                                                    <div key={index} className="p-3 bg-muted/20 rounded-lg">
                                                        <div className="flex items-center">
                                                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium">{subordinate.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {subordinate.jobPosition}
                                                                </p>
                                                                {subordinate.department && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {subordinate.department}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* Department Overview */}
                        {user.role === "head_unit" && user.department && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Department Overview</h3>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        As Head Unit of {user.department}, you oversee:
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Department:</span>
                                            <p className="text-muted-foreground">{user.department}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium">Unit:</span>
                                            <p className="text-muted-foreground">{user.unit || "N/A"}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        * Full member details available in the main dashboard
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Organization Assignment */}
                        {(user.role === "teacher" ||
                            user.role === "se_teacher" ||
                            user.role === "head_unit" ||
                            user.role === "student") && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center">
                                        <Users className="w-4 h-4 mr-2" />
                                        Organization Assignments
                                    </h3>
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {user.role === "teacher" || user.role === "se_teacher"
                                                ? "Manage this teacher's class assignments, subjects, and homeroom responsibilities."
                                                : user.role === "head_unit"
                                                    ? "View and manage department members under this head unit's supervision."
                                                    : "View this student's class assignments and academic group memberships."}
                                        </p>
                                        <Button
                                            onClick={() => setShowOrganizationModal(true)}
                                            className="w-full"
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            Manage Assignments
                                        </Button>
                                    </div>
                                </div>
                            )}

                        {/* Actions */}
                        <div className="flex justify-end pt-6 border-t">
                            <Button onClick={onClose}>Close</Button>
                        </div>
                    </motion.div>
                </DialogContent>
            </Dialog>

            {showOrganizationModal && (
                <OrganizationAssignmentModal
                    user={user}
                    onClose={() => setShowOrganizationModal(false)}
                />
            )}
        </>
    );
});

UserDetailsModal.displayName = "UserDetailsModal";

export default UserDetailsModal;
