import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const UserFilters = memo(({ filters, onFiltersChange, onAddUser }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFilterChange = (key, value) => {
        // Convert "all_*" values back to empty string for API
        const processedValue = value?.startsWith('all_') ? '' : value;
        onFiltersChange({
            ...filters,
            [key]: processedValue,
            page: 1 // Reset to first page when filtering
        });
    };

    const clearFilter = (key) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange({
            ...newFilters,
            page: 1
        });
    };

    const clearAllFilters = () => {
        onFiltersChange({
            page: 1,
            limit: 20,
            isActive: true
        });
    };

    const activeFiltersCount = Object.keys(filters).filter(key =>
        key !== 'page' && key !== 'limit' && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined
    ).length;

    const formatFilterLabel = (key, value) => {
        switch (key) {
            case 'role':
                return `Role: ${value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}`;
            case 'department':
                return `Department: ${value}`;
            case 'unit':
                return `Unit: ${value}`;
            case 'jobLevel':
                return `Job Level: ${value}`;
            case 'employmentStatus':
                return `Status: ${value}`;
            case 'search':
                return `Search: "${value}"`;
            default:
                return `${key}: ${value}`;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass glass-card p-4 md:p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {activeFiltersCount} active
                        </Badge>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddUser}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title="Export functionality coming soon"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search by name, email, or position..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-xs h-6 px-2"
                        >
                            Clear All
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(filters).map(([key, value]) => {
                            if (key === 'page' || key === 'limit' || !value || value === '') return null;
                            return (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className="text-xs cursor-pointer hover:bg-destructive/20"
                                    onClick={() => clearFilter(key)}
                                >
                                    {formatFilterLabel(key, value)}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Expanded Filters */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/50"
                >
                    {/* Role Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Role</label>
                        <Select
                            value={filters.role || ''}
                            onValueChange={(value) => handleFilterChange('role', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_roles">All Roles</SelectItem>
                                <SelectItem value="directorate">Directorate</SelectItem>
                                <SelectItem value="head_unit">Head Unit</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="se_teacher">SE Teacher</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="support_staff">Support Staff</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Department Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Department</label>
                        <Select
                            value={filters.department || ''}
                            onValueChange={(value) => handleFilterChange('department', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_departments">All Departments</SelectItem>
                                <SelectItem value="Directorate">Directorate</SelectItem>
                                <SelectItem value="Elementary">Elementary</SelectItem>
                                <SelectItem value="Junior High">Junior High</SelectItem>
                                <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                <SelectItem value="Operational">Operational</SelectItem>
                                <SelectItem value="MAD Lab">MAD Lab</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Pelangi">Pelangi</SelectItem>
                                <SelectItem value="CARE">CARE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Unit Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Unit</label>
                        <Select
                            value={filters.unit || ''}
                            onValueChange={(value) => handleFilterChange('unit', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Units" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_units">All Units</SelectItem>
                                <SelectItem value="Directorate">Directorate</SelectItem>
                                <SelectItem value="Elementary">Elementary</SelectItem>
                                <SelectItem value="Junior High">Junior High</SelectItem>
                                <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                <SelectItem value="Operational">Operational</SelectItem>
                                <SelectItem value="MAD Lab">MAD Lab</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Pelangi">Pelangi</SelectItem>
                                <SelectItem value="CARE">CARE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Job Level Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Job Level</label>
                        <Select
                            value={filters.jobLevel || ''}
                            onValueChange={(value) => handleFilterChange('jobLevel', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Job Levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_job_levels">All Job Levels</SelectItem>
                                <SelectItem value="Director">Director</SelectItem>
                                <SelectItem value="Head Unit">Head Unit</SelectItem>
                                <SelectItem value="Staff">Staff</SelectItem>
                                <SelectItem value="Teacher">Teacher</SelectItem>
                                <SelectItem value="SE Teacher">SE Teacher</SelectItem>
                                <SelectItem value="Support Staff">Support Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Employment Status Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Employment Status</label>
                        <Select
                            value={filters.employmentStatus || ''}
                            onValueChange={(value) => handleFilterChange('employmentStatus', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_status">All Status</SelectItem>
                                <SelectItem value="Permanent">Permanent</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Probation">Probation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Status Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Account Status</label>
                        <Select
                            value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
                            onValueChange={(value) => handleFilterChange('isActive', value === 'true')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_accounts">All Accounts</SelectItem>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
});

UserFilters.displayName = 'UserFilters';

export default UserFilters;
