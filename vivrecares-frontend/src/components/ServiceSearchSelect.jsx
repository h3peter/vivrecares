import { useEffect, useMemo, useState } from 'react';

const ServiceSearchSelect = ({
    services = [],
    value = null,
    onSelect,
    label = 'Service',
    placeholder = 'Search a service',
    helperText = '',
    disabled = false,
    compact = false,
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setQuery(value?.service_name || '');
    }, [value]);

    const normalizedQuery = query.trim().toLowerCase();

    const filteredServices = useMemo(() => {
        if (!normalizedQuery) {
            return services.slice(0, 10);
        }

        return services
            .filter((service) =>
                [service.service_name, service.category_name, service.description]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedQuery)
            )
            .slice(0, 10);
    }, [normalizedQuery, services]);

    const inputClassName = compact
        ? 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]'
        : 'w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-4 text-base text-gray-700 outline-none focus:border-[#c4ba9d]';

    const handlePick = (service) => {
        onSelect(service);
        setQuery(service.service_name);
        setIsOpen(false);
    };

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        onSelect(null);
    };

    return (
        <div className="relative">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        if (!e.target.value.trim()) {
                            onSelect(null);
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClassName}
                />
                {value && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400 hover:text-[#555555]"
                    >
                        Clear
                    </button>
                )}
            </div>

            {helperText && <p className="mt-2 text-xs text-gray-400">{helperText}</p>}

            {isOpen && !disabled && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                    <div className="max-h-72 overflow-y-auto">
                        {filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <button
                                    key={service.service_id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handlePick(service)}
                                    className="w-full border-b border-gray-50 px-4 py-4 text-left hover:bg-[#faf9f6] transition"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{service.service_name}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                                                {service.category_name || 'Uncategorized'}
                                            </p>
                                            {service.description && (
                                                <p className="mt-1 text-xs text-gray-500">{service.description}</p>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-sm font-bold text-gray-800">
                                            PHP {Number(service.base_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-4 text-sm text-gray-500">No matching services found.</div>
                        )}
                    </div>
                </div>
            )}

            {value && (
                <div className="mt-3 rounded-2xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-gray-800">{value.service_name}</p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                                {value.category_name || 'Uncategorized'}
                            </p>
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                            PHP {Number(value.base_price || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceSearchSelect;
