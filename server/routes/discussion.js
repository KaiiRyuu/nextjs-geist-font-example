const express = require('express');
const router = express.Router();

// GET /api/discussion - Get all discussion posts
router.get('/', async (req, res) => {
  try {
    let discussions = [];
    
    if (global.db) {
      try {
        const discussionsCollection = global.db.collection('discussions');
        discussions = await discussionsCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
      } catch (dbError) {
        console.error('Database query error:', dbError);
        discussions = [...global.dummyDiscussions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else {
      discussions = [...global.dummyDiscussions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    res.json({
      success: true,
      count: discussions.length,
      discussions: discussions
    });
    
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat mengambil data diskusi'
    });
  }
});

// POST /api/discussion - Create a new discussion post
router.post('/', async (req, res) => {
  try {
    const { name, email, question } = req.body;
    
    // Validate required fields
    if (!question || question.trim() === '') {
      return res.status(400).json({ 
        error: 'Question is required',
        message: 'Pertanyaan tidak boleh kosong'
      });
    }
    
    // Create new discussion object
    const newDiscussion = {
      id: Date.now(), // Simple ID generation for demo
      name: name?.trim() || 'Anonymous',
      email: email?.trim() || '',
      question: question.trim(),
      createdAt: new Date(),
      answer: null // Will be filled by admin later
    };
    
    // Save to database or dummy data
    if (global.db) {
      try {
        const discussionsCollection = global.db.collection('discussions');
        const result = await discussionsCollection.insertOne(newDiscussion);
        newDiscussion._id = result.insertedId;
      } catch (dbError) {
        console.error('Database insert error:', dbError);
        // Fall back to dummy data
        global.dummyDiscussions.unshift(newDiscussion);
      }
    } else {
      // Add to dummy data
      global.dummyDiscussions.unshift(newDiscussion);
    }
    
    res.status(201).json({
      success: true,
      message: 'Pertanyaan berhasil dikirim',
      discussion: newDiscussion
    });
    
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat mengirim pertanyaan'
    });
  }
});

// PUT /api/discussion/:id/answer - Add answer to a discussion (admin only)
router.put('/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    
    if (!answer || answer.trim() === '') {
      return res.status(400).json({ 
        error: 'Answer is required',
        message: 'Jawaban tidak boleh kosong'
      });
    }
    
    let updated = false;
    
    if (global.db) {
      try {
        const discussionsCollection = global.db.collection('discussions');
        const result = await discussionsCollection.updateOne(
          { id: parseInt(id) },
          { $set: { answer: answer.trim(), answeredAt: new Date() } }
        );
        updated = result.modifiedCount > 0;
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Fall back to dummy data
        const discussionIndex = global.dummyDiscussions.findIndex(d => d.id === parseInt(id));
        if (discussionIndex !== -1) {
          global.dummyDiscussions[discussionIndex].answer = answer.trim();
          global.dummyDiscussions[discussionIndex].answeredAt = new Date();
          updated = true;
        }
      }
    } else {
      // Update dummy data
      const discussionIndex = global.dummyDiscussions.findIndex(d => d.id === parseInt(id));
      if (discussionIndex !== -1) {
        global.dummyDiscussions[discussionIndex].answer = answer.trim();
        global.dummyDiscussions[discussionIndex].answeredAt = new Date();
        updated = true;
      }
    }
    
    if (updated) {
      res.json({
        success: true,
        message: 'Jawaban berhasil ditambahkan'
      });
    } else {
      res.status(404).json({
        error: 'Discussion not found',
        message: 'Diskusi tidak ditemukan'
      });
    }
    
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat menambahkan jawaban'
    });
  }
});

// DELETE /api/discussion/:id - Delete a discussion (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;
    
    if (global.db) {
      try {
        const discussionsCollection = global.db.collection('discussions');
        const result = await discussionsCollection.deleteOne({ id: parseInt(id) });
        deleted = result.deletedCount > 0;
      } catch (dbError) {
        console.error('Database delete error:', dbError);
        // Fall back to dummy data
        const discussionIndex = global.dummyDiscussions.findIndex(d => d.id === parseInt(id));
        if (discussionIndex !== -1) {
          global.dummyDiscussions.splice(discussionIndex, 1);
          deleted = true;
        }
      }
    } else {
      // Delete from dummy data
      const discussionIndex = global.dummyDiscussions.findIndex(d => d.id === parseInt(id));
      if (discussionIndex !== -1) {
        global.dummyDiscussions.splice(discussionIndex, 1);
        deleted = true;
      }
    }
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Diskusi berhasil dihapus'
      });
    } else {
      res.status(404).json({
        error: 'Discussion not found',
        message: 'Diskusi tidak ditemukan'
      });
    }
    
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat menghapus diskusi'
    });
  }
});

module.exports = router;
