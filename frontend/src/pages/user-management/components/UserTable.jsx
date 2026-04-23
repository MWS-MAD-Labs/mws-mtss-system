import React, { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Trash2, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const StatusBadge = memo(({ status, employmentStatus }) => {
    const getStatusColor = (status, employmentStatus) => {
        if (!status) return "secondary";
        if (!status) return "destructive";

        switch (employmentStatus) {
            case 'Permanent': return 'default';
            case 'Contract': return 'secondary';
            case 'Probation': return 'outline';
            default: return 'secondary';
        }
    };

    return (
        <Badge variant={getStatusColor(status, employmentStatus)} className="text-xs">
            {employmentStatus || 'Unknown'}
        </Badge>
    );
});

StatusBadge.displayName = 'StatusBadge';

const RoleBadge = memo(({ role }) => {
    const getRoleColor = (role) => {
        switch (role) {
            case 'directorate': return 'gold';
            case 'head_unit': return 'purple';
            case 'teacher':
            case 'se_teacher': return 'blue';
            case 'staff': return 'green';
            case 'support_staff': return 'orange';
            case 'student': return 'gray';
            default: return 'secondary';
        }
    };

    const formatRole = (role) => {
        switch (role) {
            case 'directorate': return 'Directorate';
            case 'head_unit': return 'Head Unit';
            case 'teacher': return 'Teacher';
            case 'se_teacher': return 'SE Teacher';
            case 'support_staff': return 'Support Staff';
            case 'student': return 'Student';
            default: return role?.charAt(0).toUpperCase() + role?.slice(1);
        }
    };

    return (
        <Badge variant={getRoleColor(role)} className="text-xs">
            {formatRole(role)}
        </Badge>
    );
});

RoleBadge.displayName = 'RoleBadge';

const UserTable = memo(({
    users,
    loading,
    pagination,
    onPageChange,
    onEditUser,
    onDeleteUser,
    onViewUser
}) => {
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    const sortedUsers = useMemo(() => {
        if (!users) return [];

        return [...users].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle nested fields
            if (sortField === 'department') {
                aValue = a.unit || a.department;
                bValue = b.unit || b.department;
            }

            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const formatWorkingPeriod = (workingPeriod) => {
        if (!workingPeriod) return 'N/A';
        const { years, months, days } = workingPeriod;
        return `${years}y ${months}m ${days}d`;
    };

    if (loading) {
        return (
            <div className="glass glass-card p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted/20 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass glass-card overflow-hidden"
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Users ({pagination.totalUsers})</h3>
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('name')}
                                >
                                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('email')}
                                >
                                    Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('department')}
                                >
                                    Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Working Period</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {sortedUsers.map((user, index) => (
                                    <TableRow
                                        key={user._id || user.id}
                                        className="hover:bg-muted/30"
                                    >
                                        <TableCell className="font-medium">
                                            <div>
                                                <div className="font-semibold">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {user.username && `@${user.username}`}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{user.email}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="text-sm">{user.unit || user.department}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {user.jobPosition}
                                                </div>
                                                {/* Show subordinates count for managers */}
                                                {user.subordinates && user.subordinates.length > 0 && (
                                                    <div className="text-xs text-blue-600 font-medium">
                                                        Manages {user.subordinates.length} staff
                                                    </div>
                                                )}
                                                {/* Show classes for teachers */}
                                                {user.classes && user.classes.length > 0 && (
                                                    <div className="text-xs text-green-600 font-medium">
                                                        {user.classes.length} class{user.classes.length > 1 ? 'es' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RoleBadge role={user.role} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={user.isActive}
                                                employmentStatus={user.employmentStatus}
                                            />
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatWorkingPeriod(user.workingPeriod)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onViewUser(user)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onEditUser(user)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteUser(user._id || user.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {sortedUsers.length} of {pagination.totalUsers} users
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

UserTable.displayName = 'UserTable';

export default UserTable;