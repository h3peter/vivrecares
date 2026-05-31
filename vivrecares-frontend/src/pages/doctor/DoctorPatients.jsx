import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '../../components/ProfileAvatar';
import { TableRowsSkeleton } from '../../components/PageSkeleton';
import { downloadCsvReport } from '../../utils/reportExports';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const res = await axios.get('/get_doctor_patients.php');
                if (res.data.status === 'success') {
                    setPatients(res.data.data || []);
                }
            } catch (error) {
                console.error('Error loading doctor patients', error);
            } finally {
                setLoading(false);
            }
        };
        loadPatients();
    }, []);

    const filteredPatients = useMemo(
        () => patients.filter((patient) =>
            `${patient.first_name} ${patient.last_name} ${patient.patient_id} ${patient.phone || ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        ),
        [patients, searchTerm]
    );

    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPatients.slice(indexOfFirstRow, indexOfLastRow);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);

    const handleExport = () => {
        downloadCsvReport({
            filename: 'doctor_patients.csv',
            columns: [
                { key: 'patient_id', label: 'Patient ID' },
                { key: 'name', label: 'Patient' },
                { key: 'phone', label: 'Phone' },
                { key: 'sex', label: 'Sex' },
                { key: 'age', label: 'Age' },
            ],
            rows: filteredPatients.map((patient) => ({
                ...patient,
                name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
            })),
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Doctor Workspace</p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Patient Records</h1>
                        <p className="mt-2 text-sm text-gray-500">Open any patient to review history and add consultation documentation.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-700 transition hover:border-gray-500 lg:w-auto"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by patient name, ID, or phone number"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-700 outline-none focus:border-[#c4ba9d] lg:w-[30rem]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="mb-4 hidden grid-cols-12 gap-4 border-b border-gray-50 px-4 pb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d] lg:grid">
                    <div className="col-span-2">Patient ID</div>
                    <div className="col-span-4">Patient</div>
                    <div className="col-span-3">Demographics</div>
                    <div className="col-span-3 text-right">Action</div>
                </div>

                <div className="space-y-3 readable-data-table">
                    {loading ? (
                        <TableRowsSkeleton rows={5} columns={4} />
                    ) : currentRows.map((patient) => (
                        <div key={patient.user_id}>
                            <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 lg:hidden">
                                <div className="flex items-start gap-3">
                                    <ProfileAvatar user={patient} className="h-12 w-12 rounded-full border border-gray-100" textSize="text-sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-bold text-gray-800">{patient.first_name} {patient.last_name}</p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                                            ID {String(patient.patient_id).padStart(3, '0')}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">{patient.phone || 'No phone number'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                    <InfoBlock label="Demographics" value={`${patient.sex || 'N/A'} | ${patient.age || 'N/A'} yrs`} />
                                </div>

                                <button
                                    onClick={() => navigate(`/doctor/patient/${patient.user_id}`)}
                                    className="mt-4 w-full rounded-xl bg-[#555555] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] transition hover:bg-black"
                                >
                                    Open Record
                                </button>
                            </div>

                            <div className="hidden grid-cols-12 items-center gap-4 rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:grid">
                                <div className="col-span-2 text-sm font-bold text-gray-700">
                                    {String(patient.patient_id).padStart(3, '0')}
                                </div>
                                <div className="col-span-4 flex items-center gap-3">
                                    <ProfileAvatar user={patient} className="h-10 w-10 rounded-full border border-gray-100" textSize="text-sm" />
                                    <div>
                                        <p className="text-base font-bold text-gray-800">{patient.first_name} {patient.last_name}</p>
                                        <p className="text-xs text-gray-400">{patient.phone || 'No phone number'}</p>
                                    </div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-600">
                                    {patient.sex || 'N/A'} | {patient.age || 'N/A'} yrs
                                </div>
                                <div className="col-span-3 text-right">
                                    <button
                                        onClick={() => navigate(`/doctor/patient/${patient.user_id}`)}
                                        className="rounded-xl bg-[#555555] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] transition hover:bg-black"
                                    >
                                        Open Record
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && filteredPatients.length === 0 && (
                    <p className="py-12 text-center italic text-gray-400">No patients matched your search.</p>
                )}
            </div>

            {!loading && filteredPatients.length > 0 && (
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
);

export default DoctorPatients;
