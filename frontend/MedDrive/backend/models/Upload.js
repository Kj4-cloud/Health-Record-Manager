const mongoose = require('mongoose');

const UploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },       // stored filename on disk
  originalName: { type: String, required: true },
  filepath: { type: String, required: true },
  mimetype: String,
  size: Number,
  metadata: { type: mongoose.Schema.Types.Mixed }   // title, tags, etc.
}, { timestamps: true });

module.exports = mongoose.model('Upload', UploadSchema);
