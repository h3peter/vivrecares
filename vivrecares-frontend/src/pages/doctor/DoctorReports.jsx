import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { downloadCsvReport, printTableReport } from '../../utils/reportExports';

const DoctorReports = () => {
    const [analytics, setAnalytics] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [visitSummary, setVisitSummary] = useState([]);

    const loadAnalytics = async () => {
        try {
            const [analyticsRes, patientsRes] = await Promise.all([
                axios.get('/get_clinical_analytics.php'),
                axios.get('/get_doctor_patients.php'),
            ]);
            if (analyticsRes.data.status === 'success') setAnalytics(analyticsRes.data);
            if (patientsRes.data.status === 'success') setPatients(patientsRes.data.data || []);
        } catch (error) {
            console.error('Error loading clinical reports', error);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    useEffect(() => {
        const loadSummary = async () => {
            if (!selectedPatientId) {
                setVisitSummary([]);
                return;
            }
            try {
                const res = await axios.get(`/get_patient_visit_summary.php?patient_id=${selectedPatientId}`);
                if (res.data.status === 'success') {
                    setVisitSummary(res.data.data || []);
                }
            } catch (error) {
                console.error('Error loading visit summary', error);
            }
        };
        loadSummary();
    }, [selectedPatientId]);

    const selectedPatientLabel = useMemo(() => {
        const p = patients.find((patient) => String(patient.patient_id) === String(selectedPatientId));
        if (!p) return '';
        return `${String(p.patient_id).padStart(3, '0')} - ${p.first_name} ${p.last_name}`;
    }, [patients, selectedPatientId]);

    const visitSummaryColumns = [
        { key: 'appointment_date', label: 'Date' },
        { key: 'appointment_time', label: 'Time' },
        { key: 'status', label: 'Status' },
        { key: 'appointment_type', label: 'Visit Type' },
        { key: 'branch', label: 'Branch' },
        { key: 'concerns', label: 'Concern' },
        { key: 'latest_diagnosis', label: 'Latest Diagnosis' },
        { key: 'latest_treatment_plan', label: 'Latest Plan' },
    ];

    const visitSummaryRows = visitSummary.map((visit) => ({
        appointment_date: visit.appointment_date || 'N/A',
        appointment_time: visit.appointment_time || 'N/A',
        status: visit.status || 'N/A',
        appointment_type: visit.appointment_type || 'Consultation',
        branch: visit.branch || 'N/A',
        concerns: visit.concerns || 'None',
        latest_diagnosis: visit.latest_diagnosis || 'Not documented',
        latest_treatment_plan: visit.latest_treatment_plan || 'Not documented',
    }));

    const handleExportVisitSummary = () => {
        if (!selectedPatientId || visitSummaryRows.length === 0) return;
        downloadCsvReport({
            filename: `patient_visit_summary_${selectedPatientId}.csv`,
            columns: visitSummaryColumns,
            rows: visitSummaryRows,
        });
    };

    const handlePrintVisitSummary = () => {
        if (!selectedPatientId) return;
        printTableReport({
            title: 'Patient Visit Summary',
            subtitle: selectedPatientLabel ? `Patient: ${selectedPatientLabel}` : 'Selected patient visit report',
            columns: visitSummaryColumns,
            rows: visitSummaryRows,
            meta: [
                { label: 'Patient', value: selectedPatientLabel || 'Not selected' },
                { label: 'Total Visits', value: visitSummaryRows.length },
                { label: 'Completed Visits', value: visitSummaryRows.filter((visit) => visit.status === 'Completed').length },
            ],
        });
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Doctor Workspace</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Clinical Reports</h1>
                <p className="text-sm text-gray-500 mt-2">Review non-financial clinical trends and generate patient visit summaries.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <Metric label="Total Visits" value={analytics?.summary?.total_visits ?? 0} />
                <Metric label="Confirmed" value={analytics?.summary?.confirmed_visits ?? 0} />
                <Metric label="Completed" value={analytics?.summary?.completed_visits ?? 0} />
                <Metric label="Pending" value={analytics?.summary?.pending_visits ?? 0} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-8">
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-800">Top Consultation Topics</h2>
                    <div className="mt-6 space-y-3">
                        {(analytics?.appointment_topics || []).map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
                                <span className="text-sm text-gray-700">{row.label || 'General Consultation'}</span>
                                <span className="text-sm font-bold text-gray-800">{row.total}</span>
                            </div>
                        ))}
                        {(!analytics?.appointment_topics || analytics.appointment_topics.length === 0) && (
                            <p className="text-sm text-gray-400 italic">No topic analytics yet.</p>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mt-10">Service Trends</h2>
                    <div className="mt-6 space-y-3">
                        {(analytics?.service_trends || []).map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
                                <span className="text-sm text-gray-700">{row.label || 'Service'}</span>
                                <span className="text-sm font-bold text-gray-800">{row.total}</span>
                            </div>
                        ))}
                        {(!analytics?.service_trends || analytics.service_trends.length === 0) && (
                            <p className="text-sm text-gray-400 italic">No service trends yet.</p>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Patient Visit Summary</h2>
                            <p className="text-sm text-gray-500 mt-2">Choose a patient to review their longitudinal visit trail and clinical outcomes.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handlePrintVisitSummary}
                                disabled={!selectedPatientId}
                                className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#c4ba9d] hover:text-[#8f8167] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Print Summary
                            </button>
                            <button
                                onClick={handleExportVisitSummary}
                                disabled={!selectedPatientId || visitSummaryRows.length === 0}
                                className="px-5 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">Patient</label>
                        <select
                            className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">Select patient</option>
                            {patients.map((patient) => (
                                <option key={patient.patient_id} value={patient.patient_id}>
                                    {String(patient.patient_id).padStart(3, '0')} - {patient.first_name} {patient.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedPatientId && (
                        <p className="mt-3 text-sm text-gray-600">
                            Showing summary for <span className="font-bold text-gray-800">{selectedPatientLabel}</span>
                        </p>
                    )}

                    <div className="mt-6 space-y-3 max-h-[34rem] overflow-y-auto">
                        {visitSummary.map((visit) => (
                            <div key={visit.appointment_id} className="rounded-xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-gray-800">
                                        {visit.appointment_date} {visit.appointment_time}
                                    </p>
                                    <span className="text-xs uppercase tracking-[0.18em] text-[#b2a58d] font-bold">{visit.status}</span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{visit.appointment_type || 'Consultation'} | {visit.branch || 'N/A'}</p>
                                <p className="text-xs text-gray-500 mt-2"><span className="font-bold">Concern:</span> {visit.concerns || 'None'}</p>
                                <p className="text-xs text-gray-500 mt-1"><span className="font-bold">Latest Diagnosis:</span> {visit.latest_diagnosis || 'Not documented'}</p>
                                <p className="text-xs text-gray-500 mt-1"><span className="font-bold">Latest Plan:</span> {visit.latest_treatment_plan || 'Not documented'}</p>
                            </div>
                        ))}
                        {selectedPatientId && visitSummary.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No visit summary data for this patient yet.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

const Metric = ({ label, value }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</p>
        <h3 className="text-4xl font-bold text-[#c4ba9d] mt-3">{value}</h3>
    </div>
);

export default DoctorReports;
