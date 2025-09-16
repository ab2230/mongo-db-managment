require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Dynamic model setup
const getModel = (collectionName) => {
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  const schema = new mongoose.Schema({}, { strict: false });
  return mongoose.model(collectionName, schema, collectionName);
};

// List collections
app.get('/collections', async (req, res) => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  res.json(collections.map(c => c.name));
});

// Get data from a collection
app.get('/data/:collection', async (req, res) => {
  const Model = getModel(req.params.collection);
  const data = await Model.find({});
  res.json(data);
});

// Add document to collection
app.post('/data/:collection', async (req, res) => {
  const Model = getModel(req.params.collection);
  const item = new Model(req.body);
  await item.save();
  res.json(item);
});

// Update document
app.put('/data/:collection/:id', async (req, res) => {
  const Model = getModel(req.params.collection);
  const updated = await Model.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, upsert: false }  // Set `upsert: true` if you want to allow new creation
  );
  res.json(updated);
});
// Delete document
app.delete('/data/:collection/:id', async (req, res) => {
  const Model = getModel(req.params.collection);
  await Model.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Drop entire collection
app.delete('/collection/:collection', async (req, res) => {
  await mongoose.connection.dropCollection(req.params.collection);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
