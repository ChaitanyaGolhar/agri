import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../utils/api';
import { User, Building, Phone, Settings, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();

    // Effect to reset form when user data changes or editing is cancelled
    useEffect(() => {
        if (user) {
            reset({
                businessName: user.businessName || '',
                email: user.email || '',
                contactNumber: user.contactNumber || '',
                gstNumber: user.gstNumber || '',
                businessAddress: {
                    street: user.businessAddress?.street || '',
                    city: user.businessAddress?.city || '',
                    state: user.businessAddress?.state || '',
                    pincode: user.businessAddress?.pincode || '',
                    country: user.businessAddress?.country || 'India',
                },
                preferences: {
                    currency: user.preferences?.currency || 'INR',
                    language: user.preferences?.language || 'en',
                    lowStockThreshold: user.preferences?.lowStockThreshold || 10,
                    theme: user.preferences?.theme || 'light',
                },
            });
        }
    }, [user, isEditing, reset]);

    const updateProfileMutation = useMutation(
        (profileData) => api.put('/auth/profile', profileData),
        {
            onSuccess: (response) => {
                updateUser(response.data.user);
                queryClient.invalidateQueries('user');
                setIsEditing(false);
                toast.success('Profile updated successfully');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update profile');
            },
        }
    );

    const onSubmit = (data) => {
        updateProfileMutation.mutate(data);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your business profile and preferences
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="btn btn-outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <button onClick={handleCancel} className="btn btn-outline">
                                Cancel
                            </button>
                            <button onClick={handleSubmit(onSubmit)} disabled={updateProfileMutation.isLoading} className="btn btn-primary">
                                {updateProfileMutation.isLoading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Profile Overview */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <div className="card-header"><h3 className="card-title">Profile Overview</h3></div>
                        <div className="card-content">
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
                                    <User className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">{user.businessName}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Member since {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mt-6">
                        <div className="card-header"><h3 className="card-title">Quick Stats</h3></div>
                        <div className="card-content space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{user.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Last Login</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Business Information */}
                        <div className="card">
                            <div className="card-header"><h3 className="card-title flex items-center"><Building className="h-5 w-5 mr-2" />Business Information</h3></div>
                            <div className="card-content space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="label">Business Name</label>
                                        <input {...register('businessName', { required: 'Business name is required' })} disabled={!isEditing} className="input w-full" />
                                        {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="label">GST Number</label>
                                        <input {...register('gstNumber')} disabled={!isEditing} className="input w-full" placeholder="Optional"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="card">
                            <div className="card-header"><h3 className="card-title flex items-center"><Phone className="h-5 w-5 mr-2" />Contact Information</h3></div>
                            <div className="card-content space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="label">Email Address</label>
                                        <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }})} type="email" disabled={!isEditing} className="input w-full" />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                                    </div>
                                    <div>
                                        <label className="label">Contact Number</label>
                                        <input {...register('contactNumber', { required: 'Contact number is required' })} type="tel" disabled={!isEditing} className="input w-full" />
                                        {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Address */}
                        <div className="card">
                            <div className="card-header"><h3 className="card-title flex items-center"><Building className="h-5 w-5 mr-2" />Business Address</h3></div>
                            <div className="card-content space-y-4">
                                <div>
                                    <label className="label">Street Address</label>
                                    <input {...register('businessAddress.street')} disabled={!isEditing} className="input w-full" />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="label">City</label>
                                        <input {...register('businessAddress.city')} disabled={!isEditing} className="input w-full" />
                                    </div>
                                    <div>
                                        <label className="label">State</label>
                                        <input {...register('businessAddress.state')} disabled={!isEditing} className="input w-full" />
                                    </div>
                                    <div>
                                        <label className="label">Pincode</label>
                                        <input {...register('businessAddress.pincode')} disabled={!isEditing} className="input w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Preferences</h3></div>
                            <div className="card-content space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="label">Currency</label>
                                        <select {...register('preferences.currency')} disabled={!isEditing} className="input w-full">
                                            <option value="INR">Indian Rupee (INR)</option>
                                            <option value="USD">US Dollar (USD)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Language</label>
                                        <select {...register('preferences.language')} disabled={!isEditing} className="input w-full">
                                            <option value="en">English</option>
                                            <option value="mr">Marathi</option>
                                            <option value="hi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="label">Low Stock Threshold</label>
                                        <input {...register('preferences.lowStockThreshold', { valueAsNumber: true, min: 1 })} type="number" disabled={!isEditing} className="input w-full" />
                                    </div>
                                    <div>
                                        <label className="label">Theme</label>
                                        <select {...register('preferences.theme')} disabled={!isEditing} className="input w-full">
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
