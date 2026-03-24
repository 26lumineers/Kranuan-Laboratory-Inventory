import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import { UserRole } from '../store/authSlice';
import Link from 'next/link';
import LabLayout from '../components/Layouts/LabLayout';

interface Room {
    id: string;
    name: string;
    description: string | null;
}

interface User {
    id: string;
    username: string;
    fullName: string;
    nickname: string | null;
    role: UserRole;
    roomId: string | null;
    isActive: boolean;
    createdAt: string;
    room?: Room;
}

const UsersPage = () => {
    const { user } = useSelector((state: IRootState) => state.auth);
    const [users, setUsers] = useState<User[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        nickname: '',
        role: 'GENERAL' as UserRole,
        roomId: '',
    });
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const [usersRes, roomsRes] = await Promise.all([
            api.get<User[]>('/users'),
            api.get<Room[]>('/rooms'),
        ]);
        if (usersRes.data) setUsers(usersRes.data);
        if (roomsRes.data) setRooms(roomsRes.data);
        setIsLoading(false);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            fullName: '',
            nickname: '',
            role: 'GENERAL',
            roomId: '',
        });
        setError(null);
        setShowModal(true);
    };

    const openEditModal = (editUser: User) => {
        setEditingUser(editUser);
        setFormData({
            username: editUser.username,
            password: '',
            fullName: editUser.fullName,
            nickname: editUser.nickname || '',
            role: editUser.role,
            roomId: editUser.roomId || '',
        });
        setError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            fullName: '',
            nickname: '',
            role: 'GENERAL',
            roomId: '',
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.username.trim()) {
            setError('Username is required');
            return;
        }

        if (!formData.fullName.trim()) {
            setError('Full name is required');
            return;
        }

        if (!editingUser && !formData.password.trim()) {
            setError('Password is required for new users');
            return;
        }

        const payload = editingUser
            ? {
                fullName: formData.fullName,
                nickname: formData.nickname || null,
                role: formData.role,
                roomId: formData.roomId || null,
                ...(formData.password ? { password: formData.password } : {}),
            }
            : {
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                nickname: formData.nickname || null,
                role: formData.role,
                roomId: formData.roomId || null,
            };

        const response = editingUser
            ? await api.put<User>(`/users/${editingUser.id}`, payload)
            : await api.post<User>('/users', payload);

        if (response.error) {
            setError(response.error);
        } else {
            fetchData();
            closeModal();
        }
    };

    const toggleActive = async (targetUser: User) => {
        const response = await api.put<User>(`/users/${targetUser.id}`, {
            isActive: !targetUser.isActive,
        });
        if (!response.error) {
            fetchData();
        }
    };

    const getRoleBadgeClass = (role: UserRole) => {
        switch (role) {
            case 'SUPERADMIN':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'ADMIN':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
                    <p className="mt-2 text-gray-500">Only Super Admin can manage users</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold md:text-3xl">Users Management</h1>
                    <p className="mt-1 text-gray-500">Manage user accounts and permissions</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn btn-primary mt-4 sm:mt-0"
                >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add User
                </button>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:space-x-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    className="form-input mb-2 w-full sm:mb-0 sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="form-select w-full sm:w-40"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="GENERAL">General</option>
                </select>
            </div>

            <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                {isLoading ? (
                    <div className="py-8 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Room</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{u.fullName}</p>
                                                <p className="text-xs text-gray-500">@{u.username}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeClass(u.role)}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {u.room?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleActive(u)}
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${u.isActive
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                            >
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="btn btn-outline-primary btn-sm"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredUsers.length === 0 && (
                    <p className="py-8 text-center text-gray-500">No users found</p>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-bold">
                            {editingUser ? 'Edit User' : 'Create User'}
                        </h3>

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium">Username *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1 w-full"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">
                                    Password {editingUser && '(leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    className="form-input mt-1 w-full"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    minLength={6}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1 w-full"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Nickname</label>
                                <input
                                    type="text"
                                    className="form-input mt-1 w-full"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Role *</label>
                                <select
                                    className="form-select mt-1 w-full"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value="GENERAL">General</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPERADMIN">Super Admin</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Assigned Room</label>
                                <select
                                    className="form-select mt-1 w-full"
                                    value={formData.roomId}
                                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                >
                                    <option value="">No Room Assigned</option>
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-outline-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

(UsersPage as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(UsersPage, { requiredRoles: ['SUPERADMIN'] });
