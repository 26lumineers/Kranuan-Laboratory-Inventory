import { useEffect, useState, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { withAuth } from '../components/Auth/withAuth';
import { api } from '../utils/api';
import Link from 'next/link';
import LabLayout from '../components/Layouts/LabLayout';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'by-room' | 'by-user' | 'movements';

interface DailyReport {
    date: string;
    totalTransactions: number;
    transactions: Array<{
        id: string;
        note: string | null;
        createdAt: string;
        user: { id: string; fullName: string };
        room: { id: string; name: string };
        items: Array<{ id: string; quantity: number; product: { name: string; unit: string } }>;
    }>;
}

interface WeeklyReport {
    startDate: string;
    endDate: string;
    totalTransactions: number;
    dailyBreakdown: Record<string, Array<{ id: string }>>;
}

interface MonthlyReport {
    year: number;
    month: number;
    totalTransactions: number;
    dailyBreakdown: Record<string, Array<{ id: string }>>;
}

interface ByRoomReport {
    startDate: string;
    endDate: string;
    byRoom: Record<string, { count: number; roomId: string | null }>;
}

interface ByUserReport {
    startDate: string;
    endDate: string;
    byUser: Record<string, { count: number; userId: string | null }>;
}

interface MovementsReport {
    startDate: string;
    endDate: string;
    summary: {
        totalIn: number;
        totalOut: number;
        totalAdjust: number;
    };
    movements: Array<{
        id: string;
        quantity: number;
        movementType: string;
        createdAt: string;
        product: { name: string; unit: string };
    }>;
}

const ReportsPage = () => {
    const { user } = useSelector((state: IRootState) => state.auth);
    const [reportType, setReportType] = useState<ReportType>('daily');
    const [reportData, setReportData] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dateParams, setDateParams] = useState({
        date: new Date().toISOString().split('T')[0],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
    });

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;

    useEffect(() => {
        fetchReport();
    }, [reportType]);

    const fetchReport = async () => {
        setIsLoading(true);
        let endpoint = '';
        let params = {};

        switch (reportType) {
            case 'daily':
                endpoint = '/reports/daily';
                params = { date: dateParams.date };
                break;
            case 'weekly':
                endpoint = '/reports/weekly';
                params = { startDate: dateParams.startDate };
                break;
            case 'monthly':
                endpoint = '/reports/monthly';
                params = { year: dateParams.year, month: dateParams.month };
                break;
            case 'by-room':
                endpoint = '/reports/by-room';
                params = { startDate: dateParams.startDate, endDate: dateParams.endDate };
                break;
            case 'by-user':
                endpoint = '/reports/by-user';
                params = { startDate: dateParams.startDate, endDate: dateParams.endDate };
                break;
            case 'movements':
                endpoint = '/reports/inventory-movements';
                params = { startDate: dateParams.startDate, endDate: dateParams.endDate };
                break;
        }

        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const response = await api.get(`${endpoint}?${queryString}`);

        if (response.data) {
            setReportData(response.data);
        }
        setIsLoading(false);
    };

    const handleParamChange = (key: string, value: string) => {
        setDateParams(prev => ({ ...prev, [key]: value }));
    };

    const renderReport = () => {
        if (!reportData) return null;

        switch (reportType) {
            case 'daily':
                return <DailyReportView data={reportData as DailyReport} />;
            case 'weekly':
                return <WeeklyReportView data={reportData as WeeklyReport} />;
            case 'monthly':
                return <MonthlyReportView data={reportData as MonthlyReport} />;
            case 'by-room':
                return <ByRoomReportView data={reportData as ByRoomReport} />;
            case 'by-user':
                return <ByUserReportView data={reportData as ByUserReport} />;
            case 'movements':
                return <MovementsReportView data={reportData as MovementsReport} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
                <h1 className="mt-2 text-2xl font-bold md:text-3xl">Reports & Analytics</h1>
                <p className="mt-1 text-gray-500">View transaction reports and inventory analytics</p>
            </div>

            {/* Report Type Selector */}
            <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <div className="mb-4 flex flex-wrap gap-2">
                    {[
                        { key: 'daily', label: 'Daily Report' },
                        { key: 'weekly', label: 'Weekly Report' },
                        { key: 'monthly', label: 'Monthly Report' },
                        { key: 'by-room', label: 'By Room' },
                        { key: 'by-user', label: 'By User' },
                        { key: 'movements', label: 'Inventory Movements' },
                    ].map((type) => (
                        <button
                            key={type.key}
                            onClick={() => setReportType(type.key as ReportType)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${reportType === type.key
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Date Parameters */}
                <div className="flex flex-wrap gap-4">
                    {(reportType === 'daily' || reportType === 'weekly') && (
                        <div>
                            <label className="block text-sm text-gray-500">
                                {reportType === 'daily' ? 'Date' : 'Start Date'}
                            </label>
                            <input
                                type="date"
                                className="form-input mt-1"
                                value={reportType === 'daily' ? dateParams.date : dateParams.startDate}
                                onChange={(e) =>
                                    handleParamChange(
                                        reportType === 'daily' ? 'date' : 'startDate',
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    )}

                    {reportType === 'monthly' && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-500">Year</label>
                                <input
                                    type="number"
                                    className="form-input mt-1 w-24"
                                    value={dateParams.year}
                                    onChange={(e) => handleParamChange('year', e.target.value)}
                                    min={2020}
                                    max={2030}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">Month</label>
                                <select
                                    className="form-select mt-1"
                                    value={dateParams.month}
                                    onChange={(e) => handleParamChange('month', e.target.value)}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <option key={m} value={m}>
                                            {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {(reportType === 'by-room' || reportType === 'by-user' || reportType === 'movements') && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-500">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input mt-1"
                                    value={dateParams.startDate}
                                    onChange={(e) => handleParamChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">End Date</label>
                                <input
                                    type="date"
                                    className="form-input mt-1"
                                    value={dateParams.endDate}
                                    onChange={(e) => handleParamChange('endDate', e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-end">
                        <button onClick={fetchReport} className="btn btn-primary">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                {isLoading ? (
                    <div className="py-8 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                ) : (
                    renderReport()
                )}
            </div>
        </div>
    );
};

// Report View Components
const DailyReportView = ({ data }: { data: DailyReport }) => (
    <div>
        <h3 className="mb-4 text-lg font-bold">Daily Report - {data.date}</h3>
        <p className="mb-4 text-gray-500">Total Transactions: {data.totalTransactions}</p>

        {data.transactions.length > 0 ? (
            <div className="space-y-4">
                {data.transactions.map((tx) => (
                    <div key={tx.id} className="rounded-lg border p-4 dark:border-gray-700">
                        <div className="mb-2 flex justify-between">
                            <span className="font-medium">{tx.user?.fullName}</span>
                            <span className="text-sm text-gray-500">{tx.room?.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tx.items?.map((item) => (
                                <span key={item.id} className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                                    {item.product?.name} x {item.quantity}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-gray-500">No transactions for this date</p>
        )}
    </div>
);

const WeeklyReportView = ({ data }: { data: WeeklyReport }) => (
    <div>
        <h3 className="mb-4 text-lg font-bold">
            Weekly Report - {data.startDate} to {data.endDate}
        </h3>
        <p className="mb-4 text-gray-500">Total Transactions: {data.totalTransactions}</p>

        <div className="space-y-2">
            {Object.entries(data.dailyBreakdown).map(([date, txs]) => (
                <div key={date} className="flex justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="font-medium">{date}</span>
                    <span className="text-primary">{txs.length} transactions</span>
                </div>
            ))}
        </div>
    </div>
);

const MonthlyReportView = ({ data }: { data: MonthlyReport }) => (
    <div>
        <h3 className="mb-4 text-lg font-bold">
            Monthly Report - {new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <p className="mb-4 text-gray-500">Total Transactions: {data.totalTransactions}</p>

        <div className="max-h-96 space-y-2 overflow-y-auto">
            {Object.entries(data.dailyBreakdown).map(([date, txs]) => (
                <div key={date} className="flex justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="font-medium">{date}</span>
                    <span className="text-primary">{txs.length} transactions</span>
                </div>
            ))}
        </div>
    </div>
);

const ByRoomReportView = ({ data }: { data: ByRoomReport }) => (
    <div>
        <h3 className="mb-4 text-lg font-bold">
            Report by Room - {data.startDate} to {data.endDate}
        </h3>

        <div className="space-y-2">
            {Object.entries(data.byRoom).map(([room, info]) => (
                <div key={room} className="flex justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="font-medium">{room}</span>
                    <span className="text-primary">{info.count} transactions</span>
                </div>
            ))}
        </div>
    </div>
);

const ByUserReportView = ({ data }: { data: ByUserReport }) => (
    <div>
        <h3 className="mb-4 text-lg font-bold">
            Report by User - {data.startDate} to {data.endDate}
        </h3>

        <div className="space-y-2">
            {Object.entries(data.byUser).map(([userName, info]) => (
                <div key={userName} className="flex justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="font-medium">{userName}</span>
                    <span className="text-primary">{info.count} transactions</span>
                </div>
            ))}
        </div>
    </div>
);

const MovementsReportView = ({ data }: { data: MovementsReport }) => (
    <div>
        <h3 className="mb-4 text-lg font-bold">
            Inventory Movements - {data.startDate} to {data.endDate}
        </h3>

        <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <p className="text-sm text-gray-500">Total In</p>
                <p className="text-2xl font-bold text-green-600">{data.summary.totalIn}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                <p className="text-sm text-gray-500">Total Out</p>
                <p className="text-2xl font-bold text-red-600">{data.summary.totalOut}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
                <p className="text-sm text-gray-500">Adjustments</p>
                <p className="text-2xl font-bold text-yellow-600">{data.summary.totalAdjust}</p>
            </div>
        </div>

        <h4 className="mb-2 font-medium">Recent Movements</h4>
        <div className="max-h-96 space-y-2 overflow-y-auto">
            {data.movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <div>
                        <p className="font-medium">{m.product?.name}</p>
                        <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <span
                            className={`font-bold ${m.movementType === 'IN'
                                ? 'text-green-600'
                                : m.movementType === 'OUT'
                                    ? 'text-red-600'
                                    : 'text-yellow-600'
                                }`}
                        >
                            {m.movementType === 'IN' ? '+' : '-'}{m.quantity}
                        </span>
                        <p className="text-xs text-gray-500">{m.movementType}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

(ReportsPage as any).getLayout = (page: ReactElement) => <LabLayout>{page}</LabLayout>;

export default withAuth(ReportsPage);
