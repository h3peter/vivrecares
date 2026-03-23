import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar';

const ManagePatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const formatCreatedAt = (value) => {
        if (!value) return 'Recently added';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'Recently added';
        return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const refreshTable = async () => {
        try {
            const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_all_patients.php?archived=${showArchived ? 1 : 0}`);
            setPatients(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error refreshing patients', error);
        }
    };

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_all_patients.php?archived=${showArchived ? 1 : 0}`);
                setPatients(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error('Error fetching patients', error);
            }
        };

        fetchPatients();
    }, [showArchived]);

    const filteredPatients = patients.filter((patient) =>
        [
            patient.first_name,
            patient.last_name,
            patient.patient_id,
            patient.phone,
            patient.address,
            patient.sex,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
        setSelectedPatients([]);
    }, [searchTerm, showArchived]);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPatients.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);

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
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/archive_patient.php', {
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

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen flex flex-col">
            <div className="flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-end mb-8">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Registry</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight mb-3">Manage Patients</h1>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                        <div className="relative max-w-xl w-full">
                            <input
                                type="text"
                                placeholder="Search by patient, phone, ID, address, or sex..."
                                className="pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 w-full lg:w-[26rem] outline-none focus:border-[#d4af37] text-base text-gray-700 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        <div className="flex bg-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => setShowArchived(false)}
                                className={`px-5 py-2.5 text-sm font-bold uppercase tracking-[0.18em] rounded-md transition ${!showArchived ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setShowArchived(true)}
                                className={`px-5 py-2.5 text-sm font-bold uppercase tracking-[0.18em] rounded-md transition ${showArchived ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Archived
                            </button>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                        Showing {filteredPatients.length} {showArchived ? 'archived' : 'active'} patients, newest records first.
                    </p>
                </div>

                {!showArchived && (
                    <button
                        onClick={() => navigate('/admin/add-patient')}
                        className="bg-[#2d2a26] text-[#d4af37] px-6 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-black transition duration-300"
                    >
                        + Add Patient
                    </button>
                )}
            </div>

            <div className={`mb-5 flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-[#d4af37]/30 shadow-sm transition-all duration-300 ${selectedPatients.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <span className="text-base font-semibold text-[#a8892d]">{selectedPatients.length} patient(s) selected</span>
                <button
                    onClick={handleBulkArchive}
                    className="text-sm text-red-600 font-bold uppercase tracking-[0.18em] hover:text-red-800 transition"
                >
                    {showArchived ? 'Restore Selected' : 'Archive Selected'}
                </button>
            </div>

            <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-gray-400 text-sm font-bold uppercase tracking-[0.18em]">
                <div className="col-span-1 flex items-center gap-4">
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#d4af37] cursor-pointer"
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

            <div className="space-y-3 flex-1">
                {currentRows.map((patient) => (
                    <div key={patient.user_id} className={`grid grid-cols-12 gap-4 items-center bg-white p-5 rounded-[1.4rem] border transition-all ${selectedPatients.includes(patient.user_id) ? 'border-[#d4af37] shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
                        <div className="col-span-1 flex items-center gap-4 pl-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                                checked={selectedPatients.includes(patient.user_id)}
                                onChange={() => handleSelectPatient(patient.user_id)}
                            />
                            <span className="text-gray-500 font-semibold text-base">{String(patient.patient_id).padStart(3, '0')}</span>
                        </div>

                        <div className="col-span-3 flex items-center gap-4">
                            <ProfileAvatar user={patient} className="w-12 h-12 rounded-full border border-gray-100" textSize="text-base" />
                            <div className="truncate">
                                <p className="text-gray-800 font-bold text-base truncate">{patient.first_name} {patient.last_name}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-[0.18em] mt-1">
                                    {patient.sex} | {patient.age} yrs | Added {formatCreatedAt(patient.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="col-span-3 text-gray-600 text-base truncate pr-4">{patient.address || 'No address on file'}</div>
                        <div className="col-span-3 text-gray-600 text-base">{patient.phone || 'No phone on file'}</div>

                        <div className="col-span-2 flex justify-center gap-4 text-gray-400">
                            <button onClick={() => navigate(`/admin/patient/${patient.user_id}`)} className="hover:text-blue-500 transition tooltip" title="View Profile">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button
                                onClick={() => navigate(`/admin/edit-patient/${patient.user_id}`)}
                                className="hover:text-[#d4af37] transition"
                                title="Edit Patient"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleIndividualArchive(patient.user_id)} className="hover:text-red-500 transition" title={showArchived ? 'Restore' : 'Archive'}>
                                {showArchived ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                ))}

                {filteredPatients.length === 0 && (
                    <div className="text-center p-12 text-base text-gray-400 italic bg-white rounded-3xl border border-gray-100">
                        No {showArchived ? 'archived' : 'active'} patients found.
                    </div>
                )}
            </div>

            {filteredPatients.length > 0 && (
                <div className="mt-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="bg-white border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#d4af37] text-sm text-gray-700"
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

                    <div className="flex items-center gap-6">
                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePatients;
