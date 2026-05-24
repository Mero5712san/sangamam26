import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Music, Users, Trophy } from 'lucide-react';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <div className="sticky top-0 z-50 border-b border-sangamam-border bg-[rgba(31,14,9,0.86)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
                    <h1 className="text-3xl font-bold text-sangamam-gold">சங்கமம்</h1>
                    <button
                        onClick={() => navigate('/login')}
                        className="sangamam-button-maroon"
                    >
                        Sign In
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-4">
                <div className="text-center max-w-3xl mb-16">
                    <div className="mb-8 flex items-center justify-center">
                        <img src="/logo.png" alt="logo_error" width="300" height="300" />
                    </div>
                    <h2 className="text-6xl font-bold text-sangamam-gold mb-4">முத்தமிழ் சங்கமம்'26</h2>
                    <p className="text-2xl text-sangamam-gold mb-6 font-semibold">தமிழர் பண்பாட்டின் பெருவிழா</p>

                    <p className="text-lg text-gray-700 leading-relaxed mb-12 text-justify" >
                        தமிழின் மரபும், கலையும், இலக்கியமும் ஒன்றிணையும் இனிய விழாவிற்கு வரவேற்கிறோம்.
                        முத்தமிழ் சங்கமம் 2026 என்பது மாணவர்களின் திறமைகளை வெளிப்படுத்தும் சிறப்பான பண்பாட்டு மேடையாகும். பேச்சுப்போட்டி, கவிதை, சிலம்பம், நாட்டுப்புற நடனம், வில்லுப்பாட்டு, கைவினைக் கலை, தெருக்கூத்து போன்ற பல்வேறு நிகழ்வுகள் மூலம் தமிழரின் பாரம்பரியத்தை கொண்டாடும் விழா இது.<br/>

                        தமிழ் மொழியின் பெருமையை இளைய தலைமுறைக்கு கொண்டு சேர்த்து, கலை மற்றும் கலாச்சாரத்தின் மீதான அன்பை வளர்க்கும் நோக்கில் இந்நிகழ்வு நடத்தப்படுகிறது. பல கல்லூரி மாணவர்கள் ஒன்றுகூடி கலாச்சார ஒற்றுமையையும் நட்பையும் பகிரும் திருவிழாவாக முத்தமிழ் சங்கமம் திகழ்கிறது.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/events')}
                    className="group inline-flex items-center gap-3 px-8 py-4 sangamam-button text-lg font-bold rounded-lg shadow-lg hover:shadow-xl"
                >
                    நிகழ்வுகளை காண
                    <ChevronRight className="group-hover:translate-x-1 transition" size={24} />
                </button>

                <p className="text-gray-600 text-sm mt-8">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sangamam-maroon font-bold hover:text-sangamam-gold"
                    >
                        Sign in here
                    </button>
                </p>
            </div>

            {/* Footer */}
            <footer className="bg-transparent border-t border-sangamam-border py-1">
                <div className="text-center text-gray-600 text-sm">
                    <p>&copy; 2024 Sangamam. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
