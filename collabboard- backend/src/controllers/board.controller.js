const Board = require('../models/board.model');
const User = require('../models/user.model');

exports.createBoard = async (req, res) => {
  const board = await Board.create({
    title: req.body.title,
    owner: req.user.id,
    members: [req.user.id]
  });

  res.json(board);
};

exports.getBoards = async (req, res) => {
  const query = req.user.role === 'admin'
    ? {}
    : { members: req.user.id };
  const boards = await Board.find(query);

  res.json(boards);
};

exports.deleteBoard = async (req, res) => {
  const board = await Board.findByIdAndDelete(req.params.id);
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  res.json({ message: 'Board deleted' });
};

exports.addBoardMember = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const board = await Board.findById(req.params.id);
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  if (!board.members.map((id) => id.toString()).includes(userId)) {
    board.members.push(userId);
    await board.save();
  }

  res.json(board);
};