import './style.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const list = document.querySelector('#task-list');
const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const descriptionInput = document.querySelector('#task-description');
const dateInput = document.querySelector('#task-date');
const message = document.querySelector('#message');
let tasks = [];
let currentFilter = 'all';

const dateNow = new Date();
document.querySelector('#today-label').textContent = dateNow.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

function setMessage(text = '', isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function formatDate(date) {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { const body = await response.json(); detail = body.message || body.error || detail; } catch { /* response may not be JSON */ }
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}
function render() {
  const completed = tasks.filter((task) => task.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  document.querySelector('#progress-percent').textContent = `${percent}%`;
  document.querySelector('#progress-bar').style.width = `${percent}%`;
  document.querySelector('#progress-caption').textContent = tasks.length ? `${completed} of ${tasks.length} tasks completed` : 'Every completed task is a win.';
  document.querySelector('#task-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  document.querySelectorAll('.filter').forEach((button) => button.classList.toggle('active', button.dataset.filter === currentFilter));
  const visible = tasks.filter((task) => currentFilter === 'all' || (currentFilter === 'completed' ? task.completed : !task.completed));
  if (!visible.length) {
    const emptyTitle = tasks.length ? 'Nothing in this view' : 'A fresh start';
    const emptyCopy = tasks.length ? 'Try another filter to see your tasks.' : 'Add your first task above and make a little progress.';
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">✧</span><h3>${emptyTitle}</h3><p>${emptyCopy}</p></div>`;
    return;
  }
  list.innerHTML = visible.map((task) => `
    <article class="task-item ${task.completed ? 'is-complete' : ''}" data-id="${task.id}">
      <button class="check-button" type="button" data-action="toggle" aria-label="${task.completed ? 'Reopen' : 'Complete'} ${escapeHtml(task.title)}">${task.completed ? '✓' : ''}</button>
      <div class="task-content"><h3>${escapeHtml(task.title)}</h3>${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}${task.dueDate ? `<span class="due-date">◷ ${escapeHtml(formatDate(task.dueDate))}</span>` : ''}</div>
      <button class="delete-button" type="button" data-action="delete" aria-label="Delete ${escapeHtml(task.title)}" title="Delete task">×</button>
    </article>`).join('');
}
async function loadTasks() {
  list.innerHTML = '<div class="loading">Loading your tasks…</div>';
  try { tasks = await request('/tasks'); render(); setMessage(); }
  catch (error) { list.innerHTML = '<div class="empty-state"><h3>Could not load tasks</h3><p>Check your backend URL and database connection, then refresh.</p></div>'; setMessage(`${error.message}. API: ${API_BASE}`, true); }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) { setMessage('Please enter a task title.', true); return; }
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const created = await request('/tasks', { method: 'POST', body: JSON.stringify({ title, description: descriptionInput.value.trim(), dueDate: dateInput.value || null }) });
    tasks.unshift(created); form.reset(); render(); setMessage('Task added — nice start!'); titleInput.focus();
  } catch (error) { setMessage(`Could not add task: ${error.message}`, true); }
  finally { submitButton.disabled = false; }
});
document.querySelector('.filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  currentFilter = button.dataset.filter; render();
});
list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = button.closest('[data-id]');
  const id = item?.dataset.id;
  const task = tasks.find((candidate) => String(candidate.id) === String(id));
  if (!task) return;
  button.disabled = true;
  try {
    if (button.dataset.action === 'toggle') {
      const updated = await request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ completed: !task.completed }) });
      tasks = tasks.map((candidate) => String(candidate.id) === String(id) ? updated : candidate);
      setMessage(updated.completed ? 'Task completed. Well done!' : 'Task moved back to your to-do list.');
    } else {
      await request(`/tasks/${id}`, { method: 'DELETE' });
      tasks = tasks.filter((candidate) => String(candidate.id) !== String(id));
      setMessage('Task deleted.');
    }
    render();
  } catch (error) { setMessage(`Could not update task: ${error.message}`, true); button.disabled = false; }
});
loadTasks();
