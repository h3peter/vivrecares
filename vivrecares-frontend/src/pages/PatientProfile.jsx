import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PatientProfile = () => {
  const [patientData, setPatientData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch full profile from backend using JOIN logic
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${user.id}`);
        setPatientData(response.data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!patientData) return <div className="p-10">Loading Profile...</div>;

  return (
    <div className="flex min-h-screen bg-[#faf9f6] font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-[#4d4d4d] text-white flex flex-col items-center py-12 px-6">
        <div className="w-32 h-32 rounded-full border-4 border-[#d4af37] overflow-hidden mb-6">
          <img src={`http://localhost/vivrecares/assets/${patientData.profile_photo}`} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-lg font-light tracking-widest text-center mb-12">
          Good day, <br/> 
          <span className="font-bold">{patientData.nickname || patientData.first_name}!</span>
        </h3>

        <nav className="w-full space-y-2">
          <SidebarLink label="Patient Profile" active />
          <button 
  onClick={() => navigate('/request-appointment')}
  className="w-full text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-300 hover:text-white"
>
  Request for Appointment
</button>
          <button 
  onClick={() => navigate('/appointment-history')}
  className="w-full text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-300 hover:text-white"
>
  Appointment History
</button>
          <button 
  onClick={() => navigate('/account-settings')}
  className="w-full text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-300 hover:text-white"
>
  Account Settings
</button>
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-light tracking-widest uppercase text-gray-800">User Profile</h2>
            <button className="text-gray-400 hover:text-[#d4af37] transition">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* ID Card */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <img src={`http://localhost/vivrecares/assets/${patientData.profile_photo}`} className="w-24 h-24 rounded-full mb-4 border border-gray-50" alt="" />
              <h4 className="font-bold text-gray-800">{patientData.first_name} {patientData.last_name}</h4>
              <p className="text-xs text-gray-400 uppercase tracking-tighter mb-4">{patientData.sex} • {patientData.age} years old</p>
              <p className="text-xs text-gray-500 mb-6">{patientData.address}</p>
              <div className="text-[10px] text-gray-400 border-t pt-4 w-full">
                <p>{patientData.email}</p>
                <p>{patientData.phone}</p>
              </div>
            </div>

            {/* Medical History Card */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="bg-[#fcfaf5] px-6 py-3 border-b border-gray-100">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold">Medical History</span>
               </div>
               <div className="p-6 grid grid-cols-2 gap-6">
                  <InfoBlock label="Allergies" value={patientData.illnesses || "None"} />
                  <InfoBlock label="Previous Surgery" value={patientData.surgical_procedures || "N/A"} />
                  <InfoBlock label="Previous Aesthetic Procedures" value={patientData.aesthetic_procedures || "None"} />
                  <InfoBlock label="Current Skin Treatment" value={patientData.current_treatments || "None"} />
               </div>
            </div>
          </div>

          {/* Consultation Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#fcfaf5] px-6 py-3 border-b border-gray-100">
                <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold">Consultation Notes</span>
            </div>
            <div className="p-8 min-h-[200px] text-gray-600 text-sm leading-relaxed">
               {/* This will come from a different table later */}
               <ul className="list-disc ml-4 space-y-2">
                 <li>No previous notes found for this patient.</li>
               </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SidebarLink = ({ label, active }) => (
  <button className={`w-full text-left px-4 py-3 text-xs uppercase tracking-widest transition-all ${active ? 'bg-[#5c5c5c] text-[#d4af37] border-b-2 border-[#d4af37]' : 'text-gray-300 hover:text-white'}`}>
    {label}
  </button>
);

const InfoBlock = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{label}</p>
    <p className="text-sm text-gray-700">{value}</p>
  </div>
);

export default PatientProfile;