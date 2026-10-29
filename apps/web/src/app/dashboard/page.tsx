"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Task = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  ownerId: number;
};
type PaginatedTasksResponse = {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    totalTasks: number;
    totalPages: number;
  };
};
export default function DashboardPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const completedCount = tasks.filter((task) => task.completed).length;

  const filteredTasks = tasks
    .filter((task) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        task.title.toLowerCase().includes(searchText) ||
        (task.description ?? "").toLowerCase().includes(searchText);

      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && task.completed) ||
        (filter === "pending" && !task.completed);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => (sortOrder === "newest" ? b.id - a.id : a.id - b.id));
  const loadTasks = useCallback(async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");

      const result = await apiRequest<PaginatedTasksResponse>("/tasks", {}, token);

      setTasks(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load tasks";

      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("token")
      ) {
        sessionStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTasks();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTasks]);

  async function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = sessionStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const newTask = await apiRequest<Task>(
        "/tasks",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        },
        token,
      );

      setTasks((previousTasks) => [...previousTasks, newTask]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add task");
    } finally {
      setSaving(false);
    }
  }

  // Mark a task as completed or incomplete
  async function handleToggleTask(task: Task) {
    const token = sessionStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");

      const updatedTask = await apiRequest<Task>(
        `/tasks/${task.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            completed: !task.completed,
          }),
        },
        token,
      );

      setTasks((previousTasks) =>
        previousTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task");
    }
  }

  async function handleDeleteTask() {
    if (taskToDelete === null) return;

    const token = sessionStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await apiRequest(`/tasks/${taskToDelete}`, { method: "DELETE" }, token);

      setTasks((previousTasks) => previousTasks.filter((task) => task.id !== taskToDelete));

      if (editingTaskId === taskToDelete) {
        cancelEditing();
      }

      setTaskToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task");
    } finally {
      setDeleting(false);
    }
  }

  // Start editing a task
  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setError("");
  }

  // Cancel editing
  function cancelEditing() {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
  }

  // Save changes to an existing task
  async function handleEditTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingTaskId === null) return;

    const token = sessionStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setEditSaving(true);
      setError("");

      const currentTask = tasks.find((task) => task.id === editingTaskId);

      const updatedTask = await apiRequest<Task>(
        `/tasks/${editingTaskId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim(),
            completed: currentTask?.completed ?? false,
          }),
        },
        token,
      );

      setTasks((previousTasks) =>
        previousTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );

      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p role="status" aria-live="polite" className="text-slate-500">
          Loading your tasks...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">TASK MANAGER</p>

            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>

            <p className="mt-2 text-slate-500">Manage and track your tasks in one place.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("token");
              router.replace("/login");
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
          >
            Log out
          </button>
        </header>

        {/* Task Summary Cards */}
        <section
          aria-label="Task summary"
          className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          <SummaryCard label="Total tasks" value={tasks.length} />

          <SummaryCard label="Completed" value={completedCount} />

          <SummaryCard label="Remaining" value={tasks.length - completedCount} />
        </section>

        {/* Error Message */}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}

        {/* Create Task Form */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Create a task</h2>

          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="mb-2 block text-sm font-medium text-slate-700">
                Task title
              </label>

              <input
                id="task-title"
                name="title"
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter a task title"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              aria-label="Task description"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add task"}
            </button>
          </form>
        </section>

        {/* Task List */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-semibold">Your tasks</h2>

          {/* Search, Filter and Sort */}
          <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:self-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
              aria-label="Filter tasks"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-indigo-500"
            >
              <option value="all">All tasks</option>
              <option value="pending">Pending tasks</option>
              <option value="completed">Completed tasks</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
              aria-label="Sort tasks"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {/* Empty State or Filtered Tasks */}
          {filteredTasks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-lg font-medium text-slate-700">
                {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {tasks.length === 0
                  ? "Create your first task to get started."
                  : "Try changing your search or filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-lg border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm"
                >
                  {/* Edit Form */}
                  {editingTaskId === task.id ? (
                    <form onSubmit={handleEditTask} className="w-full space-y-3">
                      <h3 className="font-semibold">Edit task</h3>

                      <input
                        required
                        maxLength={200}
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        placeholder="Task title"
                        aria-label="Edit task title"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                      />

                      <textarea
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        placeholder="Task description"
                        aria-label="Edit task description"
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={editSaving}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {editSaving ? "Saving..." : "Save changes"}
                        </button>

                        <button
                          type="button"
                          disabled={editSaving}
                          onClick={cancelEditing}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Normal Task Display */
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => void handleToggleTask(task)}
                          aria-label={`Mark ${task.title} as ${
                            task.completed ? "incomplete" : "complete"
                          }`}
                          className="mt-1 h-4 w-4 accent-indigo-600"
                        />

                        <div className="min-w-0">
                          <h3
                            className={`break-words font-semibold ${
                              task.completed ? "text-slate-400 line-through" : "text-slate-800"
                            }`}
                          >
                            {task.title}
                          </h3>

                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-500">
                            {task.description || "No description"}
                          </p>

                          <span
                            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                              task.completed
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {task.completed ? "Completed" : "Pending"}
                          </span>
                        </div>
                      </div>

                      {/* Edit and Delete Buttons */}
                      <div className="flex shrink-0 gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          className="rounded-lg border border-indigo-200 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task.id)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {taskToDelete !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!deleting) setTaskToDelete(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.86 2.8 17.5A2 2 0 0 0 4.53 20.5h14.94a2 2 0 0 0 1.73-3L13.73 3.86a2 2 0 0 0-3.46 0Z"
                />
              </svg>
            </div>

            <h2 id="delete-dialog-title" className="text-xl font-bold text-slate-900">
              Delete this task?
            </h2>

            <p id="delete-dialog-description" className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete this task?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setTaskToDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteTask()}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
