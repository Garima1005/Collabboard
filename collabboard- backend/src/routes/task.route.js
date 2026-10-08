const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} = require('../controllers/task.controller');

const router = express.Router();

router.post('/', protect, createTask);
router.get('/:boardId', protect, getTasks);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;