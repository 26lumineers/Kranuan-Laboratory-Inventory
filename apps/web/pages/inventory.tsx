import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import Link from 'next/link';
import LabLayout from '../components/Layouts/LabLayout';

interface Product {
    id: string;
    name: string;
    unit: string;
    description: string | null;
    lowStockThreshold: number;
    isActive: boolean;
}

interface InventoryStock {
    productId: string;
    quantity: number;
    updatedAt: string;
    product: Product;
}

const InventoryPage = () => {
    const { user } = useSelector((state: IRootState) => state.auth);
    const [inventory, setInventory] = useState<InventoryStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'restock' | 'adjust'>('restock');
    const [selectedItem, setSelectedItem] = useState<InventoryStock | null>(null);
    const [quantity, setQuantity] = useState(0);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setIsLoading(true);
        const response = await api.get<InventoryStock[]>('/inventory');
        if (response.data) {
            setInventory(response.data);
        }
        setIsLoading(false);
    };

    const filteredInventory = inventory.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (type: 'restock' | 'adjust', item: InventoryStock) => {
        setModalType(type);
        setSelectedItem(item);
        setQuantity(type === 'restock' ? 0 : item.quantity);
        setReason('');
        setError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setQuantity(0);
        setReason('');
        setError(null);
    };

    const handleSubmit = async () => {
        if (!selectedItem || !user) return;

        setError(null);

        if (modalType === 'restock' && quantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }

        if (modalType === 'adjust' && quantity < 0) {
            setError('Quantity cannot be negative');
            return;
        }

        if (modalType === 'adjust' && !reason.trim()) {
            setError('Reason is required for adjustments');
            return;
        }

        const endpoint = modalType === 'restock' ? '/inventory/restock' : '/inventory/adjust';
        const payload = modalType === 'restock'
            ? { productId: selectedItem.productId, quantity, userId: user.id }
            : { productId: selectedItem.productId, quantity, reason, userId: user.id };

        const response = await api.post(endpoint, payload);

        if (response.error) {
            setError(response.error);
        } else {
            setSuccess(`${modalType === 'restock' ? 'Restock' : 'Adjustment'} successful!`);
            closeModal();
            fetchInventory();
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
                    <p className="mt-2 text-gray-500">You don't have permission to access this page</p>
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
                    <h1 className="mt-2 text-2xl font-bold md:text-3xl">Inventory Management</h1>
                    <p className="mt-1 text-gray-500">Manage stock levels and inventory adjustments</p>
                </div>
            </div>

            {success && (
                <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {success}
                </div>
            )}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search products..."
                    className="form-input w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                    <th className="px-4 py-3 text-left text-sm font-medium">Product Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Unit</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Current Stock</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Low Stock Threshold</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredInventory.map((item) => (
                                    <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{item.product.name}</p>
                                                {item.product.description && (
                                                    <p className="text-xs text-gray-500">{item.product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{item.product.unit}</td>
                                        <td className="px-4 py-3">
                                            <span className={`font-bold ${item.quantity <= item.product.lowStockThreshold
                                                ? 'text-red-600'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{item.product.lowStockThreshold}</td>
                                        <td className="px-4 py-3">
                                            {item.quantity <= item.product.lowStockThreshold ? (
                                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openModal('restock', item)}
                                                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    Restock
                                                </button>
                                                <button
                                                    onClick={() => openModal('adjust', item)}
                                                    className="btn btn-outline-primary btn-sm"
                                                >
                                                    Adjust
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredInventory.length === 0 && (
                    <p className="py-8 text-center text-gray-500">No inventory items found</p>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-bold">
                            {modalType === 'restock' ? 'Restock Item' : 'Adjust Stock'}
                        </h3>

                        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="font-medium">{selectedItem.product.name}</p>
                            <p className="text-sm text-gray-500">
                                Current stock: {selectedItem.quantity} {selectedItem.product.unit}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium">
                                {modalType === 'restock' ? 'Quantity to Add' : 'New Quantity'}
                            </label>
                            <input
                                type="number"
                                className="form-input mt-1 w-full"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>

                        {modalType === 'adjust' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium">Reason</label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={2}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason for adjustment..."
                                />
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="btn btn-outline-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn btn-primary"
                            >
                                {modalType === 'restock' ? 'Restock' : 'Adjust'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

(InventoryPage as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(InventoryPage, { requiredRoles: ['ADMIN', 'SUPERADMIN'] });
