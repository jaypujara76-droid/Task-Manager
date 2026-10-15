
"use client";

import { useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Learn Next.js",
    description: "Understand App Router and components",
    status: "In Progress",
    priority: "High",
  },
  {
    id: 2,
    title: "Build Task API",
    description: "Complete Express CRUD endpoints",
    status: "Completed",
    priority: "High",
  },
  {
    id: 3,
    title: "Connect PostgreSQL",
    description: "Integrate Prisma with the database",
    status: "Pending",
    priority: "Medium",
  },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  function addTask() {
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      title: title.trim(),
      description: "No description added",
      status: "Pending",
      priority: "Medium",
    };

    setTasks((previousTasks) => [...previousTasks, newTask]);
    setTitle("");
  }

  function deleteTask(id: number) {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== id)
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            TASK MANAGER
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            My Dashboard
          </h1>
          <p className="mt-2 text-slate-500">
            Organize your work and keep track of your progress.
          </p>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total Tasks" value={tasks.length} />
          <SummaryCard label="Completed" value={completedTasks} />
          <SummaryCard
            label="Remaining"
            value={tasks.length - completedTasks}
          />
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Create a Task
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addTask();
              }}
              placeholder="Enter a task title..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <button
              type="button"
              onClick={addTask}
              className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
            >
              + Add Task
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Your Tasks</h2>

          <div className="space-y-3">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {task.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                      {task.status}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                      {task.priority} Priority
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 sm:self-center"
                >
                  Delete
                </button>
              </article>
            ))}

            {tasks.length === 0 && (
              <p className="py-8 text-center text-slate-500">
                No tasks yet. Create your first task!
              </p>
            )}
          </div>
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
