const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (using dummy data for development)
let db;
const MONGODB_URI = 'mongodb://localhost:27017/kipkuliah';

// Dummy data for development (in case MongoDB is not available)
const dummyStudents = [
  { studentId: '2021001', name: 'Ahmad Rizki', registered: true },
  { studentId: '2021002', name: 'Siti Nurhaliza', registered: true },
  { studentId: '2021003', name: 'Budi Santoso', registered: false },
  { studentId: '2022001', name: 'Dewi Sartika', registered: true },
  { studentId: '2022002', name: 'Muhammad Fadli', registered: true },
];

const dummyDiscussions = [
  {
    id: 1,
    name: 'Ahmad',
    email: 'ahmad@student.uin.ac.id',
    question: 'Bagaimana cara mengajukan perpanjangan KIP Kuliah?',
    createdAt: new Date('2024-01-15'),
    answer: 'Untuk perpanjangan KIP Kuliah, silakan hubungi bagian kemahasiswaan dengan membawa dokumen yang diperlukan.'
  },
  {
    id: 2,
    name: 'Siti',
    email: 'siti@student.uin.ac.id',
    question: 'Apakah ada batasan IPK untuk mempertahankan KIP Kuliah?',
    createdAt: new Date('2024-01-10'),
    answer: 'Ya, mahasiswa harus mempertahankan IPK minimal 2.75 untuk dapat melanjutkan KIP Kuliah.'
  }
];

// Make data available globally for routes
global.db = null;
global.dummyStudents = dummyStudents;
global.dummyDiscussions = dummyDiscussions;

// Connect to MongoDB (with fallback to dummy data)
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('kipkuliah');
    global.db = db;
    console.log('Connected to MongoDB');
    
    // Initialize collections with dummy data if empty
    const studentsCollection = db.collection('students');
    const discussionsCollection = db.collection('discussions');
    
    const studentCount = await studentsCollection.countDocuments();
    if (studentCount === 0) {
      await studentsCollection.insertMany(dummyStudents);
      console.log('Initialized students collection with dummy data');
    }
    
    const discussionCount = await discussionsCollection.countDocuments();
    if (discussionCount === 0) {
      await discussionsCollection.insertMany(dummyDiscussions);
      console.log('Initialized discussions collection with dummy data');
    }
  } catch (error) {
    console.log('MongoDB connection failed, using dummy data:', error.message);
    global.db = null;
  }
}

// Routes
app.use('/api/student', require('./routes/student'));
app.use('/api/discussion', require('./routes/discussion'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
