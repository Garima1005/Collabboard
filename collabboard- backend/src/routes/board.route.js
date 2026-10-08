const express = require('express');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  createBoard,
  getBoards,
  deleteBoard,
  addBoardMember
} = require('../controllers/board.controller');

const router = express.Router();

router.post('/', protect, adminOnly, createBoard);
router.get('/', protect, getBoards);
router.delete('/:id', protect, adminOnly, deleteBoard);
router.post('/:id/members', protect, adminOnly, addBoardMember);

module.exports = router;