const express = require('express');
const router = express.Router();
const { db, dummyStudents } = require('../index');

// GET /api/student/:studentId - Check if student ID is registered
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Validate student ID parameter
    if (!studentId || studentId.trim() === '') {
      return res.status(400).json({ 
        error: 'Student ID is required',
        exists: false 
      });
    }
    
    let student = null;
    
    // Try to query from MongoDB first
    if (db) {
      try {
        const studentsCollection = db.collection('students');
        student = await studentsCollection.findOne({ studentId: studentId.trim() });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Fall back to dummy data if database query fails
        student = dummyStudents.find(s => s.studentId === studentId.trim());
      }
    } else {
      // Use dummy data if no database connection
      student = dummyStudents.find(s => s.studentId === studentId.trim());
    }
    
    if (student) {
      res.json({
        exists: true,
        registered: student.registered !== false,
        studentId: student.studentId,
        name: student.name || 'N/A',
        message: student.registered !== false 
          ? 'Student ID terdaftar dalam program KIP Kuliah' 
          : 'Student ID ditemukan tetapi tidak terdaftar dalam program KIP Kuliah'
      });
    } else {
      res.json({
        exists: false,
        registered: false,
        message: 'Student ID tidak ditemukan dalam database'
      });
    }
    
  } catch (error) {
    console.error('Error checking student ID:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      exists: false,
      message: 'Terjadi kesalahan saat memeriksa Student ID'
    });
  }
});

// GET /api/student - Get all registered students (for admin purposes)
router.get('/', async (req, res) => {
  try {
    let students = [];
    
    if (db) {
      try {
        const studentsCollection = db.collection('students');
        students = await studentsCollection.find({}).toArray();
      } catch (dbError) {
        console.error('Database query error:', dbError);
        students = dummyStudents;
      }
    } else {
      students = dummyStudents;
    }
    
    // Only return registered students and hide sensitive info
    const registeredStudents = students
      .filter(student => student.registered !== false)
      .map(student => ({
        studentId: student.studentId,
        name: student.name || 'N/A'
      }));
    
    res.json({
      success: true,
      count: registeredStudents.length,
      students: registeredStudents
    });
    
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat mengambil data mahasiswa'
    });
  }
});

module.exports = router;
