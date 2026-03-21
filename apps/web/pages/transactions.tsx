import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import LabLayout from '../components/Layouts/LabLayout';

interface TransactionItem {
    id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        unit: string;
    };
}

interface Transaction {
    id: string;
    note: string | null;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        nickname: string | null;
    };
    room: {
        id: string;
        name: string;
    };
    items?: TransactionItem[];
}

const TransactionsPage = () => {
    const { user } = useSelector((state: IRootState) => state.auth);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setIsLoading(true);
        const response = await api.get<Transaction[]>('/transactions');
        if (response.data) {
            // Fetch items for each transaction
            const transactionsWithItems = await Promise.all(
                response.data.map(async (tx) => {
                    const detailRes = await api.get<Transaction>(`/transactions/${tx.id}`);
                    return detailRes.data ? { ...tx, items: detailRes.data.items } : tx;
                })
            );
            setTransactions(transactionsWithItems);
        }
        setIsLoading(false);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.room?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !dateFilter || tx.createdAt?.startsWith(dateFilter);
        return matchesSearch && matchesDate;
    });

    const viewDetails = async (tx: Transaction) => {
        if (!tx.items) {
            const response = await api.get<Transaction>(`/transactions/${tx.id}`);
            if (response.data) {
                setSelectedTransaction({ ...tx, items: response.data.items });
            }
        } else {
            setSelectedTransaction(tx);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold md:text-3xl">Transactions</h1>
                <p className="mt-1 text-gray-500">View order history and transaction details</p>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:space-x-4">
                <input
                    type="text"
                    placeholder="Search by user or room..."
                    className="form-input mb-2 w-full sm:mb-0 sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <input
                    type="date"
                    className="form-input w-full sm:w-48"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
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
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    {isAdmin && <th className="px-4 py-3 text-left text-sm font-medium">User</th>}
                                    <th className="px-4 py-3 text-left text-sm font-medium">Room</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Items</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Note</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{tx.user?.fullName || '-'}</p>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-gray-500">
                                            {tx.room?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                {tx.items?.length || 0} items
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {tx.note || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => viewDetails(tx)}
                                                className="btn btn-outline-primary btn-sm"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredTransactions.length === 0 && (
                    <p className="py-8 text-center text-gray-500">No transactions found</p>
                )}
            </div>

            {/* Details Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Transaction Details</h3>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Date</p>
                                    <p className="font-medium">
                                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {isAdmin && (
                                    <div>
                                        <p className="text-gray-500">User</p>
                                        <p className="font-medium">{selectedTransaction.user?.fullName}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-500">Room</p>
                                    <p className="font-medium">{selectedTransaction.room?.name}</p>
                                </div>
                                {selectedTransaction.note && (
                                    <div className="col-span-2">
                                        <p className="text-gray-500">Note</p>
                                        <p className="font-medium">{selectedTransaction.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h4 className="mb-2 font-medium">Items Ordered</h4>
                        <div className="space-y-2">
                            {selectedTransaction.items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                                >
                                    <div>
                                        <p className="font-medium">{item.product?.name}</p>
                                        <p className="text-xs text-gray-500">{item.product?.unit}</p>
                                    </div>
                                    <span className="font-bold text-primary">{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

(TransactionsPage as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(TransactionsPage);
