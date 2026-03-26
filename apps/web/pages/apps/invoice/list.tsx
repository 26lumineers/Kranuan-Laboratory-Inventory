import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { IRootState } from '../../../store';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { api } from '../../../utils/api';
import { withAuth } from '../../../components/Auth/withAuth';

interface InvoiceItem {
    id: string;
    productId: string;
    productName: string | null;
    productUnit: string | null;
    quantity: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    description: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUCCESS';
    createdBy: string;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    items: InvoiceItem[];
    creator?: {
        id: string;
        fullName: string;
        username: string;
    } | null;
}

// Thai date format
const formatThaiDate = (dateString: string) => {
    const date = new Date(dateString);
    const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist era
    return `${day} ${month} ${year}`;
};

// Truncate text
const truncate = (text: string | null, maxLength: number = 50) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Status badge colors
const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return 'warning';
        case 'APPROVED': return 'info';
        case 'REJECTED': return 'danger';
        case 'SUCCESS': return 'success';
        default: return 'secondary';
    }
};

const InvoiceList = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user } = useSelector((state: IRootState) => state.auth);
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Invoice List'));
    }, [dispatch]);

    // Redirect GENERAL users to dashboard
    useEffect(() => {
        if (user?.role === 'GENERAL') {
            router.push('/dashboard');
        }
    }, [user?.role, router]);

    // Fetch invoices
    useEffect(() => {
        const fetchInvoices = async () => {
            setIsLoading(true);
            setError(null);

            const params = statusFilter ? `?status=${statusFilter}` : '';
            const response = await api.get<Invoice[]>(`/invoices${params}`);

            if (response.error) {
                setError(response.error);
            } else if (response.data) {
                setInvoices(response.data);
            }

            setIsLoading(false);
        };

        fetchInvoices();
    }, [statusFilter]);

    // Filter invoices by search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredInvoices(invoices);
            return;
        }

        const filtered = invoices.filter(
            (inv) =>
                inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.creator?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInvoices(filtered);
    }, [searchTerm, invoices]);

    // Count by status
    const statusCounts = {
        PENDING: invoices.filter((inv) => inv.status === 'PENDING').length,
        REJECTED: invoices.filter((inv) => inv.status === 'REJECTED').length,
    };

    const handleDelete = async (id: string) => {
        if (!isSuperAdmin) return;

        const response = await api.delete(`/invoices/${id}`);
        if (response.error) {
            setError(response.error);
        } else {
            setInvoices(invoices.filter((inv) => inv.id !== id));
            setDeleteConfirm(null);
        }
    };

    // Show loading while checking permissions
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
                <h1 className="text-2xl font-bold md:text-3xl">Invoice List</h1>
                <p className="mt-1 text-gray-500">Manage your invoices</p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Status Filter Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                    onClick={() => setStatusFilter(null)}
                    className={`rounded-lg p-4 text-left transition ${
                        statusFilter === null
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white shadow dark:bg-gray-800'
                    }`}
                >
                    <div className="text-2xl font-bold">{invoices.length}</div>
                    <div className="text-sm opacity-80">All Invoices</div>
                </button>
                <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`rounded-lg p-4 text-left transition ${
                        statusFilter === 'PENDING'
                            ? 'bg-warning text-white shadow-lg'
                            : 'bg-white shadow dark:bg-gray-800'
                    }`}
                >
                    <div className="text-2xl font-bold">{statusCounts.PENDING}</div>
                    <div className="text-sm opacity-80">Pending</div>
                </button>
                <button
                    onClick={() => setStatusFilter('REJECTED')}
                    className={`rounded-lg p-4 text-left transition ${
                        statusFilter === 'REJECTED'
                            ? 'bg-danger text-white shadow-lg'
                            : 'bg-white shadow dark:bg-gray-800'
                    }`}
                >
                    <div className="text-2xl font-bold">{statusCounts.REJECTED}</div>
                    <div className="text-sm opacity-80">Rejected</div>
                </button>
                <div className="flex items-center">
                    <Link href="/apps/invoice/add" className="btn btn-primary w-full gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add New
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    className="form-input w-full md:w-auto"
                    placeholder="Search by invoice number, description, or creator..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Invoice Number</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Created By</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Description</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Status</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/apps/invoice/preview?id=${invoice.id}`}
                                                className="font-semibold text-primary hover:underline"
                                            >
                                                #{invoice.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            {invoice.creator?.fullName || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {truncate(invoice.description, 50)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {formatThaiDate(invoice.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`badge badge-outline-${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Edit Button - Disabled if SUCCESS */}
                                                {invoice.status === 'SUCCESS' ? (
                                                    <button
                                                        disabled
                                                        className="flex cursor-not-allowed items-center text-gray-400"
                                                        title="Cannot edit completed invoice"
                                                    >
                                                        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path opacity="0.5" d="M22 10.5V12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                            <path d="M17.3009 2.80624L16.652 3.45506L10.6872 9.41993C10.2832 9.82394 10.0812 10.0259 9.90743 10.2487C9.70249 10.5114 9.52679 10.7957 9.38344 11.0965C9.26191 11.3515 9.17157 11.6225 8.99089 12.1646L8.41242 13.9L8.03811 15.0229C7.9492 15.2897 8.01862 15.5837 8.21744 15.7826C8.41626 15.9814 8.71035 16.0508 8.97709 15.9619L10.1 15.5876L11.8354 15.0091C12.3775 14.8284 12.6485 14.7381 12.9035 14.6166C13.2043 14.4732 13.4886 14.2975 13.7513 14.0926C13.9741 13.9188 14.1761 13.7168 14.5801 13.3128L20.5449 7.34795L21.1938 6.69914C22.2687 5.62415 22.2687 3.88124 21.1938 2.80624C20.1188 1.73125 18.3759 1.73125 17.3009 2.80624Z" stroke="currentColor" strokeWidth="1.5"></path>
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={`/apps/invoice/edit?id=${invoice.id}`}
                                                        className="flex items-center text-info hover:text-info/80"
                                                        title="Edit"
                                                    >
                                                        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path opacity="0.5" d="M22 10.5V12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                            <path d="M17.3009 2.80624L16.652 3.45506L10.6872 9.41993C10.2832 9.82394 10.0812 10.0259 9.90743 10.2487C9.70249 10.5114 9.52679 10.7957 9.38344 11.0965C9.26191 11.3515 9.17157 11.6225 8.99089 12.1646L8.41242 13.9L8.03811 15.0229C7.9492 15.2897 8.01862 15.5837 8.21744 15.7826C8.41626 15.9814 8.71035 16.0508 8.97709 15.9619L10.1 15.5876L11.8354 15.0091C12.3775 14.8284 12.6485 14.7381 12.9035 14.6166C13.2043 14.4732 13.4886 14.2975 13.7513 14.0926C13.9741 13.9188 14.1761 13.7168 14.5801 13.3128L20.5449 7.34795L21.1938 6.69914C22.2687 5.62415 22.2687 3.88124 21.1938 2.80624C20.1188 1.73125 18.3759 1.73125 17.3009 2.80624Z" stroke="currentColor" strokeWidth="1.5"></path>
                                                        </svg>
                                                    </Link>
                                                )}

                                                {/* View Button */}
                                                <Link
                                                    href={`/apps/invoice/preview?id=${invoice.id}`}
                                                    className="flex items-center text-primary hover:text-primary/80"
                                                    title="View"
                                                >
                                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path opacity="0.5" d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z" stroke="currentColor" strokeWidth="1.5" />
                                                        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="1.5" />
                                                    </svg>
                                                </Link>

                                                {/* Delete Button - SUPERADMIN only */}
                                                {isSuperAdmin && (
                                                    deleteConfirm === invoice.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(invoice.id)}
                                                                className="rounded bg-danger px-2 py-1 text-xs text-white hover:bg-danger/80"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(null)}
                                                                className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirm(invoice.id)}
                                                            className="flex items-center text-danger hover:text-danger/80"
                                                            title="Delete"
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M20.5001 6H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                                <path d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                                <path opacity="0.5" d="M9.5 11L10 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                                <path opacity="0.5" d="M14.5 11L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                                <path opacity="0.5" d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6" stroke="currentColor" strokeWidth="1.5"></path>
                                                            </svg>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default withAuth(InvoiceList);
