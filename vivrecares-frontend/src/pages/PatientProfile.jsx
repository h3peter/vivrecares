import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../components/ProfileAvatar'; // Bringing in your clean avatar component!

const PatientProfile = () => {
  const [patientData, setPatientData] = useState(null);
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
        
        // FIX: We have to dig one level deeper into the .data object
        if (response.data.status === 'success') {
            setPatientData(response.data.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!patientData) return <div className="p-12 text-gray-500 font-light tracking-widest uppercase">Loading Profile...</div>;

  return (
    <div className="p-12 bg-[#f4f4f4] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-light tracking-widest uppercase text-gray-800">User Profile</h2>
          <button className="text-gray-400 hover:text-[#c4ba9d] transition">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* ID Card */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
            
            {/* Swapped the broken image tag for your ProfileAvatar */}
            <ProfileAvatar user={patientData} className="w-24 h-24 rounded-full mb-4 mx-auto" textSize="text-3xl" />
            
            <h4 className="font-bold text-gray-800 text-lg mt-2">{patientData.first_name} {patientData.last_name}</h4>
            <p className="text-[10px] text-[#c4ba9d] font-bold uppercase tracking-widest mb-4">{patientData.sex} • {patientData.age} years old</p>
            <div className="w-full border-t border-gray-50 pt-6 mt-2">
                <p className="text-xs text-gray-500 mb-2">{patientData.address}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{patientData.email}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{patientData.phone}</p>
            </div>
          </div>

          {/* Medical History Card */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
             <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Medical History</span>
             </div>
             <div className="p-8 grid grid-cols-2 gap-y-8 gap-x-6 flex-1">
                {/* Updated the variables to match what the backend actually sends */}
                <InfoBlock label="Allergies" value={patientData.allergies || "None"} />
                <InfoBlock label="Previous Surgery" value={patientData.surgical_procedures || "N/A"} />
                <InfoBlock label="Previous Aesthetic Procedures" value={patientData.aesthetic_procedures || "None"} />
                <InfoBlock label="Current Skin Treatment" value={patientData.current_skin_treatment || "None"} />
             </div>
          </div>
        </div>

        {/* Consultation Notes */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Consultation Notes</span>
          </div>
          <div className="p-8 min-h-[150px] text-gray-600 text-sm leading-relaxed">
             <ul className="list-disc ml-4 space-y-2">
               <li>No previous notes found for this patient.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cleaned up the helper block to match the new typography
const InfoBlock = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">{label}</p>
    <p className="text-sm text-gray-700 font-medium">{value}</p>
  </div>
);

export default PatientProfile;