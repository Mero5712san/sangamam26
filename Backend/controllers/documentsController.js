const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'common');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const TYPES = ['rulebook', 'schedule'];

const extToMime = (ext) => {
    ext = ext.toLowerCase();
    if (ext === '.pdf') return 'application/pdf';
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) return `image/${ext.replace('.', '')}`;
    return 'application/octet-stream';
};

const latestFileForType = (type) => {
    const files = fs.readdirSync(uploadDir).filter((f) => f.startsWith(`${type}-`));
    if (!files.length) return null;
    // pick latest by modified time
    files.sort((a, b) => {
        const aStat = fs.statSync(path.join(uploadDir, a));
        const bStat = fs.statSync(path.join(uploadDir, b));
        return bStat.mtimeMs - aStat.mtimeMs;
    });
    return files[0];
};

exports.getSharedDocuments = (req, res) => {
    const result = {};
    for (const type of TYPES) {
        const file = latestFileForType(type);
        if (file) {
            const full = `/uploads/common/${file}`;
            const ext = path.extname(file);
            result[type] = {
                url: full,
                name: file.replace(/^.+?-\d+-/, ''),
                mimeType: extToMime(ext),
                size: fs.statSync(path.join(uploadDir, file)).size,
            };
        } else {
            result[type] = null;
        }
    }

    res.json(result);
};

exports.uploadSharedDocument = (req, res) => {
    const type = req.params.type;
    if (!TYPES.includes(type)) return res.status(400).json({ message: 'Invalid document type' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Move file into common folder with prefix
    const tempPath = req.file.path;
    const safeName = req.file.originalname.replace(/\s+/g, '-');
    const destName = `${type}-${Date.now()}-${safeName}`;
    const destPath = path.join(uploadDir, destName);
    fs.renameSync(tempPath, destPath);

    const ext = path.extname(destName);
    res.json({
        url: `/uploads/common/${destName}`,
        name: safeName,
        mimeType: extToMime(ext),
        size: fs.statSync(destPath).size,
    });
};

exports.deleteSharedDocument = (req, res) => {
    const type = req.params.type;
    if (!TYPES.includes(type)) return res.status(400).json({ message: 'Invalid document type' });

    const file = latestFileForType(type);
    if (!file) return res.status(404).json({ message: 'No file to delete' });

    fs.unlinkSync(path.join(uploadDir, file));
    res.json({ message: 'Deleted' });
};
