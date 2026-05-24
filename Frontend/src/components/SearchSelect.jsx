import React, { useState } from 'react';

export function SearchSelect({ options, onChange, placeholder = 'Search and select...', multiple = true, value, maxItems }) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(multiple ? (value || []) : (value ? [value] : []));

    const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(query.toLowerCase()) && (multiple ? !selected.includes(opt.value) : true)
    );

    const handleSelect = (val) => {
        if (multiple) {
            if (maxItems && selected.length >= maxItems) {
                alert(`You can only select up to ${maxItems} items.`);
                return;
            }
            const updated = [...selected, val];
            setSelected(updated);
            onChange(updated.map(v => ({ value: v, label: options.find(o => o.value === v)?.label })));
            setQuery('');
        } else {
            setSelected([val]);
            const selectedOpt = options.find(o => o.value === val);
            onChange(selectedOpt);
            setQuery(selectedOpt?.label || '');
        }
    };

    const handleRemove = (val) => {
        const updated = selected.filter(v => v !== val);
        setSelected(updated);
        onChange(multiple ? updated.map(v => ({ value: v, label: options.find(o => o.value === v)?.label })) : null);
        if (!multiple) setQuery('');
    };

    return (
        <div className="w-full relative">
            <div className="flex flex-wrap gap-2 mb-2">
                {multiple && selected.map(val => (
                    <span key={val} className="bg-sangamam-gold text-white px-2 py-1 rounded flex items-center gap-1">
                        {options.find(o => o.value === val)?.label || val}
                        <button onClick={() => handleRemove(val)} className="ml-1 text-xs">×</button>
                    </span>
                ))}
            </div>
            <div className="relative">
                <input
                    className="sangamam-input w-full px-4 py-2 pr-10"
                    placeholder={placeholder}
                    value={multiple ? query : (selected.length > 0 && !query ? options.find(o => o.value === selected[0])?.label : query)}
                    onChange={e => {
                        setQuery(e.target.value);
                        if (!multiple && selected.length > 0) {
                            setSelected([]);
                            onChange(null);
                        }
                    }}
                />
                {!multiple && selected.length > 0 && (
                    <button 
                        onClick={() => handleRemove(selected[0])}
                        className="absolute right-3 top-2.5 text-sangamam-gold hover:text-sangamam-maroon"
                    >
                        ×
                    </button>
                )}
            </div>
            {query && filtered.length > 0 && (
                <div className="absolute z-50 w-full sangamam-panel mt-1 max-h-40 overflow-y-auto rounded-xl shadow-2xl border border-sangamam-border bg-[rgba(31,14,9,0.95)] backdrop-blur-xl">
                    {filtered.map(opt => (
                        <div
                            key={opt.value}
                            className="cursor-pointer p-3 hover:bg-[rgba(255,255,255,0.08)] text-sangamam-gold transition-colors"
                            onClick={() => {
                                handleSelect(opt.value);
                                if (!multiple) setQuery(''); // Clear query after select in single mode
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
