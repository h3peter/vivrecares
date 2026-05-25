import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { DashboardSkeleton } from '../components/PageSkeleton';

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: 'short' });
const MONTH_YEAR_LABEL = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
const DATE_LABEL = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const DATE_TIME_LABEL = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
});

const normalizeDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const startOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const endOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
};

const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const clampPercent = (value) => Math.max(0, Math.min(100, value));

const formatCurrency = (amount) => currencyFormatter.format(Number(amount || 0));
const formatPercent = (value) => percentFormatter.format(Number.isFinite(value) ? value : 0);

const compareChange = (current, previous) => {
    if (!previous && !current) {
        return { text: 'No change from last period', tone: 'neutral' };
    }

    if (!previous) {
        return { text: 'New activity this period', tone: 'positive' };
    }

    const delta = (current - previous) / previous;
    const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    const tone = direction === 'up' ? 'positive' : direction === 'down' ? 'negative' : 'neutral';

    return {
        text: `${formatPercent(Math.abs(delta))} ${direction === 'flat' ? 'vs last period' : `${direction} vs last period`}`,
        tone,
    };
};

const buildLinePath = (points, width, height, padding = 16) => {
    if (!points.length) return '';

    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const maxValue = Math.max(...points.map((point) => point.value), 1);

    return points
        .map((point, index) => {
            const x = padding + ((innerWidth / Math.max(points.length - 1, 1)) * index);
            const y = padding + innerHeight - ((point.value / maxValue) * innerHeight);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
};

const AdminDashboard = () => {
    const [billings, setBillings] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadDashboard = async () => {
            setLoading(true);
            setError('');

            try {
                const [billingsRes, appointmentsRes] = await Promise.all([
                    axios.get('/get_billings.php'),
                    axios.get('/get_all_appointments.php'),
                ]);

                if (!active) return;

                setBillings(Array.isArray(billingsRes.data) ? billingsRes.data : []);
                setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
            } catch (loadError) {
                if (!active) return;
                console.error('Error loading admin dashboard', loadError);
                setError('We could not load the dashboard right now. Please try again in a moment.');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            active = false;
        };
    }, []);

    const metrics = useMemo(() => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const weekAheadEnd = endOfDay(addDays(now, 6));
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthStart = startOfMonth(previousMonthDate);
        const previousMonthEnd = endOfMonth(previousMonthDate);

        const billingRows = billings.map((billing) => {
            const amount = Number(billing.total_amount || 0);
            const paymentDate = normalizeDate(billing.payment_date);

            return {
                ...billing,
                amount,
                paymentDate,
                normalizedStatus: String(billing.payment_status || 'Unpaid').trim(),
                normalizedBranch: billing.branch || 'Unassigned',
                normalizedService: billing.main_treatment || 'Clinic Availment',
                patientName: `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || 'Walk-in patient',
            };
        });

        const appointmentRows = appointments
            .map((appointment) => {
                const datePart = appointment.date ? `${appointment.date}T${appointment.time || '00:00:00'}` : appointment.date;
                const scheduledAt = normalizeDate(datePart);

                return {
                    ...appointment,
                    scheduledAt,
                    normalizedStatus: String(appointment.status || 'Pending').trim(),
                    normalizedBranch: appointment.branch || 'Unassigned',
                    normalizedService: appointment.appointment_type || 'Consultation',
                    patientName: `${appointment.first_name || ''} ${appointment.last_name || ''}`.trim() || 'Unknown patient',
                };
            })
            .filter((appointment) => appointment.scheduledAt);

        const paidBillings = billingRows.filter((billing) => billing.normalizedStatus === 'Paid');
        const outstandingBillings = billingRows.filter((billing) => billing.normalizedStatus !== 'Paid');

        const revenueThisMonth = paidBillings
            .filter((billing) => billing.paymentDate && billing.paymentDate >= currentMonthStart && billing.paymentDate <= currentMonthEnd)
            .reduce((sum, billing) => sum + billing.amount, 0);

        const revenuePreviousMonth = paidBillings
            .filter((billing) => billing.paymentDate && billing.paymentDate >= previousMonthStart && billing.paymentDate <= previousMonthEnd)
            .reduce((sum, billing) => sum + billing.amount, 0);

        const outstandingAmount = outstandingBillings.reduce((sum, billing) => sum + billing.amount, 0);
        const totalBilledAmount = billingRows.reduce((sum, billing) => sum + billing.amount, 0);
        const collectedAmount = paidBillings.reduce((sum, billing) => sum + billing.amount, 0);
        const collectionRate = totalBilledAmount > 0 ? collectedAmount / totalBilledAmount : 0;

        const todaysAppointments = appointmentRows.filter((appointment) => appointment.scheduledAt >= todayStart && appointment.scheduledAt <= todayEnd);
        const upcomingWeekAppointments = appointmentRows.filter(
            (appointment) => appointment.scheduledAt >= todayStart && appointment.scheduledAt <= weekAheadEnd && appointment.normalizedStatus !== 'Cancelled'
        );

        const completedThisMonth = appointmentRows.filter(
            (appointment) =>
                appointment.normalizedStatus === 'Completed' &&
                appointment.scheduledAt >= currentMonthStart &&
                appointment.scheduledAt <= currentMonthEnd
        ).length;

        const completedPreviousMonth = appointmentRows.filter(
            (appointment) =>
                appointment.normalizedStatus === 'Completed' &&
                appointment.scheduledAt >= previousMonthStart &&
                appointment.scheduledAt <= previousMonthEnd
        ).length;

        const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
            const key = monthKey(date);
            const value = paidBillings
                .filter((billing) => billing.paymentDate && monthKey(billing.paymentDate) === key)
                .reduce((sum, billing) => sum + billing.amount, 0);

            return {
                label: MONTH_LABEL.format(date),
                fullLabel: MONTH_YEAR_LABEL.format(date),
                value,
            };
        });

        const nextSevenDays = Array.from({ length: 7 }, (_, index) => {
            const date = addDays(todayStart, index);
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);
            const value = appointmentRows.filter(
                (appointment) =>
                    appointment.scheduledAt >= dayStart &&
                    appointment.scheduledAt <= dayEnd &&
                    appointment.normalizedStatus !== 'Cancelled'
            ).length;

            return {
                label: DATE_LABEL.format(date),
                value,
            };
        });

        const statusCounts = appointmentRows.reduce((accumulator, appointment) => {
            accumulator[appointment.normalizedStatus] = (accumulator[appointment.normalizedStatus] || 0) + 1;
            return accumulator;
        }, {});

        const topServices = Object.values(
            paidBillings.reduce((accumulator, billing) => {
                const key = billing.normalizedService;
                if (!accumulator[key]) {
                    accumulator[key] = { label: key, revenue: 0, count: 0 };
                }
                accumulator[key].revenue += billing.amount;
                accumulator[key].count += 1;
                return accumulator;
            }, {})
        )
            .sort((left, right) => right.revenue - left.revenue)
            .slice(0, 5);

        const branchPerformance = Object.values(
            billingRows.reduce((accumulator, billing) => {
                const key = billing.normalizedBranch;
                if (!accumulator[key]) {
                    accumulator[key] = {
                        label: key,
                        revenue: 0,
                        outstanding: 0,
                        invoices: 0,
                        visits: 0,
                    };
                }

                accumulator[key].invoices += 1;
                if (billing.normalizedStatus === 'Paid') {
                    accumulator[key].revenue += billing.amount;
                } else {
                    accumulator[key].outstanding += billing.amount;
                }

                return accumulator;
            }, {})
        ).map((branch) => {
            const visits = appointmentRows.filter((appointment) => appointment.normalizedBranch === branch.label).length;
            return {
                ...branch,
                visits,
            };
        }).sort((left, right) => right.revenue - left.revenue);

        const upcomingAppointments = appointmentRows
            .filter((appointment) => appointment.scheduledAt >= now && appointment.normalizedStatus !== 'Cancelled')
            .sort((left, right) => left.scheduledAt - right.scheduledAt)
            .slice(0, 6);

        const attentionItems = [
            {
                label: 'Unpaid or overdue invoices',
                value: outstandingBillings.length,
                detail: `${formatCurrency(outstandingAmount)} awaiting collection`,
                tone: outstandingBillings.length > 0 ? 'warning' : 'positive',
            },
            {
                label: 'Pending appointments',
                value: statusCounts.Pending || 0,
                detail: 'Requests waiting for confirmation',
                tone: (statusCounts.Pending || 0) > 0 ? 'warning' : 'positive',
            },
            {
                label: "Today's appointments",
                value: todaysAppointments.length,
                detail: `${upcomingWeekAppointments.length} scheduled in the next 7 days`,
                tone: 'neutral',
            },
        ];

        return {
            revenueThisMonth,
            revenuePreviousMonth,
            outstandingAmount,
            collectionRate,
            todaysAppointments: todaysAppointments.length,
            upcomingWeekAppointments: upcomingWeekAppointments.length,
            completedThisMonth,
            completedPreviousMonth,
            totalPatientsBilled: new Set(billingRows.map((billing) => billing.patientName)).size,
            revenueTrend: lastSixMonths,
            scheduleTrend: nextSevenDays,
            statusBreakdown: Object.entries(statusCounts)
                .map(([label, value]) => ({ label, value }))
                .sort((left, right) => right.value - left.value),
            topServices,
            branchPerformance,
            upcomingAppointments,
            attentionItems,
            revenueChange: compareChange(revenueThisMonth, revenuePreviousMonth),
            completionChange: compareChange(completedThisMonth, completedPreviousMonth),
        };
    }, [appointments, billings]);

    const revenueMax = Math.max(...metrics.revenueTrend.map((item) => item.value), 1);
    const serviceMax = Math.max(...metrics.topServices.map((item) => item.revenue), 1);
    const linePath = buildLinePath(metrics.scheduleTrend, 420, 180);

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-6 sm:p-8 lg:p-12">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Admin Command Center</p>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Clinic performance at a glance</h1>

                </div>
                <div className="rounded-3xl border border-[#e7ddcf] bg-[#faf9f6] px-5 py-4 text-sm text-gray-600 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Snapshot</p>
                    <p className="mt-2 font-medium text-gray-800">{DATE_TIME_LABEL.format(new Date())}</p>
                </div>
            </div>

            {error ? (
                <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">Dashboard Error</p>
                    <p className="mt-3 text-sm text-gray-600">{error}</p>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Revenue This Month"
                    value={formatCurrency(metrics.revenueThisMonth)}
                    detail={metrics.revenueChange.text}
                    tone={metrics.revenueChange.tone}
                />
                <KpiCard
                    label="Collection Rate"
                    value={formatPercent(metrics.collectionRate)}
                    detail={`${formatCurrency(metrics.outstandingAmount)} still outstanding`}
                    tone={metrics.collectionRate >= 0.75 ? 'positive' : metrics.collectionRate >= 0.5 ? 'warning' : 'negative'}
                />
                <KpiCard
                    label="Today's Appointments"
                    value={metrics.todaysAppointments}
                    detail={`${metrics.upcomingWeekAppointments} in the next 7 days`}
                    tone="neutral"
                />
                <KpiCard
                    label="Completed Visits"
                    value={metrics.completedThisMonth}
                    detail={metrics.completionChange.text}
                    tone={metrics.completionChange.tone}
                />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
                <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Financial Trend</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-800">Monthly paid revenue</h2>
                            <p className="mt-2 text-sm text-gray-500">Six-month collections trend based on paid invoices.</p>
                        </div>
                        <div className="rounded-2xl bg-[#faf9f6] px-4 py-3 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Patients billed</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.totalPatientsBilled}</p>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-6 gap-3">
                        {metrics.revenueTrend.map((item) => {
                            const height = `${Math.max((item.value / revenueMax) * 100, item.value > 0 ? 14 : 4)}%`;
                            return (
                                <div key={item.fullLabel} className="flex flex-col items-center">
                                    <div className="flex h-64 w-full items-end justify-center rounded-3xl bg-[#faf9f6] px-3 py-4">
                                        <div
                                            className="w-full rounded-2xl bg-gradient-to-t from-[#8f8167] to-[#d6c6a7] transition-all"
                                            style={{ height }}
                                            title={`${item.fullLabel}: ${formatCurrency(item.value)}`}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{item.label}</p>
                                    <p className="mt-1 text-xs text-gray-500">{formatCurrency(item.value)}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Attention Queue</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800">What needs action</h2>
                    <div className="mt-6 space-y-4">
                        {metrics.attentionItems.map((item) => (
                            <div key={item.label} className="rounded-3xl border border-gray-100 bg-[#faf9f6] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                                        <p className="mt-2 text-sm text-gray-500">{item.detail}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${tonePillClass(item.tone)}`}>
                                        {item.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Schedule Pressure</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-800">Next 7 days</h2>
                            <p className="mt-2 text-sm text-gray-500">Expected appointment volume to help the front desk and branch teams prepare.</p>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-gray-100 bg-[#faf9f6] p-4">
                        <svg viewBox="0 0 420 180" className="h-48 w-full" role="img" aria-label="Upcoming appointment trend">
                            <defs>
                                <linearGradient id="schedule-fill" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#d6c6a7" stopOpacity="0.38" />
                                    <stop offset="100%" stopColor="#d6c6a7" stopOpacity="0.04" />
                                </linearGradient>
                            </defs>
                            <path d={`${linePath} L 404 164 L 16 164 Z`} fill="url(#schedule-fill)" />
                            <path d={linePath} fill="none" stroke="#8f8167" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            {metrics.scheduleTrend.map((item, index, items) => {
                                const x = 16 + ((388 / Math.max(items.length - 1, 1)) * index);
                                const maxValue = Math.max(...items.map((point) => point.value), 1);
                                const y = 16 + 148 - ((item.value / maxValue) * 148);
                                return (
                                    <g key={item.label}>
                                        <circle cx={x} cy={y} r="5.5" fill="#8f8167" />
                                        <text x={x} y="176" textAnchor="middle" fontSize="11" fill="#8c8c8c">
                                            {item.label}
                                        </text>
                                        <text x={x} y={Math.max(y - 12, 14)} textAnchor="middle" fontSize="11" fill="#5f5f5f">
                                            {item.value}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Status Mix</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800">Appointment breakdown</h2>
                    <div className="mt-6 space-y-4">
                        {metrics.statusBreakdown.length ? metrics.statusBreakdown.map((item) => {
                            const total = metrics.statusBreakdown.reduce((sum, status) => sum + status.value, 0);
                            const width = total > 0 ? (item.value / total) * 100 : 0;

                            return (
                                <div key={item.label}>
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                                        <p className="text-sm font-bold text-gray-900">{item.value}</p>
                                    </div>
                                    <div className="h-3 rounded-full bg-[#f1eee9]">
                                        <div className="h-3 rounded-full bg-gradient-to-r from-[#9f8e70] to-[#d6c6a7]" style={{ width: `${width}%` }} />
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-sm text-gray-500">No appointment data available yet.</p>
                        )}
                    </div>
                </section>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Revenue Drivers</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-800">Top services</h2>
                            <p className="mt-2 text-sm text-gray-500">Highest-earning service lines based on paid transactions.</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {metrics.topServices.length ? metrics.topServices.map((service) => (
                            <div key={service.label} className="rounded-3xl border border-gray-100 bg-[#faf9f6] p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold text-gray-800">{service.label}</p>
                                        <p className="mt-1 text-sm text-gray-500">{service.count} paid transaction{service.count === 1 ? '' : 's'}</p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(service.revenue)}</p>
                                </div>
                                <div className="mt-4 h-3 rounded-full bg-white">
                                    <div
                                        className="h-3 rounded-full bg-gradient-to-r from-[#8f8167] to-[#d6c6a7]"
                                        style={{ width: `${clampPercent((service.revenue / serviceMax) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-500">No paid service activity yet.</p>
                        )}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Live Queue</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800">Upcoming appointments</h2>
                    <div className="mt-6 space-y-3">
                        {metrics.upcomingAppointments.length ? metrics.upcomingAppointments.map((appointment) => (
                            <div key={`${appointment.appointment_id}-${appointment.scheduledAt?.toISOString()}`} className="rounded-3xl border border-gray-100 bg-[#faf9f6] p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-gray-800">{appointment.patientName}</p>
                                        <p className="mt-1 text-sm text-gray-500">{appointment.normalizedService}</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-[#b2a58d]">{appointment.normalizedBranch}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-800">{appointment.scheduledAt ? DATE_TIME_LABEL.format(appointment.scheduledAt) : 'TBD'}</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{appointment.normalizedStatus}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-500">No upcoming appointments scheduled.</p>
                        )}
                    </div>
                </section>
            </div>

            <section className="mt-8 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Branch Snapshot</p>
                        <h2 className="mt-2 text-2xl font-bold text-gray-800">Branch performance</h2>
                        <p className="mt-2 text-sm text-gray-500">Use this to compare where collections and patient traffic are concentrated.</p>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[760px]">
                        <div className="grid grid-cols-[minmax(180px,1.3fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_minmax(100px,0.7fr)_minmax(100px,0.7fr)] gap-4 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                            <div>Branch</div>
                            <div className="text-right">Paid Revenue</div>
                            <div className="text-right">Outstanding</div>
                            <div className="text-right">Invoices</div>
                            <div className="text-right">Visits</div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {metrics.branchPerformance.map((branch) => (
                                <div key={branch.label} className="grid grid-cols-[minmax(180px,1.3fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_minmax(100px,0.7fr)_minmax(100px,0.7fr)] items-center gap-4 rounded-3xl border border-gray-100 bg-[#faf9f6] px-4 py-4 text-sm text-gray-700">
                                    <div className="font-bold text-gray-800">{branch.label}</div>
                                    <div className="text-right font-semibold text-gray-900">{formatCurrency(branch.revenue)}</div>
                                    <div className="text-right text-gray-600">{formatCurrency(branch.outstanding)}</div>
                                    <div className="text-right">{branch.invoices}</div>
                                    <div className="text-right">{branch.visits}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const KpiCard = ({ label, value, detail, tone = 'neutral' }) => (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{value}</h2>
        <p className={`mt-3 text-sm ${toneTextClass(tone)}`}>{detail}</p>
    </div>
);

const toneTextClass = (tone) => {
    if (tone === 'positive') return 'text-green-600';
    if (tone === 'warning') return 'text-amber-600';
    if (tone === 'negative') return 'text-red-500';
    return 'text-gray-500';
};

const tonePillClass = (tone) => {
    if (tone === 'positive') return 'bg-green-50 text-green-700';
    if (tone === 'warning') return 'bg-amber-50 text-amber-700';
    if (tone === 'negative') return 'bg-red-50 text-red-600';
    return 'bg-white text-gray-600';
};

export default AdminDashboard;
