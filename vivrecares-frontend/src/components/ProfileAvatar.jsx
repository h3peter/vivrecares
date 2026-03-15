const ProfileAvatar = ({ user, className, textSize = "text-xl" }) => {
    if (!user) return <div className={`bg-gray-200 ${className}`}></div>;

    // Grab whichever photo key exists (some APIs send 'photo', some send 'profile_photo')
    const photoStr = user.profile_photo || user.photo;

    // Strict check: Ignore nulls, empty strings, AND your specific default file names
    const hasPhoto = photoStr && 
                     photoStr !== 'default.png' && 
                     photoStr !== 'default-avatar.png' && 
                     photoStr !== 'null' && 
                     photoStr.trim() !== '';

    if (hasPhoto) {
        return (
            <img 
                src={`http://localhost/vivrecares/assets/${photoStr}`} 
                alt="Profile" 
                className={`object-cover ${className}`} 
                onError={(e) => { e.target.style.display = 'none'; }}
            />
        );
    }

    // Aggressive Name Grabber
    const fullName = user.name || ''; 
    const fName = user.first_name || user.nickname || fullName.split(' ')[0] || '';
    const lName = user.last_name || (fullName.split(' ').length > 1 ? fullName.split(' ').pop() : '') || '';
    
    const firstInitial = fName ? fName.charAt(0).toUpperCase() : '';
    const lastInitial = lName ? lName.charAt(0).toUpperCase() : '';
    const initials = (firstInitial + lastInitial) || 'U'; 

    return (
        <div className={`flex items-center justify-center bg-[#c4ba9d] text-white font-bold tracking-widest ${className} ${textSize}`}>
            {initials}
        </div>
    );
};

export default ProfileAvatar;