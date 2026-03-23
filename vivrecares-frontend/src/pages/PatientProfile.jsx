import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../components/ProfileAvatar';

const PatientProfile = () => {
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${user.id}`);
                if (response.data.status === 'success') {
                    setPatientData(response.data.data);
                    setError('');
                } else {
                    setError(response.data.message || 'Unable to load your profile.');
                }
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                setError('Unable to load your profile right now.');
            }
        };

        fetchProfile();
    }, [navigate]);

    if (error) {
        return <div className="p-12 text-base text-red-600">{error}</div>;
    }

    if (!patientData) {
        return <div className="p-12 text-base text-gray-500 font-medium tracking-[0.18em] uppercase">Loading profile...</div>;
    }

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">My Profile</h1>
                    <p className="text-sm text-gray-500 mt-2">Your personal details and medical history are shown here for easy review.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <ProfileAvatar user={patientData} className="w-28 h-28 rounded-full mb-5 mx-auto" textSize="text-4xl" />
                        <h2 className="font-bold text-gray-800 text-2xl">{patientData.first_name} {patientData.last_name}</h2>
                        <p className="text-sm text-[#c4ba9d] font-bold uppercase tracking-[0.18em] mt-2">
                            {patientData.sex} | {patientData.age} years old
                        </p>
                        <div className="w-full border-t border-gray-50 pt-6 mt-6 space-y-3">
                            <p className="text-base text-gray-600">{patientData.address || 'No address on file'}</p>
                            <p className="text-sm text-gray-500">{patientData.email || 'No email on file'}</p>
                            <p className="text-sm text-gray-500">{patientData.phone || 'No phone on file'}</p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
                            <span className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Medical History</span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8 flex-1">
                            <InfoBlock label="Allergies" value={patientData.allergies || 'None'} />
                            <InfoBlock label="Previous Surgery" value={patientData.surgical_procedures || 'None recorded'} />
                            <InfoBlock label="Aesthetic Procedures" value={patientData.aesthetic_procedures || 'None recorded'} />
                            <InfoBlock label="Current Skin Treatment" value={patientData.current_skin_treatment || 'None recorded'} />
                            <InfoBlock label="Untoward Reactions" value={patientData.untoward_reactions || 'None recorded'} />
                            <InfoBlock label="Medications" value={patientData.medications || 'None recorded'} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
                        <span className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Additional Notes</span>
                    </div>
                    <div className="p-8 min-h-[150px] text-base text-gray-600 leading-relaxed">
                        {patientData.others || 'No additional notes on file.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold mb-2">{label}</p>
        <p className="text-base text-gray-700 font-medium leading-relaxed">{value}</p>
    </div>
);

export default PatientProfile;
