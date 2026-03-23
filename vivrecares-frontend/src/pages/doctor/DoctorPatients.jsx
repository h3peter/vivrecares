import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from '../../components/ProfileAvatar';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_doctor_patients.php');
                if (res.data.status === 'success') {
                    setPatients(res.data.data || []);
                }
            } catch (error) {
                console.error('Error loading doctor patients', error);
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

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Doctor Workspace</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Patient Records</h1>
                <p className="text-sm text-gray-500 mt-2">Open any patient to review history and add consultation documentation.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by patient name, ID, or phone number"
                        className="w-full lg:w-[30rem] px-4 py-3 rounded-xl border border-gray-200 text-base outline-none focus:border-[#c4ba9d] text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-12 gap-4 mb-4 text-[#b2a58d] text-xs uppercase tracking-[0.18em] font-bold px-4 border-b border-gray-50 pb-4">
                    <div className="col-span-2">Patient ID</div>
                    <div className="col-span-4">Patient</div>
                    <div className="col-span-3">Demographics</div>
                    <div className="col-span-3 text-right">Action</div>
                </div>

                <div className="space-y-3">
                    {currentRows.map((patient) => (
                        <div key={patient.user_id} className="grid grid-cols-12 gap-4 items-center rounded-2xl border border-gray-100 bg-[#faf9f6] p-4">
                            <div className="col-span-2 text-sm font-bold text-gray-700">
                                {String(patient.patient_id).padStart(3, '0')}
                            </div>
                            <div className="col-span-4 flex items-center gap-3">
                                <ProfileAvatar user={patient} className="w-10 h-10 rounded-full border border-gray-100" textSize="text-sm" />
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
                                    className="px-5 py-2.5 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] hover:bg-black transition"
                                >
                                    Open Record
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPatients.length === 0 && (
                    <p className="text-center text-gray-400 italic py-12">No patients matched your search.</p>
                )}
            </div>

            {filteredPatients.length > 0 && (
                <div className="mt-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="bg-white border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#c4ba9d] text-sm text-gray-700"
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPatients;
