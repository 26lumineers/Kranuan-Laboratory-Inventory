import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IRootState } from '../../../store';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { api } from '../../../utils/api';
import { withAuth } from '../../../components/Auth/withAuth';

interface Product {
    id: string;
    name: string;
    unit: string;
    category: string;
    description: string | null;
}

interface InvoiceItem {
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
}

// Category display names in Thai
const CATEGORY_LABELS: Record<string, string> = {
    'CHEMICAL_CLINIC': '🧪 เคมีคลินิก',
    'IMMUNOLOGY': '🛡️ ภูมิคุ้มกันวิทยา',
    'HEMATOLOGY': '🩸 โลหิตวิทยา',
    'MICROSCOPIC': '🔬 จุลทรรศนศาสตร์',
    'BLOOD_BANK': '🧬 ธนาคารเลือด',
    'MICRO_BIOLOGY': '🦠 จุลชีววิทยา',
    'SUB_STOCKS': '📦 คลังย่อยกลุ่มงาน',
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

const InvoiceAdd = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user } = useSelector((state: IRootState) => state.auth);

    const [products, setProducts] = useState<Product[]>([]);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        dispatch(setPageTitle('Invoice Add'));
    }, [dispatch]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchProducts = async () => {
            setIsLoading(true);
            const response = await api.get<Product[]>('/products/available');
            if (response.data) {
                setProducts(response.data);
            } else if (response.error) {
                setError(response.error);
            }
            setIsLoading(false);
        };

        fetchProducts();
    }, []);

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

    const addToInvoice = (item: Product) => {
        const existing = invoiceItems.find(i => i.productId === item.id);
        if (!existing) {
            setInvoiceItems([...invoiceItems, {
                productId: item.id,
                productName: item.name,
                unit: item.unit,
                quantity: 1,
            }]);
        }
    };

    const updateQuantity = (productId: string, delta: number) => {
        setInvoiceItems(invoiceItems.map(item => {
            if (item.productId === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const setQuantity = (productId: string, value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 1) return;

        setInvoiceItems(invoiceItems.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity: numValue };
            }
            return item;
        }));
    };

    const removeFromInvoice = (productId: string) => {
        setInvoiceItems(invoiceItems.filter(item => item.productId !== productId));
    };

    const handleSubmit = async () => {
        if (invoiceItems.length === 0) {
            setError('Please add at least one item to your invoice');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const response = await api.post('/invoices', {
            description: description || undefined,
            note: note || undefined,
            items: invoiceItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        });

        setIsSubmitting(false);

        if (response.error) {
            setError(response.error);
        } else {
            router.push('/apps/invoice/list');
        }
    };

    // GENERAL users cannot access this page
    if (user?.role === 'GENERAL') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 text-6xl text-gray-300">🔒</div>
                    <h2 className="text-xl font-bold text-gray-600">Access Denied</h2>
                    <p className="mt-2 text-gray-500">GENERAL users cannot access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <Link href="/apps/invoice/list" className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Invoice List
                </Link>
                <h1 className="text-2xl font-bold md:text-3xl">Create Invoice</h1>
                <p className="mt-1 text-gray-500">Create a new invoice for laboratory items</p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Available Products */}
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

                                            {isExpanded && (
                                                <div className="grid grid-cols-1 gap-3 p-3 pt-0 sm:grid-cols-2">
                                                    {categoryProducts.map((item) => {
                                                        const inInvoice = invoiceItems.find(i => i.productId === item.id);
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className={`rounded-lg border p-3 transition ${inInvoice
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-gray-200 hover:border-primary/50 dark:border-gray-600'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="truncate font-medium">{item.name}</h3>
                                                                        <p className="text-sm text-gray-500">{item.unit}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => addToInvoice(item)}
                                                                        className="btn btn-primary btn-sm ml-2 flex-shrink-0"
                                                                        disabled={inInvoice !== undefined}
                                                                    >
                                                                        {inInvoice ? 'Added' : 'Add'}
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
                                    <p className="py-8 text-center text-gray-500">No products found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Invoice Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-4">
                        {/* Invoice Details */}
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <h2 className="mb-4 text-lg font-bold">Invoice Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium">Description</label>
                                    <input
                                        type="text"
                                        className="form-input mt-1 w-full"
                                        placeholder="Enter invoice description..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Note (optional)</label>
                                    <textarea
                                        className="form-textarea mt-1 w-full"
                                        rows={3}
                                        placeholder="Add a note to your invoice..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Selected Items */}
                        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold">Selected Items</h2>
                                {invoiceItems.length > 0 && (
                                    <button
                                        onClick={() => setInvoiceItems([])}
                                        className="text-sm text-red-500 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {invoiceItems.length === 0 ? (
                                <p className="text-gray-500">No items selected yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {invoiceItems.map((item) => (
                                        <div key={item.productId} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                                            <div className="mb-2 flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-xs text-gray-500">{item.unit}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromInvoice(item.productId)}
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

                            {invoiceItems.length > 0 && (
                                <button
                                    onClick={handleSubmit}
                                    className="btn btn-success mt-4 w-full gap-2"
                                    disabled={isSubmitting}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                                        <path d="M3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 11.6585 22 11.4878 21.9848 11.3142C21.9142 10.5049 21.586 9.71257 21.0637 9.09034C20.9516 8.95687 20.828 8.83317 20.5806 8.58578L15.4142 3.41944C15.1668 3.17206 15.0431 3.04835 14.9097 2.93631C14.2874 2.414 13.4951 2.08581 12.6858 2.01515C12.5122 2 12.3415 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355Z" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M17 22V21C17 19.1144 17 18.1716 16.4142 17.5858C15.8284 17 14.8856 17 13 17H11C9.11438 17 8.17157 17 7.58579 17.5858C7 18.1716 7 19.1144 7 21V22" stroke="currentColor" strokeWidth="1.5" />
                                        <path opacity="0.5" d="M7 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    {isSubmitting ? 'Saving...' : 'Save Invoice'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAuth(InvoiceAdd);
