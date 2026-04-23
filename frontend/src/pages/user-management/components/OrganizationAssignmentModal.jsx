import React, { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, User, GraduationCap, Building, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import {
    getOrganizationMembers,
    getUserOrganizations,
    assignUserToOrganization,
    createOrganization
} from "../../../store/slices/userSlice";

const OrganizationAssignmentModal = memo(({ user, onClose }) => {
    const dispatch = useDispatch();
    const { organizationMembers, userOrganizations, loading } = useSelector(state => state.users);

    const [activeTab, setActiveTab] = useState('assignments');
    const [selectedOrganization, setSelectedOrganization] = useState('');
    const [newOrganization, setNewOrganization] = useState({
        name: '',
        type: 'class',
        parentId: '',
        metadata: {
            grade: '',
            subject: '',
            capacity: 30
        }
    });

    useEffect(() => {
        if (user) {
            dispatch(getUserOrganizations(user._id || user.id));
        }
    }, [dispatch, user]);

    const handleAssignToOrganization = async () => {
        if (!selectedOrganization || !user) return;

        try {
            await dispatch(assignUserToOrganization({
                userId: user._id || user.id,
                organizationId: selectedOrganization,
                role: user.role === 'teacher' ? 'teacher' : 'student'
            })).unwrap();

            // Refresh data
            dispatch(getUserOrganizations(user._id || user.id));
            setSelectedOrganization('');
        } catch (error) {
            console.error('Failed to assign user:', error);
        }
    };

    const handleCreateOrganization = async () => {
        try {
            await dispatch(createOrganization(newOrganization)).unwrap();
            setNewOrganization({
                name: '',
                type: 'class',
                parentId: '',
                metadata: { grade: '', subject: '', capacity: 30 }
            });
        } catch (error) {
            console.error('Failed to create organization:', error);
        }
    };

    const handleViewMembers = (organizationId) => {
        dispatch(getOrganizationMembers(organizationId));
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        Organization Management - {user?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg">
                        {[
                            { id: 'assignments', label: 'Current Assignments', icon: '📋' },
                            { id: 'assign', label: 'Assign to Organization', icon: '➕' },
                            { id: 'create', label: 'Create Organization', icon: '🏗️' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Current Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-semibold">Current Organization Assignments</h3>

                            {userOrganizations?.organizations?.length > 0 ? (
                                <div className="grid gap-4">
                                    {userOrganizations.organizations.map((org) => (
                                        <div key={org.id} className="p-4 border rounded-lg bg-muted/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center">
                                                    {org.type === 'class' && <GraduationCap className="w-4 h-4 mr-2 text-blue-500" />}
                                                    {org.type === 'department' && <Building className="w-4 h-4 mr-2 text-green-500" />}
                                                    {org.type === 'team' && <Users className="w-4 h-4 mr-2 text-purple-500" />}
                                                    <span className="font-medium">{org.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-muted-foreground capitalize">
                                                        {org.role}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewMembers(org.id)}
                                                    >
                                                        <Users className="w-4 h-4 mr-1" />
                                                        View Members
                                                    </Button>
                                                </div>
                                            </div>

                                            {org.metadata && (
                                                <div className="text-sm text-muted-foreground">
                                                    {org.metadata.grade && <span>Grade: {org.metadata.grade} | </span>}
                                                    {org.metadata.subject && <span>Subject: {org.metadata.subject} | </span>}
                                                    {org.metadata.capacity && <span>Capacity: {org.metadata.capacity}</span>}
                                                </div>
                                            )}

                                            {org.isHead && (
                                                <div className="mt-2 text-sm text-green-600 font-medium">
                                                    <Check className="w-4 h-4 inline mr-1" />
                                                    Organization Head
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No organization assignments found</p>
                                </div>
                            )}

                            {/* Organization Members Display */}
                            {organizationMembers && (
                                <div className="mt-6 p-4 border rounded-lg bg-blue/5">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Users className="w-4 h-4 mr-2" />
                                        {organizationMembers.organization?.name} Members
                                    </h4>
                                    <div className="grid gap-2">
                                        {organizationMembers.members?.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-2 bg-background/50 rounded">
                                                <div>
                                                    <span className="font-medium">{member.name}</span>
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        ({member.role})
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {member.department}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Assign to Organization Tab */}
                    {activeTab === 'assign' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-semibold">Assign to Organization</h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="organization">Select Organization</Label>
                                    <Select
                                        value={selectedOrganization}
                                        onValueChange={setSelectedOrganization}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose an organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* This would be populated with available organizations */}
                                            <SelectItem value="org1">Grade 10A - Mathematics</SelectItem>
                                            <SelectItem value="org2">Grade 10B - Science</SelectItem>
                                            <SelectItem value="org3">Junior High - English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={handleAssignToOrganization}
                                    disabled={!selectedOrganization || loading}
                                    className="w-full"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Assign User
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Create Organization Tab */}
                    {activeTab === 'create' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <h3 className="text-lg font-semibold">Create New Organization</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <Input
                                        id="orgName"
                                        value={newOrganization.name}
                                        onChange={(e) => setNewOrganization(prev => ({
                                            ...prev,
                                            name: e.target.value
                                        }))}
                                        placeholder="e.g., Grade 10A Mathematics"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="orgType">Type</Label>
                                    <Select
                                        value={newOrganization.type}
                                        onValueChange={(value) => setNewOrganization(prev => ({
                                            ...prev,
                                            type: value
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="class">Class</SelectItem>
                                            <SelectItem value="department">Department</SelectItem>
                                            <SelectItem value="team">Team</SelectItem>
                                            <SelectItem value="unit">Unit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {newOrganization.type === 'class' && (
                                    <>
                                        <div>
                                            <Label htmlFor="grade">Grade</Label>
                                            <Input
                                                id="grade"
                                                value={newOrganization.metadata.grade}
                                                onChange={(e) => setNewOrganization(prev => ({
                                                    ...prev,
                                                    metadata: {
                                                        ...prev.metadata,
                                                        grade: e.target.value
                                                    }
                                                }))}
                                                placeholder="e.g., 10A"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                value={newOrganization.metadata.subject}
                                                onChange={(e) => setNewOrganization(prev => ({
                                                    ...prev,
                                                    metadata: {
                                                        ...prev.metadata,
                                                        subject: e.target.value
                                                    }
                                                }))}
                                                placeholder="e.g., Mathematics"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <Button
                                onClick={handleCreateOrganization}
                                disabled={!newOrganization.name || loading}
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Organization
                            </Button>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
});

OrganizationAssignmentModal.displayName = 'OrganizationAssignmentModal';

export default OrganizationAssignmentModal;