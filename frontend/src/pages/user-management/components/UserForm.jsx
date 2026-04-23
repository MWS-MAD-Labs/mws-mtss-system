import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User, Mail, Briefcase, Calendar, GraduationCap } from "lucide-react";
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

const UserForm = memo(({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        role: 'staff',
        department: '',
        unit: '',
        jobLevel: '',
        jobPosition: '',
        employmentStatus: 'Permanent',
        joinDate: '',
        endDate: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Initialize form data when editing
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                username: user.username || '',
                role: user.role || 'staff',
                department: user.department || '',
                unit: user.unit || '',
                jobLevel: user.jobLevel || '',
                jobPosition: user.jobPosition || '',
                employmentStatus: user.employmentStatus || 'Permanent',
                joinDate: user.joinDate ? new Date(user.joinDate).toISOString().split('T')[0] : '',
                endDate: user.endDate ? new Date(user.endDate).toISOString().split('T')[0] : '',
                password: '',
                confirmPassword: ''
            });
        } else {
            // Reset form for new user
            setFormData({
                name: '',
                email: '',
                username: '',
                role: 'staff',
                department: '',
                unit: '',
                jobLevel: '',
                jobPosition: '',
                employmentStatus: 'Permanent',
                joinDate: '',
                endDate: '',
                password: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!user && !formData.password) newErrors.password = 'Password is required';
        if (!user && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Password validation
        if (!user && formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            // Prepare data for submission
            const submitData = {
                ...formData,
                // Remove password fields for updates
                ...(user ? {} : { password: formData.password }),
                password: undefined,
                confirmPassword: undefined,
                // Convert empty strings to null for optional fields
                department: formData.department === 'not_specified' ? null : formData.department || null,
                unit: formData.unit === 'not_specified' ? null : formData.unit || null,
                jobLevel: formData.jobLevel === 'not_specified' ? null : formData.jobLevel || null,
                jobPosition: formData.jobPosition || null,
                joinDate: formData.joinDate || null,
                endDate: formData.endDate || null,
                // Ensure isActive is set for new users
                isActive: true
            };

            if (user) {
                await onSubmit(user._id || user.id, submitData);
            } else {
                await onSubmit(submitData);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        {user ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                </DialogHeader>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter full name"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email Address *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="Enter email address"
                                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive mt-1">{errors.email}</p>
                            )}
                        </div>

                        {!user && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Enter password"
                                        className={errors.password ? 'border-destructive' : ''}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-destructive mt-1">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder="Confirm password"
                                        className={errors.confirmPassword ? 'border-destructive' : ''}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Role & Organization */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Role & Organization
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleInputChange('role', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="support_staff">Support Staff</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="se_teacher">SE Teacher</SelectItem>
                                        <SelectItem value="head_unit">Head Unit</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="directorate">Directorate</SelectItem>
                                        <SelectItem value="superadmin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="jobLevel">Job Level</Label>
                                <Select
                                    value={formData.jobLevel}
                                    onValueChange={(value) => handleInputChange('jobLevel', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select job level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_specified">Not specified</SelectItem>
                                        <SelectItem value="Director">Director</SelectItem>
                                        <SelectItem value="Head Unit">Head Unit</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                        <SelectItem value="Teacher">Teacher</SelectItem>
                                        <SelectItem value="SE Teacher">SE Teacher</SelectItem>
                                        <SelectItem value="Support Staff">Support Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(value) => handleInputChange('department', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_specified">Not specified</SelectItem>
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

                            <div>
                                <Label htmlFor="unit">Unit</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(value) => handleInputChange('unit', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_specified">Not specified</SelectItem>
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
                        </div>

                        <div>
                            <Label htmlFor="jobPosition">Job Position</Label>
                            <Input
                                id="jobPosition"
                                value={formData.jobPosition}
                                onChange={(e) => handleInputChange('jobPosition', e.target.value)}
                                placeholder="Enter job position"
                            />
                        </div>

                        {/* Teacher Assignment Section */}
                        {(formData.role === 'teacher' || formData.role === 'se_teacher') && (
                            <div className="space-y-4 p-4 bg-blue/5 rounded-lg border border-blue/20">
                                <h4 className="font-medium text-blue-700 flex items-center">
                                    <GraduationCap className="w-4 h-4 mr-2" />
                                    Teaching Assignments
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Teaching assignments can be managed after user creation through the user details modal.
                                </p>
                            </div>
                        )}

                        {/* Head Unit Assignment Section */}
                        {formData.role === 'head_unit' && (
                            <div className="space-y-4 p-4 bg-purple/5 rounded-lg border border-purple/20">
                                <h4 className="font-medium text-purple-700 flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    Department Leadership
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    As Head Unit, this user will oversee the selected department/unit and its members.
                                </p>
                                {formData.department && (
                                    <div className="text-sm">
                                        <span className="font-medium">Department:</span> {formData.department}
                                        {formData.unit && formData.unit !== formData.department && (
                                            <span> | <span className="font-medium">Unit:</span> {formData.unit}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Employment Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Employment Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="employmentStatus">Employment Status</Label>
                                <Select
                                    value={formData.employmentStatus}
                                    onValueChange={(value) => handleInputChange('employmentStatus', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Permanent">Permanent</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Probation">Probation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="joinDate">Join Date</Label>
                                <Input
                                    id="joinDate"
                                    type="date"
                                    value={formData.joinDate}
                                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="min-w-24"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Saving...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {user ? 'Update User' : 'Create User'}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.form>
            </DialogContent>
        </Dialog>
    );
});

UserForm.displayName = 'UserForm';

export default UserForm;
