import { useEffect, useState, ReactElement, useMemo, useRef } from 'react';
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
    category: string;
    description: string | null;
}

interface OrderItem {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
}

interface Room {
    id: string;
    name: string;
    description: string | null;
}

// Category display names in Thai
const CATEGORY_LABELS: Record<string, string> = {
    'CHEMICAL_CLINIC': '1️⃣ เคมีคลินิก',
    'IMMUNOLOGY': '2️⃣ ภูมิคุ้มกันวิทยา',
    'HEMATOLOGY': '3️⃣ โลหิตวิทยา',
    'MICROSCOPIC': '4️⃣ จุลทรรศนศาสตร์',
    'BLOOD_BANK': '5️⃣ ธนาคารเลือด',
    'MICRO_BIOLOGY': '6️⃣ จุลชีววิทยา',
    'SUB_STOCKS': '7️⃣ คลังย่อยกลุ่มงาน',
};

// Category order
const CATEGORY_ORDER = [
    'CHEMICAL_CLINIC',
    'IMMUNOLOGY',
    'HEMATOLOGY',
    'MICROSCOPIC',
    'BLOOD_BANK',
    'MICRO_BIOLOGY',
    'SUB_STOCKS',
];

const OrderPage = () => {
    const router = useRouter();
    const { user } = useSelector((state: IRootState) => state.auth);
    const [products, setProducts] = useState<Product[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const hasFetched = useRef(false);

    useEffect(() => {
        // Prevent double fetch in React StrictMode
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchData = async () => {
            setIsLoading(true);

            // Fetch rooms
            const roomsResponse = await api.get<Room[]>('/rooms');
            if (roomsResponse.data) {
                setRooms(roomsResponse.data);
                // Default to user's assigned room if they have one
                if (user?.roomId) {
                    setSelectedRoomId(user.roomId);
                } else if (roomsResponse.data.length > 0) {
                    setSelectedRoomId(roomsResponse.data[0].id);
                }
            }

            // Fetch available products (no stock quantity shown)
            const productsResponse = await api.get<Product[]>('/products/available');
            if (productsResponse.error) {
                console.error('Failed to fetch products:', productsResponse.error);
                setError(productsResponse.error);
            } else if (productsResponse.data) {
                setProducts(productsResponse.data);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [user?.roomId]);

    // Group products by category
    const groupedProducts = useMemo(() => {
        const filtered = searchTerm
            ? products.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : products;

        const grouped: Record<string, Product[]> = {};
        filtered.forEach(product => {
            if (!grouped[product.category]) {
                grouped[product.category] = [];
            }
            grouped[product.category].push(product);
        });

        return grouped;
    }, [products, searchTerm]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const addToOrder = (item: Product) => {
        const existing = orderItems.find(o => o.productId === item.id);
        if (!existing) {
            setOrderItems([...orderItems, {
                productId: item.id,
                productName: item.name,
                unit: item.unit,
                quantity: 1,
            }]);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setOrderItems(orderItems.map(item => {
            if (item.productId === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const setQuantity = (productId: string, value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 1) {
            return; // Don't update if invalid or less than 1
        }
        setOrderItems(orderItems.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity: numValue };
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

        if (!selectedRoomId) {
            setError('Please select a room for this order');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const response = await api.post('/transactions', {
            roomId: selectedRoomId,
            note: note || undefined,
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
            // Only redirect admin/superadmin to transactions page
            // GENERAL users stay on order page to place more orders
            if (user?.role !== 'GENERAL') {
                setTimeout(() => {
                    router.push('/transactions');
                }, 2000);
            }
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
                            <div className="space-y-4">
                                {CATEGORY_ORDER.map(category => {
                                    const categoryProducts = groupedProducts[category];
                                    if (!categoryProducts || categoryProducts.length === 0) return null;

                                    const isExpanded = expandedCategories.has(category);
                                    const productCount = categoryProducts.length;

                                    return (
                                        <div key={category} className="rounded-lg border border-gray-200 dark:border-gray-700">
                                            {/* Category Header */}
                                            <button
                                                onClick={() => toggleCategory(category)}
                                                className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{CATEGORY_LABELS[category] || category}</span>
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                        {productCount}
                                                    </span>
                                                </div>
                                                <svg
                                                    className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Category Products */}
                                            {isExpanded && (
                                                <div className="grid grid-cols-1 gap-3 p-3 pt-0 sm:grid-cols-2">
                                                    {categoryProducts.map((item) => {
                                                        const inOrder = orderItems.find(o => o.productId === item.id);
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`rounded-lg border p-3 transition ${inOrder
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-gray-200 hover:border-primary/50 dark:border-gray-600'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="truncate font-medium">{item.name}</h3>
                                                                        <p className="text-sm text-gray-500">
                                                                            {item.unit}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => addToOrder(item)}
                                                                        className="btn btn-primary btn-sm ml-2 flex-shrink-0"
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
                                        </div>
                                    );
                                })}

                                {Object.keys(groupedProducts).length === 0 && (
                                    <p className="py-8 text-center text-gray-500">No items found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <h2 className="mb-4 text-lg font-bold">Your Order</h2>

                        {/* Room Selector - user's room is pre-selected but can choose others */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Select Room</label>
                            <select
                                className="form-select mt-1 w-full"
                                value={selectedRoomId}
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                disabled={rooms.length === 0}
                            >
                                {rooms.length === 0 ? (
                                    <option value="">No rooms available</option>
                                ) : (
                                    rooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.name}
                                            {user?.roomId === room.id ? ' (Your room)' : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

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
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => updateQuantity(item.productId, -1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-l-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                                                disabled={item.quantity <= 1}
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => setQuantity(item.productId, e.target.value)}
                                                className="h-8 w-12 border-y border-gray-200 bg-white text-center font-bold dark:border-gray-600 dark:bg-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-r-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
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
