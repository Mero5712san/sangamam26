import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Download } from 'lucide-react';
import { documentsAPI, resolveApiUrl } from '../services/api';
import { useToastStore } from '../store/toastStore';

export default function DocumentsViewer() {
    const { type } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToastStore();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await documentsAPI.getShared();
                setDoc(data?.[type] || null);
            } catch (err) {
                showToast('Failed to load document', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [type, showToast]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!doc || !doc.url) return (
        <div className="p-6">
            <button onClick={() => navigate(-1)} className="mb-4">Back</button>
            <div>No document available.</div>
        </div>
    );

    const isImage = doc.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(doc.url);
    const isPdf = doc.mimeType === 'application/pdf' || /\.pdf$/i.test(doc.url);

    return (
        <div className="min-h-screen bg-black/90 p-6">
            <div className="max-w-7xl mx-auto bg-[#1f0e09] rounded-2xl overflow-hidden border border-sangamam-border">
                <div className="flex items-center justify-between px-6 py-4 border-b border-sangamam-border">
                    <div className="text-white font-bold">{type === 'rulebook' ? 'Rulebook' : 'Schedule'}</div>
                    <div className="flex items-center gap-3">
                        <a
                            className="inline-flex items-center gap-2 rounded-xl bg-sangamam-gold px-4 py-2 font-semibold text-black"
                            href={resolveApiUrl(doc.url)}
                            download={doc.name}
                        >
                            <Download size={16} /> Download
                        </a>
                        <button onClick={() => navigate(-1)} className="rounded-full bg-white/5 p-2 text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="h-[80vh] bg-black/20">
                    {isImage ? (
                        <img src={resolveApiUrl(doc.url)} alt={doc.name} className="h-full w-full object-contain" />
                    ) : isPdf ? (
                        <iframe src={resolveApiUrl(doc.url)} title={doc.name} className="h-full w-full border-0" />
                    ) : (
                        <div className="p-6 text-center text-gray-300">Preview not supported. Use download.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
