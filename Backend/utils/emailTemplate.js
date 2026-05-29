const buildMailShell = ({ appBase, title, subtitle, content }) => {
    const base = (appBase || process.env.APP_BASE_URL || 'http://16.16.194.186:5000').replace(/\/$/, '');

    return `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #2a130d; padding: 20px;">
            <div style="background: linear-gradient(180deg,#3d1c13,#2a130d); border-radius: 12px; overflow: hidden; border: 2px solid #6b3f26;">
                <!-- HEADER -->
                <div style="padding: 18px 12px; text-align: center; background: linear-gradient(135deg,#2a130d,#4a2217);">
                    <img 
                        src="${base}/public/logo.png"
                        alt="Sangamam Logo"
                        style="height:200px; width:auto; display:block; margin:0 auto 12px auto; object-fit:contain;" />

                    <div style="margin-top: 6px; color: #fff1d0; font-size: 22px; font-weight:700;">${title}</div>
                    <div style="margin-top: 6px; color: #f5e1b3; font-size: 13px;">${subtitle}</div>
                </div>

                <!-- BODY -->
                <div style="padding: 30px; color: #f5e1b3; text-align: center; background-color: #2a130d;">${content}</div>

                <!-- FOOTER -->
                <div style="padding: 18px; text-align: center; background: #3d1c13; color: #b8860b; font-size: 12px;">
                    <div>Bannari Amman Institute of Technology - Sathyamangalam</div>
                    <div style="margin-top: 6px;">Muthamizh Sangamam 2026</div>
                </div>
            </div>
        </div>
    `;
};

module.exports = buildMailShell;
