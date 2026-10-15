
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

    const completedCount = tasks.filter((task) => task.completed).length;

    
    const loadTasks = useCallback(async () => {
        const token = sessionStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        try {
            setError("");

            const data = await apiRequest<Task[]>("/tasks", {}, token);
            setTasks(data);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Unable to load tasks";

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
        void loadTasks();
    }, [loadTasks]);

    
    async function handleAddTask(
        event: React.FormEvent<HTMLFormElement>,
    ) {
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
            setError(
                err instanceof Error ? err.message : "Unable to add task",
            );
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
                previousTasks.map((item) =>
                    item.id === updatedTask.id ? updatedTask : item,
                ),
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to update task",
            );
        }
    }

    async function handleDeleteTask(taskId: number) {
        const token = sessionStorage.getItem("token");

        if (!token) {
            router.replace("/login");
            return;
        }

        try {
            setError("");

            await apiRequest(
                `/tasks/${taskId}`,
                { method: "DELETE" },
                token,
            );

            setTasks((previousTasks) =>
                previousTasks.filter((task) => task.id !== taskId),
            );

            if (editingTaskId === taskId) {
                cancelEditing();
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to delete task",
            );
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
    async function handleEditTask(
        event: React.FormEvent<HTMLFormElement>,
    ) {
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

            const currentTask = tasks.find(
                (task) => task.id === editingTaskId,
            );

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
                previousTasks.map((task) =>
                    task.id === updatedTask.id ? updatedTask : task,
                ),
            );

            cancelEditing();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update task",
            );
        } finally {
            setEditSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="text-slate-500">Loading your tasks...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-8">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600">
                            TASK MANAGER
                        </p>

                        <h1 className="mt-2 text-3xl font-bold">
                            My Dashboard
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Your tasks, loaded from PostgreSQL.
                        </p>
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

                {/* Task summary */}
                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <SummaryCard label="Total tasks" value={tasks.length} />

                    <SummaryCard
                        label="Completed"
                        value={completedCount}
                    />

                    <SummaryCard
                        label="Remaining"
                        value={tasks.length - completedCount}
                    />
                </section>

                {/* Error message */}
                {error && (
                    <p
                        role="alert"
                        className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
                    >
                        {error}
                    </p>
                )}

                {/* Create task form */}
                <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">
                        Create a task
                    </h2>

                    <form onSubmit={handleAddTask} className="space-y-4">
                        <input
                            required
                            maxLength={200}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Task title"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                        />

                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Description (optional)"
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                        />

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Add task"}
                        </button>
                    </form>
                </section>

                {/* Task list */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-semibold">
                        Your tasks
                    </h2>

                    {tasks.length === 0 ? (
                        <p className="py-8 text-center text-slate-500">
                            No tasks yet. Create your first task!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <article
                                    key={task.id}
                                    className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4"
                                >
                                    {/* Edit form: shown only for the selected task */}
                                    {editingTaskId === task.id ? (
                                        <form
                                            onSubmit={handleEditTask}
                                            className="w-full space-y-3"
                                        >
                                            <h3 className="font-semibold">
                                                Edit task
                                            </h3>

                                            <input
                                                required
                                                maxLength={200}
                                                value={editTitle}
                                                onChange={(event) =>
                                                    setEditTitle(event.target.value)
                                                }
                                                placeholder="Task title"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            />

                                            <textarea
                                                value={editDescription}
                                                onChange={(event) =>
                                                    setEditDescription(event.target.value)
                                                }
                                                placeholder="Task description"
                                                rows={3}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            />

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={editSaving}
                                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                                                >
                                                    {editSaving
                                                        ? "Saving..."
                                                        : "Save changes"}
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
                                        /* Normal task display */
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() =>
                                                        void handleToggleTask(task)
                                                    }
                                                    aria-label={`Mark ${task.title} as ${task.completed
                                                            ? "incomplete"
                                                            : "complete"
                                                        }`}
                                                    className="mt-1 h-4 w-4 accent-indigo-600"
                                                />

                                                <div>
                                                    <h3
                                                        className={`font-semibold ${task.completed
                                                                ? "text-slate-400 line-through"
                                                                : ""
                                                            }`}
                                                    >
                                                        {task.title}
                                                    </h3>

                                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
                                                        {task.description || "No description"}
                                                    </p>

                                                    <span
                                                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${task.completed
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-amber-50 text-amber-700"
                                                            }`}
                                                    >
                                                        {task.completed
                                                            ? "Completed"
                                                            : "Pending"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Edit and Delete buttons */}
                                            <div className="flex gap-2 self-start sm:self-center">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(task)}
                                                    className="rounded-lg border border-indigo-200 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleDeleteTask(task.id)
                                                    }
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
        </main>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
    );
}
