const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/filedb';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const conn = mongoose.connection;

let gfsBucket;

conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
  console.log('GridFSBucket ready');
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = Date.now() + '_' + req.file.originalname;

  const uploadStream = gfsBucket.openUploadStream(filename, {
    contentType: req.file.mimetype,
    metadata: { originalname: req.file.originalname }
  });

  uploadStream.end(req.file.buffer);

  uploadStream.on('finish', () => {
    res.json({
      id: uploadStream.id.toString(), 
      filename: uploadStream.filename,
      originalname: req.file.originalname,
      contentType: req.file.mimetype
    });
  });

  uploadStream.on('error', (err) => {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  });
});

app.get('/files', async (req, res) => {
  try {
    const files = await conn.db.collection('uploads.files')
      .find().sort({ uploadDate: -1 }).toArray();

    const out = files.map(f => ({
      _id: f._id.toString(),
      filename: f.filename,
      originalname: f.metadata?.originalname || f.filename,
      length: f.length,
      contentType: f.contentType,
      uploadDate: f.uploadDate
    }));

    res.json(out);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/files/:id', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const fileDoc = await conn.db.collection('uploads.files').findOne({ _id: id });
    if (!fileDoc) return res.status(404).send('File not found');

    res.set('Content-Type', fileDoc.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${fileDoc.filename}"`);

    const downloadStream = gfsBucket.openDownloadStream(id);
    downloadStream.on('error', (err) => {
      console.error('Download error:', err);
      res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID or server error' });
  }
});

app.delete('/files/:id', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    await gfsBucket.delete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));