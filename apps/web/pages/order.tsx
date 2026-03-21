import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import { useRouter } from 'next/router';
import LabLayout from '../components/Layouts/LabLayout';

interface Product {
    id: string;
    name: string;
    unit: string;
    description: string | null;
}

interface InventoryStock {
    productId: string;
    quantity: number;
    product: Product;
}

interface OrderItem {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
    maxQuantity: number;
}

const OrderPage = () => {
    const router = useRouter();
    const { user } = useSelector((state: IRootState) => state.auth);
    const [inventory, setInventory] = useState<InventoryStock[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchInventory = async () => {
            setIsLoading(true);
            const response = await api.get<InventoryStock[]>('/inventory');
            if (response.data) {
                setInventory(response.data.filter(item => item.quantity > 0));
            }
            setIsLoading(false);
        };

        fetchInventory();
    }, []);

    const filteredInventory = inventory.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToOrder = (item: InventoryStock) => {
        const existing = orderItems.find(o => o.productId === item.productId);
        if (existing) {
            if (existing.quantity < existing.maxQuantity) {
                setOrderItems(orderItems.map(o =>
                    o.productId === item.productId
                        ? { ...o, quantity: o.quantity + 1 }
                        : o
                ));
            }
        } else {
            setOrderItems([...orderItems, {
                productId: item.productId,
                productName: item.product.name,
                unit: item.product.unit,
                quantity: 1,
                maxQuantity: item.quantity,
            }]);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setOrderItems(orderItems.map(item => {
            if (item.productId === productId) {
                const newQuantity = Math.max(1, Math.min(item.maxQuantity, item.quantity + delta));
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromOrder = (productId: string) => {
        setOrderItems(orderItems.filter(item => item.productId !== productId));
    };

    const handleSubmit = async () => {
        if (orderItems.length === 0) {
            setError('Please add at least one item to your order');
            return;
        }

        if (!user?.roomId) {
            setError('You must be assigned to a room to place orders');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const response = await api.post('/transactions', {
            userId: user.id,
            roomId: user.roomId,
            note: note || null,
            items: orderItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        });

        setIsSubmitting(false);

        if (response.error) {
            setError(response.error);
        } else {
            setSuccess(true);
            setOrderItems([]);
            setNote('');
            setTimeout(() => {
                router.push('/transactions');
            }, 2000);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-green-600">Order Submitted!</h2>
                    <p className="mt-2 text-gray-500">Redirecting to transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold md:text-3xl">Order Items</h1>
                <p className="mt-1 text-gray-500">Select items from inventory to request</p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Available Items */}
                <div className="lg:col-span-2">
                    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="form-input w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {isLoading ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {filteredInventory.map((item) => {
                                    const inOrder = orderItems.find(o => o.productId === item.productId);
                                    return (
                                        <div
                                            key={item.productId}
                                            className={`rounded-lg border p-3 transition ${inOrder
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-primary/50 dark:border-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium">{item.product.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {item.product.unit} • {item.quantity} available
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => addToOrder(item)}
                                                    className="btn btn-primary btn-sm"
                                                    disabled={inOrder !== undefined}
                                                >
                                                    {inOrder ? 'Added' : 'Add'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!isLoading && filteredInventory.length === 0 && (
                            <p className="py-8 text-center text-gray-500">No items found</p>
                        )}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <h2 className="mb-4 text-lg font-bold">Your Order</h2>

                        {orderItems.length === 0 ? (
                            <p className="text-gray-500">No items in your order yet</p>
                        ) : (
                            <div className="space-y-3">
                                {orderItems.map((item) => (
                                    <div key={item.productId} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-xs text-gray-500">{item.unit}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromOrder(item.productId)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, -1)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                </button>
                                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, 1)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600"
                                                    disabled={item.quantity >= item.maxQuantity}
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <span className="text-sm text-gray-500">Max: {item.maxQuantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {orderItems.length > 0 && (
                            <>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium">Note (optional)</label>
                                    <textarea
                                        className="form-textarea mt-1 w-full"
                                        rows={3}
                                        placeholder="Add a note to your order..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="btn btn-primary mt-4 w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : `Submit Order (${orderItems.length} items)`}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

(OrderPage as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(OrderPage);
