import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function VirtualIDCard({ participant, onClose }) {
    const { role } = useAuthStore();
    const qrPayload = JSON.stringify({
        id: participant?.uuid,
        name: participant?.name
    });
    const [qrDataUrl, setQrDataUrl] = useState('');

    const isStaff = role === 'admin' || role === 'incharge';
    const cardImage = isStaff ? '/inchargeID.png' : '/IDcard.png';

    useEffect(() => {
        let isActive = true;

        QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 320,
            color: {
                dark: '#2a130d',
                light: '#ffffff',
            },
        })
            .then((url) => {
                if (isActive) {
                    setQrDataUrl(url);
                }
            })
            .catch(() => {
                if (isActive) {
                    setQrDataUrl('');
                }
            });

        return () => {
            isActive = false;
        };
    }, [qrPayload]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120705]/85 p-4 backdrop-blur-sm">
            <button
                onClick={onClose}
                className="absolute right-5 top-5 z-[60] rounded-full border border-[#f2cf8b]/60 bg-[#4a140f]/90 p-3 text-[#f2cf8b] shadow-xl hover:bg-[#5a1019]"
                aria-label="Close virtual ID card"
            >
                <X size={20} />
            </button>

            <article className="relative mx-auto aspect-[3/4] w-full max-w-[520px] overflow-hidden shadow-[0_36px_100px_rgba(0,0,0,0.45)]">
                <img
                    src={cardImage}
                    alt="Sangamam virtual ID card"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.05))]" />
                
                {/* Dynamic QR Positioning based on card type */}
                <div 
                    className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square rounded-sm bg-white p-1 shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
                    style={{ 
                        top: isStaff ? '65.5%' : '58%', 
                        width: isStaff ? '33%' : '45%' 
                    }}
                >
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="User QR code" className="block h-full w-full" />
                    ) : (
                        <div className="flex aspect-square items-center justify-center text-[0.7rem] font-semibold text-[#4a140f]">
                            Generating QR...
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
