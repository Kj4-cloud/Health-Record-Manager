require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const Upload = require('./models/Upload');

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

// multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const name = `${base}-${Date.now()}${Math.floor(Math.random()*1000)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB error', err); process.exit(1); });

// simple health
app.get('/', (req, res) => res.json({ ok: true }));

// upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, error:'No file uploaded' });

    let metadata = {};
    if (req.body.metadata) {
      try { metadata = JSON.parse(req.body.metadata); } 
      catch (e) { return res.status(400).json({ success:false, error:'Invalid metadata JSON' }); }
    }

    const doc = new Upload({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      metadata
    });

    await doc.save();
    res.json({ success: true, document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

// download route
app.get('/api/file/:id', async (req,res) => {
  try {
    const doc = await Upload.findById(req.params.id);
    if (!doc) return res.status(404).send('Not found');
    res.download(doc.filepath, doc.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/uploads - returns list of uploaded documents
app.get('/api/uploads', async (req, res) => {
  try {
    // Optional: add pagination later with ?page=1&limit=20
    const uploads = await Upload.find()
      .select('_id originalName filename size createdAt metadata')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, uploads });
  } catch (err) {
    console.error('Error fetching uploads:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/uploads/:id - delete file from disk and remove DB doc
app.delete('/api/uploads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

    const doc = await Upload.findById(id);
    if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

    // Attempt to delete file from disk (if it exists)
    try {
      const fp = doc.filepath;
      if (fp) {
        // fs.unlinkSync will throw if file missing; catch below
        const fs = require('fs');
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
          console.log('Deleted file from disk:', fp);
        } else {
          console.warn('File to delete not found on disk:', fp);
        }
      }
    } catch (fsErr) {
      console.error('Failed to remove file from disk for', id, fsErr);
      // continue to delete DB document even if disk delete failed
    }

    // Remove document from DB
    await Upload.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting upload:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});



app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
