import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function StaffIDCard({ user }) {
    const qrRef = useRef(null);

    useEffect(() => {
        if (qrRef.current && user) {
            // Generate QR code for user details
            const qrData = JSON.stringify({
                id: user.id || 'INCHARGE-001',
                role: user.role,
                name: user.name
            });
            
            QRCode.toCanvas(qrRef.current, qrData, {
                width: 300,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [user]);

    return (
        <div className="relative w-full max-w-[400px] mx-auto aspect-[3/4.2] rounded-3xl overflow-hidden shadow-2xl border border-sangamam-border bg-[#1a0b06]">
            {/* Background Image */}
            <img 
                src="/inchargeID.png" 
                alt="Incharge ID Card" 
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay QR Code - Adjusting size and position to match the white QR area in the image */}
            <div className="absolute top-[52.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[31.5%] aspect-square bg-white p-1 rounded-sm flex items-center justify-center">
                <canvas ref={qrRef} className="w-full h-full" />
            </div>

            {/* Staff Details Overlay */}
            <div className="absolute top-[35%] left-0 right-0 text-center px-4">
                {/* We can add dynamic text here if the image has placeholders, 
                    but the image looks pretty complete. 
                    If we need to overlay name, we can do it here. */}
            </div>
        </div>
    );
}
