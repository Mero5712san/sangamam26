import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, UserCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNotificationStore } from '../store/notificationStore';
import { useToastStore } from '../store/toastStore';
import { AlertTriangle } from 'lucide-react';

export function ScannerPage() {
    const { addNotification } = useNotificationStore();
    const { showToast } = useToastStore();
    const navigate = useNavigate();
    const [scannedData, setScannedData] = useState(null);
    const [scanError, setScanError] = useState(null);

    const scannerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        // Start scanning
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                if (!isMounted) return;
                // Success callback
                try {
                    let parsedData;
                    try {
                        parsedData = JSON.parse(decodedText);
                    } catch (e) {
                        showToast("Invalid QR Code format", "error");
                        return;
                    }

                    setScannedData({
                        id: parsedData.id,
                        name: parsedData.name,
                        uuid: parsedData.uuid
                    });

                    showToast(`Participant Identified: ${parsedData.name}`, 'success');

                    // Pause scanning
                    html5QrCode.pause();

                    // Redirect to user detail page after 1 second
                    setTimeout(() => {
                        if (isMounted) {
                            html5QrCode.stop().then(() => {
                                navigate(`/approvals/user/${parsedData.id}`);
                            });
                        }
                    }, 1000);

                } catch (err) {
                    console.error("Error processing QR:", err);
                }
            },
            (errorMessage) => {
                // Error callback (called very frequently when no QR is in frame, safe to ignore)
            }
        ).catch((err) => {
            if (isMounted) {
                console.error("Camera start failed", err);
                setScanError("Failed to start camera. Please ensure camera permissions are granted.");
            }
        });

        // Cleanup function to stop scanner when component unmounts
        return () => {
            isMounted = false;
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === 2 || state === 3) { // SCANNING or PAUSED
                        scannerRef.current.stop().then(() => {
                            scannerRef.current.clear();
                            console.log("Scanner stopped successfully");
                        }).catch(e => console.log("Stop error:", e));
                    }
                } catch (e) {
                    console.log("Cleanup error:", e);
                }
            }
        };
    }, []);

    return (
        <div className="flex h-full items-center justify-center">
            <style>
                {`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                `}
            </style>

            <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-sangamam-border bg-white p-8 shadow-2xl">

                {/* Modern Scanner Frame */}
                <div className="relative mx-auto w-64 h-64 mb-8">
                    {/* The Camera Feed Box */}
                    <div className="absolute inset-0 bg-slate-900 rounded-3xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center">
                        {/* html5-qrcode injects a video element here */}
                        <div id="reader" className="w-full h-full relative z-10 [&>video]:object-cover [&>video]:h-full [&>video]:w-full rounded-3xl overflow-hidden"></div>

                        {/* Fallback icon if camera is taking time */}
                        {!scannedData && <ScanLine className="text-slate-600 opacity-40 absolute pointer-events-none z-0" size={64} />}
                    </div>

                    {/* Corner Markers */}
                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-sangamam-gold rounded-tl-[1.5rem] z-10 pointer-events-none" />
                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-sangamam-gold rounded-tr-[1.5rem] z-10 pointer-events-none" />
                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-sangamam-gold rounded-bl-[1.5rem] z-10 pointer-events-none" />
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-sangamam-gold rounded-br-[1.5rem] z-10 pointer-events-none" />

                    {/* Animated Scanline (Hidden when paused/scanned) */}
                    {!scannedData && !scanError && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-sangamam-gold opacity-80 shadow-[0_0_15px_3px_rgba(184,134,11,0.6)] z-20 animate-[scan_2.5s_cubic-bezier(0.4,0,0.2,1)_infinite] pointer-events-none" />
                    )}
                </div>

                {/* Scan Result */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Result</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    {scanError && !scannedData && (
                        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-center">
                            <p className="text-sm font-semibold text-red-600">{scanError}</p>
                        </div>
                    )}

                    {scannedData ? (
                        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 flex flex-col items-center text-center transition-all animate-in fade-in zoom-in duration-300">
                            <UserCheck className="text-emerald-600 mb-3" size={40} />
                            <h3 className="text-xl font-bold text-emerald-900 mb-1">{scannedData.name}</h3>
                            <p className="text-[10px] font-mono text-emerald-600/80 break-all mb-4">{scannedData.uuid}</p>
                            <span className="inline-flex items-center rounded-full bg-emerald-200 px-4 py-1.5 text-sm font-bold text-emerald-800 shadow-sm">
                                ✓ Attendance Marked
                            </span>
                        </div>
                    ) : !scanError ? (
                        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 flex flex-col items-center justify-center text-center min-h-[160px]">
                            <ScanLine className="text-gray-300 mb-3 animate-pulse" size={32} />
                            <p className="text-gray-500 font-semibold animate-pulse text-sm">Searching for QR code...</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
