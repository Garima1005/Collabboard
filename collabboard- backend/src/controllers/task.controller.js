const Task = require('../models/task.model');
const Board = require('../models/board.model');

const isAdmin = (req) => req.user.role === 'admin';

const ensureBoardAccess = async (req, boardId) => {
  const board = await Board.findById(boardId);
  if (!board) return { error: { status: 404, message: 'Board not found' } };
  if (isAdmin(req)) return { board };
  const isMember = board.members.some((memberId) => memberId.toString() === req.user.id);
  if (!isMember) return { error: { status: 403, message: 'Not allowed for this board' } };
  return { board };
};

exports.createTask = async (req, res) => {
  const { board, title, description, status, assignedTo } = req.body;
  const access = await ensureBoardAccess(req, board);
  if (access.error) return res.status(access.error.status).json({ message: access.error.message });

  const task = await Task.create({
    board,
    title,
    description,
    status,
    assignedTo: assignedTo || null,
    createdBy: req.user.id
  });
  req.app.get('io')?.to(`board:${board}`).emit('task:created', task);
  res.json(task);
};

exports.getTasks = async (req, res) => {
  const access = await ensureBoardAccess(req, req.params.boardId);
  if (access.error) return res.status(access.error.status).json({ message: access.error.message });
  const tasks = await Task.find({ board: req.params.boardId });
  res.json(tasks);
};

exports.updateTask = async (req, res) => {
  const existingTask = await Task.findById(req.params.id);
  if (!existingTask) return res.status(404).json({ message: 'Task not found' });

  const access = await ensureBoardAccess(req, existingTask.board);
  if (access.error) return res.status(access.error.status).json({ message: access.error.message });

  const isOwner =
    existingTask.createdBy?.toString() === req.user.id ||
    existingTask.assignedTo?.toString() === req.user.id;
  if (!isAdmin(req) && !isOwner) {
    return res.status(403).json({ message: 'Only admin or task owner can edit this task' });
  }

  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  req.app.get('io')?.to(`board:${task.board}`).emit('task:updated', task);
  res.json(task);
};

exports.deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const access = await ensureBoardAccess(req, task.board);
  if (access.error) return res.status(access.error.status).json({ message: access.error.message });

  await Task.findByIdAndDelete(req.params.id);
  req.app.get('io')?.to(`board:${task.board}`).emit('task:deleted', { _id: req.params.id });
  res.json({ message: 'Deleted' });
};