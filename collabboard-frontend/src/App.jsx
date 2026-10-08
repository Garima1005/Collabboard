import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  addUserToBoard,
  createBoard,
  createTask,
  deleteTask,
  deleteBoard,
  getBoards,
  getMe,
  getTasks,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateTask
} from './api';

const initialAuthForm = {
  name: '',
  email: '',
  password: ''
};

const initialTaskForm = {
  title: '',
  description: '',
  status: 'todo'
};
const statuses = ['todo', 'in-progress', 'done'];
const SOCKET_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

function App() {
  const [mode, setMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [boardTitle, setBoardTitle] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [boards, setBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState('');

  const selectedBoard = useMemo(() => {
    return boards.find((board) => board._id === selectedBoardId) || null;
  }, [boards, selectedBoardId]);
  const isAdmin = currentUser?.role === 'admin';

  const loadBoards = async () => {
    const boardList = await getBoards();
    setBoards(boardList);
    if (boardList.length && !selectedBoardId) {
      setSelectedBoardId(boardList[0]._id);
    }
    if (!boardList.length) {
      setSelectedBoardId('');
    }
  };

  const loadUsers = async () => {
    const userList = await getUsers();
    setUsers(userList);
    if (!selectedUserId && userList.length) {
      setSelectedUserId(userList[0]._id);
    }
  };

  const loadTasks = async (boardId) => {
    if (!boardId) {
      setTasks([]);
      return;
    }
    const taskList = await getTasks(boardId);
    setTasks(taskList);
  };

  const setErrorMessage = (error) => {
    setMessage(error.message || 'Something went wrong');
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'register') {
        await registerUser(authForm);
      } else {
        await loginUser({
          email: authForm.email,
          password: authForm.password
        });
      }
      const me = await getMe();
      setCurrentUser(me);
      setIsAuthenticated(true);
      setAuthForm(initialAuthForm);
      await loadBoards();
      if (me.role === 'admin') {
        await loadUsers();
      }
      setMessage('Authentication successful');
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (event) => {
    event.preventDefault();
    if (!boardTitle.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const board = await createBoard(boardTitle.trim());
      setBoards((prev) => [board, ...prev]);
      setSelectedBoardId(board._id);
      setBoardTitle('');
      setMessage('Board created');
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedBoardId) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteBoard(selectedBoardId);
      const nextBoards = boards.filter((board) => board._id !== selectedBoardId);
      setBoards(nextBoards);
      setSelectedBoardId(nextBoards[0]?._id || '');
      setMessage('Board deleted');
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserToBoard = async (event) => {
    event.preventDefault();
    if (!selectedBoardId || !selectedUserId) return;
    setLoading(true);
    setMessage('');
    try {
      await addUserToBoard(selectedBoardId, selectedUserId);
      setMessage('User added to board');
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!selectedBoardId || !taskForm.title.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const newTask = await createTask({
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        board: selectedBoardId
      });
      setTasks((prev) => [newTask, ...prev]);
      setTaskForm(initialTaskForm);
      setMessage('Task created');
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    setLoading(true);
    setMessage('');
    try {
      const updatedTask = await updateTask(taskId, { status });
      setTasks((prev) => prev.map((task) => (task._id === taskId ? updatedTask : task)));
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setLoading(true);
    setMessage('');
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const canEditTask = (task) => {
    if (isAdmin) return true;
    return task.createdBy === currentUser?._id;
  };

  const handleDropTask = async (event, status) => {
    event.preventDefault();
    if (!draggingTaskId) return;
    await handleStatusChange(draggingTaskId, status);
    setDraggingTaskId('');
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('');
    try {
      await logoutUser();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setBoards([]);
      setTasks([]);
      setUsers([]);
      setSelectedBoardId('');
      setMessage('Logged out');
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMe()
      .then(async (me) => {
        setCurrentUser(me);
        setIsAuthenticated(true);
        await loadBoards();
        if (me.role === 'admin') {
          await loadUsers();
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadTasks(selectedBoardId).catch(setErrorMessage);
  }, [isAuthenticated, selectedBoardId]);

  useEffect(() => {
    if (!isAuthenticated || !selectedBoardId) return undefined;
    const socket = io(SOCKET_URL, { withCredentials: true });
    socket.emit('board:join', selectedBoardId);

    socket.on('task:created', (task) => {
      setTasks((prev) => {
        if (prev.some((item) => item._id === task._id)) return prev;
        return [task, ...prev];
      });
    });
    socket.on('task:updated', (task) => {
      setTasks((prev) => prev.map((item) => (item._id === task._id ? task : item)));
    });
    socket.on('task:deleted', ({ _id }) => {
      setTasks((prev) => prev.filter((item) => item._id !== _id));
    });

    return () => {
      socket.emit('board:leave', selectedBoardId);
      socket.disconnect();
    };
  }, [isAuthenticated, selectedBoardId]);

  if (!isAuthenticated) {
    return (
      <main className="container">
        <h1>CollabBoard</h1>
        <p className="subtitle">Connect frontend to your cookie-based backend auth</p>
        <form className="card" onSubmit={handleAuthSubmit}>
          {mode === 'register' ? (
            <input
              placeholder="Name"
              value={authForm.name}
              onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          ) : null}
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Register' : 'Login'}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setMode((prev) => (prev === 'register' ? 'login' : 'register'))}
          >
            Switch to {mode === 'register' ? 'Login' : 'Register'}
          </button>
          {message ? <p className="info">{message}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>CollabBoard</h1>
      <div className="header-line">
        <p className="subtitle">
          {currentUser?.name} ({currentUser?.role}) - boards, tasks, and realtime updates
        </p>
        <button className="ghost" onClick={handleLogout} disabled={loading}>Logout</button>
      </div>
      <section className="grid">
        <div className="card">
          <h2>Boards</h2>
          {isAdmin ? (
            <form className="inline" onSubmit={handleCreateBoard}>
              <input
                placeholder="New board title"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
              />
              <button type="submit" disabled={loading}>Create</button>
            </form>
          ) : (
            <p className="muted">Only admin can create/delete board and add users.</p>
          )}
          <div className="list">
            {boards.map((board) => (
              <button
                key={board._id}
                className={selectedBoardId === board._id ? 'active' : ''}
                onClick={() => setSelectedBoardId(board._id)}
              >
                {board.title || 'Untitled board'}
              </button>
            ))}
            {!boards.length ? <p className="muted">No boards yet</p> : null}
          </div>
          {isAdmin && selectedBoardId ? (
            <>
              <button className="danger" onClick={handleDeleteBoard} disabled={loading}>
                Delete selected board
              </button>
              <form className="inline" onSubmit={handleAddUserToBoard}>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={loading || !users.length}>Add user</button>
              </form>
            </>
          ) : null}
        </div>

        <div className="card">
          <h2>{selectedBoard ? selectedBoard.title : 'Tasks'}</h2>
          <form className="stack" onSubmit={handleCreateTask}>
            <input
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <input
              placeholder="Description"
              value={taskForm.description}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <select
              value={taskForm.status}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="todo">todo</option>
              <option value="in-progress">in-progress</option>
              <option value="done">done</option>
            </select>
            <button type="submit" disabled={loading || !selectedBoardId}>Add task</button>
          </form>

          <div className="kanban">
            {statuses.map((status) => (
              <section
                key={status}
                className="kanban-column"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDropTask(event, status)}
              >
                <h3>{status}</h3>
                {tasks.filter((task) => task.status === status).map((task) => (
                  <article
                    key={task._id}
                    className="task-card"
                    draggable={canEditTask(task)}
                    onDragStart={() => setDraggingTaskId(task._id)}
                  >
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.description || 'No description'}</p>
                    </div>
                    <div className="inline">
                      <select
                        value={task.status}
                        disabled={!canEditTask(task)}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      >
                        <option value="todo">todo</option>
                        <option value="in-progress">in-progress</option>
                        <option value="done">done</option>
                      </select>
                      <button
                        className="danger"
                        onClick={() => handleDeleteTask(task._id)}
                        disabled={!isAdmin}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            ))}
          </div>
          {message ? <p className="info">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default App;
