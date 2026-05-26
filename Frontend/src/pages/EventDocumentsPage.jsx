import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, FileText, Upload, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { documentsAPI, resolveApiUrl } from '../services/api';

const documentCards = [
    {
        key: 'rulebook',
        title: 'விதிமுறைகள்',
        description: 'Rules, eligibility, and participation guidance',
    },
    {
        key: 'schedule',
        title: 'அட்டவணை',
        description: 'Event timings and session flow',
    },
];

const getDocumentKind = (documentValue) => {
    const mimeType = documentValue?.mimeType || '';
    const url = documentValue?.url || '';

    if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url)) {
        return 'image';
    }

    if (mimeType === 'application/pdf' || /\.pdf$/i.test(url)) {
        return 'pdf';
    }

    return 'file';
};

export function EventDocumentsPage() {
    const { slug: routeSlug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { showToast } = useToastStore();
    const [docs, setDocs] = useState({ rulebook: null, schedule: null });
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRefs = useRef({});

    useEffect(() => {
        const loadShared = async () => {
            try {
                const { data } = await documentsAPI.getShared();
                setDocs(data || { rulebook: null, schedule: null });
            } catch (err) {
                showToast('Failed to load documents', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadShared();
    }, [showToast]);

    const isAdmin = user?.role === 'admin';

    const getDocument = (key) => docs?.[key] || null;

    const handleDownload = (key) => {
        const documentValue = getDocument(key);
        if (!documentValue?.url) return;
        const link = document.createElement('a');
        link.href = resolveApiUrl(documentValue.url);
        link.download = documentValue.name || key;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async (key, file) => {
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('document', file);
            await documentsAPI.uploadShared(key, formData);
            const { data } = await documentsAPI.getShared();
            setDocs(data || { rulebook: null, schedule: null });
            showToast(`${key === 'rulebook' ? 'Rulebook' : 'Schedule'} uploaded`, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to upload file', 'error');
        } finally {
            if (fileInputRefs.current[key]) fileInputRefs.current[key].value = '';
        }
    };

    const handleDelete = async (key) => {
        try {
            await documentsAPI.deleteShared(key);
            const { data } = await documentsAPI.getShared();
            setDocs(data || { rulebook: null, schedule: null });
            showToast(`${key === 'rulebook' ? 'Rulebook' : 'Schedule'} deleted`, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete file', 'error');
        }
    };

    const openPreview = (key) => {
        const documentValue = getDocument(key);
        if (!documentValue?.url) {
            showToast('File not uploaded yet', 'info');
            return;
        }
        const url = resolveApiUrl(documentValue.url);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-8 pb-10">
            {isLoading ? (
                <div className="rounded-[2rem] border border-dashed border-sangamam-border bg-white/5 p-10 text-center text-gray-400">Loading files...</div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {documentCards.map((card) => {
                            const documentValue = getDocument(card.key);
                            const hasFile = Boolean(documentValue?.url);
                            const kind = getDocumentKind(documentValue);
                            return (
                                <div
                                    key={card.key}
                                    onClick={() => openPreview(card.key)}
                                    className="group relative overflow-hidden rounded-[2rem] border border-sangamam-border bg-[linear-gradient(180deg,rgba(54,24,17,0.95),rgba(25,11,7,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition-transform hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sangamam-border bg-white/5 text-sangamam-gold">
                                                <FileText size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                                                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{hasFile ? `${kind.toUpperCase()} ready` : 'No file uploaded yet'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(card.key);
                                            }}
                                            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${hasFile ? 'border-sangamam-border bg-white/5 text-sangamam-gold hover:bg-white/10' : 'cursor-not-allowed border-sangamam-border/60 bg-white/5 text-gray-500'}`}
                                            aria-label={`Download ${card.title}`}
                                            disabled={!hasFile}
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-white/5 bg-black/20 p-4">
                                        <div className="flex items-center justify-between gap-3 text-sm text-gray-300">
                                            <span className="truncate">{documentValue?.name || 'No file selected'}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Click to view</span>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sangamam-border bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                                                <Upload size={16} /> Upload
                                                <input ref={(el) => (fileInputRefs.current[card.key] = el)} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(card.key, e.target.files?.[0])} />
                                            </label>
                                            {hasFile && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(card.key); }} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20">
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!hasFile && !isAdmin && (
                                        <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-500">The admin has not uploaded this file yet.</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}