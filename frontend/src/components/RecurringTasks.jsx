import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "../context/ToastContext";

const RecurringTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const { showToast } = useToast();
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    frequency_days: 30,
    department: "Maintenance",
    next_run_date: new Date().toISOString().split("T")[0],
  });
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/recurring-tasks",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingTask) {
        await axios.put(
          `http://localhost:5000/recurring-tasks/${editingTask.id}`,
          newTask,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("http://localhost:5000/recurring-tasks", newTask, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
      setNewTask({
        title: "",
        description: "",
        frequency_days: 30,
        department: "Maintenance",
        next_run_date: new Date().toISOString().split("T")[0],
      });
      showToast(
        editingTask ? "Task updated successfully" : "Task created successfully",
        "success"
      );
    } catch (error) {
      console.error("Error saving task:", error);
      showToast("Error saving task", "error");
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      frequency_days: task.frequency_days,
      department: task.assigned_dept || "Maintenance",
      next_run_date: task.next_run_date,
    });
    setShowForm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTask) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/recurring-tasks/${deleteTask.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchTasks();
      showToast("Task deleted successfully", "success");
      setDeleteTask(null); // Close the modal after successful deletion
    } catch (error) {
      console.error("Error deleting task:", error);
      showToast("Error deleting task", "error");
    }
  };

  const handleRunScheduler = async () => {
    try {
      setSchedulerStatus("Running...");
      const response = await axios.post(
        "http://localhost:5000/scheduler/check"
      );
      setSchedulerStatus(response.data.message);
      fetchTasks(); // Refresh to see updated next_run_dates
      setTimeout(() => setSchedulerStatus(null), 3000);
    } catch (error) {
      console.error("Error running scheduler:", error);
      setSchedulerStatus("Error running scheduler");
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Recurring Maintenance
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRunScheduler}
            className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Run Scheduler
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingTask(null);
              setNewTask({
                title: "",
                description: "",
                frequency_days: 30,
                department: "Maintenance",
                next_run_date: new Date().toISOString().split("T")[0],
              });
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {showForm && !editingTask ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {showForm && !editingTask ? "Cancel" : "New Task"}
          </button>
        </div>
      </div>

      {schedulerStatus && (
        <div className="mb-4 p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4" />
          {schedulerStatus}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreateOrUpdateTask}
          className="mb-6 p-4 bg-surface border border-white/5 rounded-xl animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              {editingTask ? "Edit Task" : "New Task"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Task Title
              </label>
              <input
                type="text"
                className="input-premium"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Department
              </label>
              <select
                className="input-premium"
                value={newTask.department}
                onChange={(e) =>
                  setNewTask({ ...newTask, department: e.target.value })
                }
              >
                <option>Maintenance</option>
                <option>Security</option>
                <option>Housekeeping</option>
                <option>IT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Frequency (Days)
              </label>
              <input
                type="number"
                className="input-premium"
                value={newTask.frequency_days}
                onChange={(e) =>
                  setNewTask({ ...newTask, frequency_days: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Next Run Date
              </label>
              <input
                type="date"
                className="input-premium"
                value={newTask.next_run_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, next_run_date: e.target.value })
                }
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Description
              </label>
              <textarea
                className="input-premium"
                rows="2"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary py-1.5 px-4 text-sm">
              {editingTask ? "Update Task" : "Save Task"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-white/5">
              <th className="pb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Task
              </th>
              <th className="pb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Frequency
              </th>
              <th className="pb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Next Run
              </th>
              <th className="pb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Department
              </th>
              <th className="pb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-zinc-500">
                  Loading...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-zinc-500">
                  No recurring tasks set.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="py-3">
                    <div className="font-medium text-zinc-200">
                      {task.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {task.description}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-zinc-400">
                    Every {task.frequency_days} days
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-md border ${
                        new Date(task.next_run_date) <= new Date()
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-success/10 text-success border-success/20"
                      }`}
                    >
                      {task.next_run_date}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-zinc-400">
                    {task.assigned_dept}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(task)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTask(task)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTask?.title}"? This action cannot be undone.`}
        isDanger={true}
        confirmText="Delete"
      />
    </div>
  );
};

export default RecurringTasks;
