import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar';

const ManagePatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Feature States
    const [showArchived, setShowArchived] = useState(false);
    const [selectedPatients, setSelectedPatients] = useState([]);
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // A helper function to fetch fresh data after an action is completed
    const refreshTable = async () => {
        try {
            const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_all_patients.php?archived=${showArchived ? 1 : 0}`);
            setPatients(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error refreshing patients", error);
        }
    };

    // Fetch patients from API (We will update the PHP later to handle the showArchived toggle)
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                // We pass the archived status to the API
                const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_all_patients.php?archived=${showArchived ? 1 : 0}`);
                if (Array.isArray(res.data)) {
                    setPatients(res.data);
                } else {
                    setPatients([]);
                }
            } catch (error) {
                console.error("Error fetching patients", error);
            }
        };
        fetchPatients();
    }, [showArchived]); // Re-fetch whenever the toggle changes

    // Filter patients based on search
    const filteredPatients = patients.filter(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reset pagination and selection when data changes
    useEffect(() => {
        setCurrentPage(1);
        setSelectedPatients([]);
    }, [searchTerm, showArchived]);

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPatients.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);

    // Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPatients(currentRows.map(p => p.user_id));
        } else {
            setSelectedPatients([]);
        }
    };

    const handleSelectPatient = (id) => {
        setSelectedPatients(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };


    const processArchive = async (userIds) => {
        const action = showArchived ? 'restore' : 'archive';
        const confirmMessage = `Are you sure you want to ${action} the selected patient(s)?`;
        
        if (!window.confirm(confirmMessage)) return;

        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/archive_patient.php', {
                action: action,
                user_ids: userIds
            });

            if (res.data.status === 'success') {
                setSelectedPatients([]); // Clear the checkboxes
                refreshTable(); // Refresh the table automatically
            } else {
                alert(res.data.message || `Failed to ${action} patients.`);
            }
        } catch (error) {
            alert("Network error occurred.");
        }
    };

    const handleBulkArchive = () => {
        processArchive(selectedPatients);
    };

    const handleIndividualArchive = (id) => {
        processArchive([id]);
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen flex flex-col">
            
            {/* Top Header Section */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-wide mb-4">Manage Patients</h1>
                    <div className="flex items-center gap-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search patients..."
                                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 w-72 outline-none focus:border-[#d4af37] text-sm shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Archive Toggle */}
                        <div className="flex bg-gray-200 rounded-lg p-1">
                            <button 
                                onClick={() => setShowArchived(false)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition ${!showArchived ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Active
                            </button>
                            <button 
                                onClick={() => setShowArchived(true)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition ${showArchived ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Archived
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Patient Button */}
                {!showArchived && (
                    <button 
                        onClick={() => navigate('/admin/add-patient')} 
                        className="bg-[#2d2a26] text-[#d4af37] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-black transition duration-300"
                    >
                        + Add Patient
                    </button>
                )}
            </div>

            {/* Bulk Action Bar (Fades in when items are selected) */}
            <div className={`mb-4 flex items-center justify-between bg-white px-6 py-3 rounded-xl border border-[#d4af37]/30 shadow-sm transition-all duration-300 ${selectedPatients.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <span className="text-sm font-medium text-[#d4af37]">{selectedPatients.length} patient(s) selected</span>
                <button 
                    onClick={handleBulkArchive}
                    className="text-xs text-red-600 font-bold uppercase tracking-widest hover:text-red-800 transition"
                >
                    {showArchived ? 'Restore Selected' : 'Archive Selected'}
                </button>
            </div>

            {/* Grid Headers */}
            <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
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

            {/* Patient Rows */}
            <div className="space-y-3 flex-1">
                {currentRows.map(patient => (
                    <div key={patient.user_id} className={`grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-2xl border transition-all ${selectedPatients.includes(patient.user_id) ? 'border-[#d4af37] shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
                        <div className="col-span-1 flex items-center gap-4 pl-2">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                                checked={selectedPatients.includes(patient.user_id)}
                                onChange={() => handleSelectPatient(patient.user_id)}
                            />
                            <span className="text-gray-500 font-medium">{String(patient.patient_id).padStart(3, '0')}</span>
                        </div>
                        
                        <div className="col-span-3 flex items-center gap-4">
                            <ProfileAvatar user={patient} className="w-10 h-10 rounded-full border border-gray-100" textSize="text-sm" />
                            <div className="truncate">
                                <p className="text-gray-800 font-bold text-sm truncate">{patient.first_name} {patient.last_name}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{patient.sex} • {patient.age} YRS</p>
                            </div>
                        </div>
                        
                        <div className="col-span-3 text-gray-600 text-sm truncate pr-4">{patient.address}</div>
                        
                        <div className="col-span-3 text-gray-600 text-sm">{patient.phone}</div>
                        
                        <div className="col-span-2 flex justify-center gap-4 text-gray-400">
                            {/* View Button */}
                            <button onClick={() => navigate(`/admin/patient/${patient.user_id}`)} className="hover:text-blue-500 transition tooltip" title="View Profile">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            {/* Edit Button */}
                            <button className="hover:text-[#d4af37] transition" title="Edit">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            {/* Archive Button */}
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
                    <div className="text-center p-12 text-gray-400 italic bg-white rounded-3xl border border-gray-100">
                        No {showArchived ? 'archived' : 'active'} patients found.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredPatients.length > 0 && (
                <div className="mt-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <span>Rows per page:</span>
                        <select 
                            className="bg-white border border-gray-200 rounded p-1 outline-none focus:border-[#d4af37]"
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
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePatients;