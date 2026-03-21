import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import LabLayout from '../components/Layouts/LabLayout';

interface Product {
    id: string;
    name: string;
    unit: string;
    description: string | null;
    lowStockThreshold: number;
    isActive: boolean;
    createdAt: string;
}

const ProductsPage = () => {
    const { user } = useSelector((state: IRootState) => state.auth);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        unit: '',
        description: '',
        lowStockThreshold: 0,
    });
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        const response = await api.get<Product[]>('/products');
        if (response.data) {
            setProducts(response.data);
        }
        setIsLoading(false);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            unit: '',
            description: '',
            lowStockThreshold: 0,
        });
        setError(null);
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            unit: product.unit,
            description: product.description || '',
            lowStockThreshold: product.lowStockThreshold,
        });
        setError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            unit: '',
            description: '',
            lowStockThreshold: 0,
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) {
            setError('Product name is required');
            return;
        }

        if (!formData.unit.trim()) {
            setError('Unit is required');
            return;
        }

        if (editingProduct) {
            const response = await api.put<Product>(`/products/${editingProduct.id}`, formData);
            if (response.error) {
                setError(response.error);
            } else {
                fetchProducts();
                closeModal();
            }
        } else {
            const response = await api.post<Product>('/products', formData);
            if (response.error) {
                setError(response.error);
            } else {
                fetchProducts();
                closeModal();
            }
        }
    };

    const toggleActive = async (product: Product) => {
        const response = await api.put<Product>(`/products/${product.id}`, {
            isActive: !product.isActive,
        });
        if (!response.error) {
            fetchProducts();
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
                    <p className="mt-2 text-gray-500">Only Super Admin can manage products</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl">Products Management</h1>
                    <p className="mt-1 text-gray-500">Create and manage product catalog</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn btn-primary mt-4 sm:mt-0"
                >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

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
                                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Unit</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Low Stock Threshold</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-gray-500">{product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{product.unit}</td>
                                        <td className="px-4 py-3 text-gray-500">{product.lowStockThreshold}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleActive(product)}
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${product.isActive
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}
                                            >
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => openEditModal(product)}
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

                {!isLoading && filteredProducts.length === 0 && (
                    <p className="py-8 text-center text-gray-500">No products found</p>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-bold">
                            {editingProduct ? 'Edit Product' : 'Create Product'}
                        </h3>

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium">Name *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1 w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Unit *</label>
                                <input
                                    type="text"
                                    className="form-input mt-1 w-full"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="e.g., pcs, box, bottle"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Description</label>
                                <textarea
                                    className="form-textarea mt-1 w-full"
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    className="form-input mt-1 w-full"
                                    value={formData.lowStockThreshold}
                                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                                    min={0}
                                />
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
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

(ProductsPage as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(ProductsPage, { requiredRoles: ['SUPERADMIN'] });
