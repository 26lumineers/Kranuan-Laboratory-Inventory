import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
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
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
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

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'PENDING': return 'รอดำเนินการ';
        case 'APPROVED': return 'อนุมัติแล้ว';
        case 'REJECTED': return 'ปฏิเสธ';
        case 'SUCCESS': return 'สำเร็จ';
        default: return status;
    }
};

const InvoicePreview = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const { id } = router.query;
    const { user } = useSelector((state: IRootState) => state.auth);
    const isSuperAdmin = user?.role === 'SUPERADMIN';

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Invoice Preview'));
    }, [dispatch]);

    // Fetch invoice
    useEffect(() => {
        if (!id) return;

        const fetchInvoice = async () => {
            setIsLoading(true);
            setError(null);

            const response = await api.get<Invoice>(`/invoices/${id}`);

            if (response.error) {
                setError(response.error);
            } else if (response.data) {
                setInvoice(response.data);
            }

            setIsLoading(false);
        };

        fetchInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // For now, just print - can be enhanced to PDF download
        window.print();
    };

    const handleApprove = async () => {
        if (!invoice || !isSuperAdmin) return;

        if (!window.confirm('Are you sure you want to approve this invoice? This will increase the stock for all items.')) {
            return;
        }

        setIsApproving(true);
        setError(null);

        const response = await api.post(`/invoices/${invoice.id}/approve`, {});

        setIsApproving(false);

        if (response.error) {
            setError(response.error);
        } else {
            // Refresh invoice data
            setInvoice(response.data);
            router.push('/apps/invoice/list');
        }
    };

    const handleReject = async () => {
        if (!invoice || !isSuperAdmin) return;

        if (!window.confirm('Are you sure you want to reject this invoice?')) {
            return;
        }

        setIsRejecting(true);
        setError(null);

        const response = await api.post(`/invoices/${invoice.id}/reject`, {});

        setIsRejecting(false);

        if (response.error) {
            setError(response.error);
        } else {
            // Refresh invoice data
            setInvoice(response.data);
            router.push('/apps/invoice/list');
        }
    };

    // Calculate totals
    const totalItems = invoice?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 text-6xl text-gray-300">!</div>
                    <h2 className="text-xl font-bold text-gray-600">Invoice not found</h2>
                    <p className="mt-2 text-gray-500">{error || 'The requested invoice could not be found.'}</p>
                </div>
            </div>
        );
    }

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
        <div className="p-4 md:p-6 print:p-0">
            {/* Top Actions */}
            <div className="mb-6 flex flex-wrap items-center justify-end gap-4 print:hidden">
                {/* SUPERADMIN Actions - Only for PENDING invoices */}
                {isSuperAdmin && invoice?.status === 'PENDING' && (
                    <>
                        <button
                            type="button"
                            className="btn btn-danger gap-2"
                            onClick={handleReject}
                            disabled={isRejecting}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M8 8L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            {isRejecting ? 'Rejecting...' : 'Reject'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-success gap-2"
                            onClick={handleApprove}
                            disabled={isApproving}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M8 12.5L11 15.5L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {isApproving ? 'Approving...' : 'Approve (Add Stock)'}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={handlePrint}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 17.9827C4.44655 17.9359 3.51998 17.7626 2.87868 17.1213C2 16.2426 2 14.8284 2 12C2 9.17157 2 7.75736 2.87868 6.87868C3.75736 6 5.17157 6 8 6H16C18.8284 6 20.2426 6 21.1213 6.87868C22 7.75736 22 9.17157 22 12C22 14.8284 22 16.2426 21.1213 17.1213C20.48 17.7626 19.5535 17.9359 18 17.9827" stroke="currentColor" strokeWidth="1.5" />
                        <path opacity="0.5" d="M9 10H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M19 14L5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M18 14V16C18 18.8284 18 20.2426 17.1213 21.1213C16.2426 22 14.8284 22 12 22C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path opacity="0.5" d="M17.9827 6C17.9359 4.44655 17.7626 3.51998 17.1213 2.87868C16.2427 2 14.8284 2 12 2C9.17158 2 7.75737 2 6.87869 2.87868C6.23739 3.51998 6.06414 4.44655 6.01733 6" stroke="currentColor" strokeWidth="1.5" />
                        <circle opacity="0.5" cx="17" cy="10" r="1" fill="currentColor" />
                        <path opacity="0.5" d="M15 16.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path opacity="0.5" d="M13 19H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Print
                </button>

                <button
                    type="button"
                    className="btn btn-secondary gap-2"
                    onClick={handleDownload}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                        <path opacity="0.5" d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                        <path d="M12 2L12 15M12 15L9 11.5M12 15L15 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    Download
                </button>
            </div>

            {/* Invoice Panel */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 print:shadow-none">
                {/* Header */}
                <div className="flex flex-wrap justify-between gap-4 border-b border-gray-200 pb-6 dark:border-gray-700">
                    <div>
                        <div className="text-2xl font-bold uppercase">Invoice</div>
                        <div className="mt-2 text-gray-500">
                            <span className={`badge badge-outline-${getStatusColor(invoice.status)}`}>
                                {getStatusLabel(invoice.status)}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <img src="/assets/images/logo.svg" alt="Logo" className="w-14" />
                    </div>
                </div>

                {/* Invoice Info */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Invoice Details</div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Invoice Number:</span>
                                <span className="font-semibold">{invoice.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Issue Date:</span>
                                <span>{formatThaiDate(invoice.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created By:</span>
                                <span>{invoice.creator?.fullName || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                    {invoice.description && (
                        <div>
                            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Description</div>
                            <div className="mt-4 text-gray-600 dark:text-gray-400">
                                {invoice.description}
                            </div>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="mt-8">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">No.</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Items</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {invoice.items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{item.productName || 'Unknown'}</div>
                                        {item.productUnit && (
                                            <div className="text-sm text-gray-500">{item.productUnit}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                    <div className="flex justify-end">
                        <div className="w-full sm:w-1/2 lg:w-1/3">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <div>Total Items</div>
                                <div>{totalItems}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note */}
                {invoice.note && (
                    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Note</div>
                        <div className="mt-2 text-gray-600 dark:text-gray-400">
                            {invoice.note}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default withAuth(InvoicePreview);
