import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar';
import { downloadCsvReport } from '../../utils/reportExports';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'az', label: 'Name A-Z' },
    { value: 'za', label: 'Name Z-A' },
];

const ManagePatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('newest');

    const formatCreatedAt = (value) => {
        if (!value) return 'Recently added';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Recently added';
        return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const refreshTable = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/get_all_patients.php?archived=${showArchived ? 1 : 0}`);
            setPatients(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error refreshing patients', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/get_all_patients.php?archived=${showArchived ? 1 : 0}`);
                setPatients(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error('Error fetching patients', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [showArchived]);

    const parseSortableDate = (value) => {
        if (!value) return 0;
        const normalized = String(value).replace(' ', 'T');
        const parsed = new Date(normalized).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const filteredPatients = patients
        .filter((patient) =>
            [
                patient.first_name,
                patient.last_name,
                patient.email,
                patient.patient_id,
                patient.phone,
                patient.address,
                patient.sex,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'az' || sortBy === 'za') {
                const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                const diff = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
                return sortBy === 'az' ? diff : -diff;
            }

            const aTime = parseSortableDate(a.created_at);
            const bTime = parseSortableDate(b.created_at);
            const dateDiff = sortBy === 'oldest' ? aTime - bTime : bTime - aTime;
            if (dateDiff !== 0) return dateDiff;

            const aUser = Number(a.user_id || 0);
            const bUser = Number(b.user_id || 0);
            return sortBy === 'oldest' ? aUser - bUser : bUser - aUser;
        });

    useEffect(() => {
        setCurrentPage(1);
        setSelectedPatients([]);
    }, [searchTerm, showArchived, sortBy]);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPatients.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / rowsPerPage));

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPatients(currentRows.map((patient) => patient.user_id));
        } else {
            setSelectedPatients([]);
        }
    };

    const handleSelectPatient = (id) => {
        setSelectedPatients((prev) =>
            prev.includes(id) ? prev.filter((patientId) => patientId !== id) : [...prev, id]
        );
    };

    const processArchive = async (userIds) => {
        const action = showArchived ? 'restore' : 'archive';
        const confirmMessage = `Are you sure you want to ${action} the selected patient(s)?`;

        if (!window.confirm(confirmMessage)) return;

        try {
            const res = await axios.post('/archive_patient.php', {
                action,
                user_ids: userIds,
            });

            if (res.data.status === 'success') {
                setSelectedPatients([]);
                refreshTable();
            } else {
                alert(res.data.message || `Failed to ${action} patients.`);
            }
        } catch (error) {
            alert('Network error occurred.');
        }
    };

    const handleBulkArchive = () => {
        processArchive(selectedPatients);
    };

    const handleIndividualArchive = (id) => {
        processArchive([id]);
    };

    const handleExport = () => {
        downloadCsvReport({
            filename: `patients_${showArchived ? 'archived' : 'active'}.csv`,
            columns: [
                { key: 'patient_id', label: 'Patient ID' },
                { key: 'name', label: 'Patient' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'sex', label: 'Sex' },
                { key: 'age', label: 'Age' },
                { key: 'address', label: 'Address' },
                { key: 'created_at', label: 'Added' },
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
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Patient Registry</p>
                <div className="flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Manage Patients</h1>
                            <p className="mt-2 text-sm text-gray-500">Search, sort, and manage active or archived patient records from one workspace.</p>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:justify-end">
                            {!showArchived && (
                            <button
                                onClick={() => navigate('/admin/add-patient')}
                                className="w-full rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] sm:w-auto"
                            >
                                + Add Patient
                            </button>
                            )}
                            <button
                                type="button"
                                onClick={handleExport}
                                className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-700 transition hover:border-gray-500 sm:w-auto"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_auto_auto] xl:items-end">
                        <div className="relative w-full">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Search Patients</label>
                            <div className="relative">
                                <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0 1 14 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by patient, email, phone, ID, address, or sex..."
                                    className="w-full rounded-2xl border border-gray-200 py-3.5 pl-11 pr-4 text-base text-gray-700 shadow-sm outline-none focus:border-[#d4af37]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">View</label>
                            <div className="flex w-full rounded-lg bg-gray-200 p-1 sm:w-auto">
                                <button
                                    onClick={() => setShowArchived(false)}
                                    className={`flex-1 rounded-md px-4 py-2.5 text-sm font-bold uppercase tracking-[0.18em] transition sm:flex-none ${!showArchived ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setShowArchived(true)}
                                    className={`flex-1 rounded-md px-4 py-2.5 text-sm font-bold uppercase tracking-[0.18em] transition sm:flex-none ${showArchived ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Archived
                                </button>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Sort</label>
                            <select
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 outline-none focus:border-[#d4af37] sm:w-auto"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`mb-5 flex flex-col gap-3 rounded-2xl border border-[#d4af37]/30 bg-white px-4 py-4 shadow-sm transition-all duration-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${selectedPatients.length > 0 ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'}`}>
                <span className="text-base font-semibold text-[#a8892d]">{selectedPatients.length} patient(s) selected</span>
                <button
                    onClick={handleBulkArchive}
                    className="text-left text-sm font-bold uppercase tracking-[0.18em] text-red-600 transition hover:text-red-800 sm:text-right"
                >
                    {showArchived ? 'Restore Selected' : 'Archive Selected'}
                </button>
            </div>

            <div className="mb-2 hidden grid-cols-12 gap-4 border-b border-gray-200 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-500 xl:grid">
                <div className="col-span-1 flex items-center gap-4">
                    <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[#d4af37]"
                        onChange={handleSelectAll}
                        checked={selectedPatients.length === currentRows.length && currentRows.length > 0}
                    />
                    ID
                </div>
                <div className="col-span-3">Patient</div>
                <div className="col-span-3">Address</div>
                <div className="col-span-3">Phone No.</div>
                <div className="col-span-2 text-center">Actions</div>
            </div>

            <div className="space-y-3 readable-data-table xl:space-y-0 xl:overflow-hidden xl:border-y xl:border-gray-200 xl:bg-white">
                {loading ? Array.from({ length: Math.max(3, Math.min(rowsPerPage, 5)) }).map((_, index) => (
                    <PatientRowSkeleton key={index} />
                )) : currentRows.map((patient) => (
                    <div key={patient.user_id}>
                        <div className={`rounded-[1.4rem] border bg-white p-4 shadow-sm transition-all sm:p-5 xl:hidden ${selectedPatients.includes(patient.user_id) ? 'border-[#d4af37] shadow-md' : 'border-gray-100'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 cursor-pointer accent-[#d4af37]"
                                        checked={selectedPatients.includes(patient.user_id)}
                                        onChange={() => handleSelectPatient(patient.user_id)}
                                    />
                                    <ProfileAvatar user={patient} className="h-12 w-12 rounded-full border border-gray-100" textSize="text-base" />
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-bold text-gray-800">{patient.first_name} {patient.last_name}</p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                                            ID {String(patient.patient_id).padStart(3, '0')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-gray-400">
                                    <button onClick={() => navigate(`/admin/patient/${patient.user_id}`)} className="transition hover:text-blue-500" title="View Profile">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 0 1 6 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/edit-patient/${patient.user_id}`)}
                                        className="transition hover:text-[#d4af37]"
                                        title="Edit Patient"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => handleIndividualArchive(patient.user_id)} className="transition hover:text-red-500" title={showArchived ? 'Restore' : 'Archive'}>
                                        {showArchived ? (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-[#faf9f6] p-4 sm:grid-cols-2">
                                <InfoBlock label="Profile" value={`${patient.sex || 'Unknown'} | ${patient.age || 'N/A'} yrs`} />
                                <InfoBlock label="Email" value={patient.email || 'No email on file'} />
                                <InfoBlock label="Phone" value={patient.phone || 'No phone on file'} />
                                <InfoBlock label="Address" value={patient.address || 'No address on file'} />
                                <InfoBlock label="Added" value={formatCreatedAt(patient.created_at)} />
                            </div>
                        </div>

                        <div className={`hidden grid-cols-12 gap-4 items-center border-b px-5 py-3 transition-colors xl:grid ${selectedPatients.includes(patient.user_id) ? 'border-[#d4af37] bg-[#fffdf5]' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                            <div className="col-span-1 flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 cursor-pointer accent-[#d4af37]"
                                    checked={selectedPatients.includes(patient.user_id)}
                                    onChange={() => handleSelectPatient(patient.user_id)}
                                />
                                <span className="text-base font-semibold text-gray-500">{String(patient.patient_id).padStart(3, '0')}</span>
                            </div>

                            <div className="col-span-3 flex items-center gap-3">
                                <ProfileAvatar user={patient} className="h-10 w-10 rounded-full border border-gray-100" textSize="text-sm" />
                                <div className="truncate">
                                    <p className="truncate text-base font-bold text-gray-800">{patient.first_name} {patient.last_name}</p>
                                    <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-gray-600">
                                        {patient.sex} | {patient.age} yrs | Added {formatCreatedAt(patient.created_at)}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-gray-500">{patient.email || 'No email on file'}</p>
                                </div>
                            </div>

                            <div className="col-span-3 truncate pr-4 text-sm text-gray-700">{patient.address || 'No address on file'}</div>
                            <div className="col-span-3 text-sm text-gray-700">{patient.phone || 'No phone on file'}</div>

                            <div className="col-span-2 flex justify-center gap-4 text-gray-500">
                                <button onClick={() => navigate(`/admin/patient/${patient.user_id}`)} className="transition hover:text-blue-500" title="View Profile">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 0 1 6 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/edit-patient/${patient.user_id}`)}
                                    className="transition hover:text-[#d4af37]"
                                    title="Edit Patient"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => handleIndividualArchive(patient.user_id)} className="transition hover:text-red-500" title={showArchived ? 'Restore' : 'Archive'}>
                                    {showArchived ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" /></svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && filteredPatients.length === 0 && (
                    <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-base italic text-gray-400">
                        No {showArchived ? 'archived' : 'active'} patients found.
                    </div>
                )}
            </div>

            {!loading && filteredPatients.length > 0 && (
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#d4af37]"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
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
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
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

const PatientRowSkeleton = () => (
    <div>
        <div className="rounded-[1.4rem] border border-gray-100 bg-white p-4 shadow-sm xl:hidden animate-pulse">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="mt-1 h-4 w-4 rounded bg-gray-200" />
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="min-w-0 space-y-2">
                        <div className="h-4 w-36 rounded-full bg-gray-200" />
                        <div className="h-3 w-20 rounded-full bg-gray-100" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="h-5 w-5 rounded bg-gray-200" />
                    <div className="h-5 w-5 rounded bg-gray-200" />
                    <div className="h-5 w-5 rounded bg-gray-200" />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-[#faf9f6] p-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index}>
                        <div className="h-3 w-20 rounded-full bg-gray-200" />
                        <div className="mt-2 h-4 w-28 rounded-full bg-gray-100" />
                    </div>
                ))}
            </div>
        </div>

        <div className="hidden grid-cols-12 gap-4 items-center rounded-[1.4rem] border border-gray-100 bg-white p-5 shadow-sm xl:grid animate-pulse">
            <div className="col-span-1 flex items-center gap-4 pl-2">
                <div className="h-4 w-4 rounded bg-gray-200" />
                <div className="h-4 w-10 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-3 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="space-y-2">
                    <div className="h-4 w-40 rounded-full bg-gray-200" />
                    <div className="h-3 w-32 rounded-full bg-gray-100" />
                </div>
            </div>
            <div className="col-span-3">
                <div className="h-4 w-40 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-3">
                <div className="h-4 w-28 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-2 flex justify-center gap-4">
                <div className="h-5 w-5 rounded bg-gray-200" />
                <div className="h-5 w-5 rounded bg-gray-200" />
                <div className="h-5 w-5 rounded bg-gray-200" />
            </div>
        </div>
    </div>
);

export default ManagePatients;
