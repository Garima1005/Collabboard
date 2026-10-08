const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const registerUser = (payload) => {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const loginUser = (payload) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const getMe = () => request('/auth/me');

export const logoutUser = () => {
  return request('/auth/logout', { method: 'POST' });
};

export const getBoards = () => request('/boards');

export const createBoard = (title) => {
  return request('/boards', {
    method: 'POST',
    body: JSON.stringify({ title })
  });
};

export const deleteBoard = (id) => {
  return request(`/boards/${id}`, { method: 'DELETE' });
};

export const addUserToBoard = (boardId, userId) => {
  return request(`/boards/${boardId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const getTasks = (boardId) => request(`/tasks/${boardId}`);

export const createTask = (payload) => {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateTask = (id, payload) => {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteTask = (id) => {
  return request(`/tasks/${id}`, {
    method: 'DELETE'
  });
};

export const getUsers = () => request('/users');
