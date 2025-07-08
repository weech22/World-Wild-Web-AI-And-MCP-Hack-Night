import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { MOCK_TASKS } from "@/constants/mockData";
import { useBackend } from "@/providers/BackendProvider";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  assignTask: (id: string, userId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const { tasks: backendTasks, isConnected } = useBackend();

  // Use backend tasks when available, fallback to mock data
  useEffect(() => {
    if (isConnected && backendTasks && backendTasks.length > 0) {
      // Transform backend tasks to match our Task interface
      const transformedTasks = backendTasks.map((task: any) => ({
        id: task.id.toString(),
        title: task.name,
        description: task.details || "",
        assignedTo: task.assignee || "Unassigned",
        deadline: undefined,
        completed: task.is_done || false,
        createdAt: new Date(task.created_at)
      }));
      setTasks(transformedTasks);
    }
  }, [backendTasks, isConnected]);

  const addTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
    if (isConnected) {
      try {
        const response = await fetch('http://localhost:3001/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: taskData.title,
            details: taskData.description,
            assignee: taskData.assignedTo !== "Unassigned" ? taskData.assignedTo : undefined
          })
        });
        if (!response.ok) throw new Error('Failed to create task');
      } catch (error) {
        console.error('Error creating task:', error);
      }
    } else {
      // Fallback to local state
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (isConnected) {
      try {
        const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: updates.title,
            details: updates.description,
            assignee: updates.assignedTo !== "Unassigned" ? updates.assignedTo : undefined,
            is_done: updates.completed
          })
        });
        if (!response.ok) throw new Error('Failed to update task');
      } catch (error) {
        console.error('Error updating task:', error);
      }
    } else {
      // Fallback to local state
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    }
  };

  const deleteTask = async (id: string) => {
    if (isConnected) {
      try {
        const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete task');
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    } else {
      // Fallback to local state
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      await updateTask(id, { completed: !task.completed });
    }
  };

  const assignTask = async (id: string, userId: string) => {
    await updateTask(id, { assignedTo: userId });
  };

  const value: TaskContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    assignTask,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
}