/**
 * ProfileAvatar.jsx
 *
 * Renders a user's profile photo if one is uploaded,
 * otherwise falls back to a coloured initials badge.
 *
 * Props:
 *   user       — object with { first_name, last_name, profile_photo? }
 *   className  — extra classes for the outer wrapper (size, border, etc.)
 *   textSize   — Tailwind text size for initials, default "text-sm"
 */

import { useEffect, useState } from 'react';
import { profilePhotoFallbackUrl, profilePhotoUrl } from '../utils/api';

const ProfileAvatar = ({ user = {}, className = 'w-10 h-10 rounded-full', textSize = 'text-sm' }) => {
    const safeUser = user && typeof user === 'object' ? user : {};
    const { first_name = '', last_name = '', profile_photo } = safeUser;
    const [hasLoadError, setHasLoadError] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const initials = `${first_name?.[0] ?? ''}${last_name?.[0] ?? ''}`.toUpperCase();

    const hasPhoto =
        profile_photo &&
        profile_photo !== 'default-avatar.png' &&
        profile_photo !== '';

    useEffect(() => {
        setHasLoadError(false);
        setImageSrc(hasPhoto ? profilePhotoUrl(profile_photo) : '');
    }, [hasPhoto, profile_photo]);

    if (hasPhoto && !hasLoadError) {
        return (
            <img
                src={imageSrc}
                alt={`${first_name} ${last_name}`}
                className={`object-cover ${className}`}
                onError={() => {
                    const fallbackSrc = profilePhotoFallbackUrl(profile_photo);
                    if (imageSrc !== fallbackSrc) {
                        setImageSrc(fallbackSrc);
                        return;
                    }

                    setHasLoadError(true);
                }}
            />
        );
    }

    // Warm taupe — matches the VIVRE design system
    return (
        <div className={`flex items-center justify-center font-bold bg-[#c4ba9d]/40 text-[#8c7f6a] ${className}`}>
            <span className={textSize}>{initials || '?'}</span>
        </div>
    );
};

export default ProfileAvatar;
