const STORAGE_KEY = "flowlist-tasks";
const FILTER_LABELS = {
  all: "All tasks",
  active: "Active tasks",
  completed: "Completed tasks"
};

const initialTasks = [
  {
    id: crypto.randomUUID(),
    text: "Wireframe landing page sections",
    completed: true,
    createdAt: Date.now() - 300000,
    dueDate: getRelativeDate(0),
    dueTime: "09:00"
  },
  {
    id: crypto.randomUUID(),
    text: "Write product copy for hero",
    completed: false,
    createdAt: Date.now() - 200000,
    dueDate: getRelativeDate(0),
    dueTime: "10:30"
  },
  {
    id: crypto.randomUUID(),
    text: "Review mobile spacing system",
    completed: false,
    createdAt: Date.now() - 100000,
    dueDate: getRelativeDate(1),
    dueTime: "13:00"
  },
  {
    id: crypto.randomUUID(),
    text: "Send status update to team",
    completed: true,
    createdAt: Date.now(),
    dueDate: getRelativeDate(0),
    dueTime: "17:00"
  }
];

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const dateInput = document.querySelector("#task-date");
const timeInput = document.querySelector("#task-time");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const filterButtons = document.querySelectorAll(".filter-chip");
const markAllButton = document.querySelector("#mark-all-btn");
const clearCompletedButton = document.querySelector("#clear-completed-btn");
const startOrganizingLink = document.querySelector("#start-organizing-link");
const viewTasksLink = document.querySelector("#view-tasks-link");
const planDayLink = document.querySelector("#plan-day-link");
const taskPanel = document.querySelector("#task-panel");
const workspacePill = document.querySelector("#workspace-pill");
const progressValue = document.querySelector("#progress-value");
const progressFill = document.querySelector("#progress-fill");
const completedCount = document.querySelector("#completed-count");
const activeCount = document.querySelector("#active-count");
const pendingCount = document.querySelector("#pending-count");
const totalCount = document.querySelector("#total-count");
const totalTasksStat = document.querySelector("#total-tasks-stat");
const completedTasksStat = document.querySelector("#completed-tasks-stat");
const completionRateStat = document.querySelector("#completion-rate-stat");

let tasks = loadTasks();
let currentFilter = getInitialFilter();

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now(),
    dueDate: dateInput?.value || "",
    dueTime: timeInput?.value || ""
  });

  input.value = "";
  if (dateInput) {
    dateInput.value = "";
  }
  if (timeInput) {
    timeInput.value = "";
  }
  saveTasks();
  render();
  input.focus();
});

taskList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-action='toggle']");
  const deleteButton = event.target.closest("[data-action='delete']");

  if (toggleButton) {
    const taskId = toggleButton.closest(".task-item")?.dataset.taskId;
    toggleTask(taskId);
  }

  if (deleteButton) {
    const taskId = deleteButton.closest(".task-item")?.dataset.taskId;
    deleteTask(taskId);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter || "all";
    render();
  });
});

markAllButton.addEventListener("click", () => {
  if (!tasks.length) {
    input.focus();
    return;
  }

  tasks = tasks.map((task) => ({ ...task, completed: true }));
  saveTasks();
  render();
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

function loadTasks() {
  const storedTasks = localStorage.getItem(STORAGE_KEY);

  if (!storedTasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
    return initialTasks;
  }

  try {
    const parsedTasks = JSON.parse(storedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : initialTasks;
  } catch {
    return initialTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => (
    task.id === taskId ? { ...task, completed: !task.completed } : task
  ));

  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function render() {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const activeTasks = tasks.length - completedTasks;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = filteredTasks.map(createTaskMarkup).join("");
  emptyState.hidden = filteredTasks.length > 0;
  emptyState.textContent = getEmptyStateMessage();

  taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? "item" : "items"}`;
  progressValue.textContent = `${completionRate}%`;
  progressFill.style.width = `${completionRate}%`;

  completedCount.textContent = completedTasks;
  activeCount.textContent = activeTasks;
  pendingCount.textContent = activeTasks;
  totalCount.textContent = tasks.length;

  totalTasksStat.textContent = tasks.length;
  completedTasksStat.textContent = completedTasks;
  completionRateStat.textContent = `${completionRate}%`;

  if (workspacePill) {
    workspacePill.textContent = FILTER_LABELS[currentFilter] || FILTER_LABELS.all;
  }

  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === currentFilter);
  });

  markAllButton.disabled = !tasks.length || completedTasks === tasks.length;
  clearCompletedButton.disabled = completedTasks === 0;
}

function createTaskMarkup(task) {
  const icon = task.completed ? "images/checked.png" : "images/unchecked.png";
  const status = task.completed ? "Done" : "Active";
  const stateClass = task.completed ? "task-item checked" : "task-item";
  const toggleLabel = task.completed ? "Mark task as incomplete" : "Mark task as complete";
  const dueState = getDueState(task);
  const dueMarkup = dueState.label
    ? `<span class="task-meta ${dueState.className}">${escapeHtml(dueState.label)}</span>`
    : "";

  return `
    <article class="${stateClass}" data-task-id="${task.id}">
      <button class="task-toggle" type="button" data-action="toggle" aria-label="${toggleLabel}">
        <img src="${icon}" alt="">
      </button>
      <div class="task-copy">
        <span>${escapeHtml(task.text)}</span>
        ${dueMarkup}
      </div>
      <small>${status}</small>
      <button class="task-action" type="button" data-action="delete" aria-label="Delete task">Delete</button>
    </article>
  `;
}

function escapeHtml(value) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return value.replace(/[&<>"']/g, (character) => map[character]);
}

function getFilteredTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function getEmptyStateMessage() {
  if (currentFilter === "active") {
    return "No active tasks right now. You're all caught up.";
  }

  if (currentFilter === "completed") {
    return "No completed tasks yet. Finish one to see it here.";
  }

  return "No tasks yet. Add your first one above and start organizing.";
}

function getInitialFilter() {
  const params = new URLSearchParams(window.location.search);
  const viewFromUrl = params.get("view");
  const viewFromBody = document.body.dataset.defaultFilter;
  const candidate = viewFromUrl || viewFromBody || "all";

  if (candidate === "active" || candidate === "completed" || candidate === "all") {
    return candidate;
  }

  return "all";
}

function getDueState(task) {
  if (!task.dueDate && !task.dueTime) {
    return { label: "", className: "" };
  }

  const label = formatDueLabel(task.dueDate, task.dueTime);
  if (!task.dueDate) {
    return { label, className: "" };
  }

  const dueDateTime = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(dueDateTime.getFullYear(), dueDateTime.getMonth(), dueDateTime.getDate());

  if (!task.completed && dueDateTime < now) {
    return { label, className: "is-overdue" };
  }

  if (dueDay.getTime() === today.getTime()) {
    return { label, className: "is-today" };
  }

  if (dueDay > today) {
    return { label, className: "is-upcoming" };
  }

  return { label, className: "" };
}

function formatDueLabel(dueDate, dueTime) {
  const parts = [];

  if (dueDate) {
    const date = new Date(`${dueDate}T00:00`);
    parts.push(new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date));
  }

  if (dueTime) {
    const [hours = "0", minutes = "0"] = dueTime.split(":");
    const time = new Date();
    time.setHours(Number(hours), Number(minutes), 0, 0);
    parts.push(new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(time));
  }

  return parts.join(" at ");
}

function getRelativeDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}
