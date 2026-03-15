import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar';

const ManagePatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_all_patients.php');
                if (Array.isArray(res.data)) {
                    setPatients(res.data);
                }
            } catch (error) {
                console.error("Error fetching patients", error);
            }
        };
        fetchPatients();
    }, []);

    // Filter patients based on search
    const filteredPatients = patients.filter(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reset to page 1 whenever the user types in the search bar
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPatients.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredPatients.length / rowsPerPage);

    // Navigation Handlers
    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen flex flex-col">
            <div className="flex justify-between items-end mb-8">
                {/* Search Bar */}
                <div>
                    <label className="text-sm text-gray-800 mb-2 block">Search:</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 w-64 outline-none focus:border-[#b2a58d]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <button className="bg-[#c4ba9d] text-white px-6 py-2 rounded-md text-sm hover:bg-[#b2a58d] shadow-sm transition">
                    + Add Patient
                </button>
            </div>

            {/* Table Headers */}
            <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-[#b2a58d] text-sm tracking-wide">
                <div className="col-span-1">ID</div>
                <div className="col-span-4">Patient</div>
                <div className="col-span-3">Address</div>
                <div className="col-span-3">Phone No.</div>
                <div className="col-span-1 text-center"></div>
            </div>

            {/* Patient List (Now using currentRows instead of filteredPatients) */}
            <div className="space-y-4 flex-1">
                {currentRows.map(patient => (
                    <div key={patient.patient_id} className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <div className="col-span-1 text-gray-800 font-medium pl-2">
                            {String(patient.patient_id).padStart(3, '0')}
                        </div>
                        <div className="col-span-4 flex items-center gap-4">
                            <ProfileAvatar 
                                user={patient} 
                                className="w-12 h-12 rounded-full border border-gray-200" 
                                textSize="text-lg" 
                            />
                            <div>
                                <p className="text-gray-800 font-medium">{patient.last_name}, {patient.first_name}</p>
                                <p className="text-xs text-gray-400">{patient.sex} • {patient.age} years old</p>
                            </div>
                        </div>
                        <div className="col-span-3 text-gray-600 text-sm truncate pr-4">
                            {patient.address}
                        </div>
                        <div className="col-span-3 text-gray-600 text-sm">
                            {patient.phone}
                        </div>
                        <div className="col-span-1 flex justify-center gap-3 text-gray-400">
                            <button onClick={() => navigate(`/admin/patient/${patient.user_id}`)} className="hover:text-[#b2a58d] transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button className="hover:text-red-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                    </div>
                ))}
                
                {filteredPatients.length === 0 && (
                    <div className="text-center p-8 text-gray-400 italic bg-white rounded-3xl border border-gray-100">
                        No patients found.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredPatients.length > 0 && (
                <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Rows per page:</span>
                        <select 
                            className="border border-gray-200 rounded p-1 outline-none focus:border-[#b2a58d]"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Reset to page 1 when changing row count
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        
                        <div className="flex gap-2">
                            {/* First Page */}
                            <button 
                                onClick={goToFirstPage} 
                                disabled={currentPage === 1}
                                className="p-2 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="First Page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                            </button>
                            {/* Previous Page */}
                            <button 
                                onClick={goToPrevPage} 
                                disabled={currentPage === 1}
                                className="p-2 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Previous"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            {/* Next Page */}
                            <button 
                                onClick={goToNextPage} 
                                disabled={currentPage === totalPages}
                                className="p-2 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Next"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            {/* Last Page */}
                            <button 
                                onClick={goToLastPage} 
                                disabled={currentPage === totalPages}
                                className="p-2 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                title="Last Page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePatients;