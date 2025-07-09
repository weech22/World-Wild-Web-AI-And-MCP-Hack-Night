import { createContext, useContext, useState, ReactNode, useEffect } from "react";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const { tasks: backendTasks, isApiAvailable } = useBackend();

  // Transform backend tasks to match our Task interface
  useEffect(() => {
    if (backendTasks && backendTasks.length >= 0) {
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
  }, [backendTasks]);

  const addTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
    console.log('📋 addTask called:', { taskData, isApiAvailable });
    
    // Always try the API call first, regardless of health check status
    try {
      console.log('Attempting POST to /api/tasks...');
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskData.title,
          details: taskData.description,
          assignee: taskData.assignedTo !== "Unassigned" ? taskData.assignedTo : undefined
        })
      });
      
      if (response.ok) {
        const newTask = await response.json();
        console.log('✅ Task creation API call successful:', newTask);
        // Task will be updated via Socket.IO or we can update local state
        return;
      } else {
        console.error('❌ Task creation API call failed with status:', response.status);
        throw new Error(`Failed to create task: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error creating task via API:', error);
      console.log('Falling back to local state...');
      
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
    console.log('📝 updateTask called:', { id, updates, isApiAvailable });
    
    // Always try the API call first, regardless of health check status
    try {
      console.log('Attempting PUT to /api/tasks/' + id);
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
      
      if (response.ok) {
        console.log('✅ Task update API call successful');
        // Task will be updated via Socket.IO or we can update local state
        return;
      } else {
        console.error('❌ Task update API call failed with status:', response.status);
        throw new Error(`Failed to update task: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error updating task via API:', error);
      console.log('Falling back to local state...');
      
      // Fallback to local state
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    }
  };

  const deleteTask = async (id: string) => {
    console.log('🗑️ deleteTask called:', { id, isApiAvailable });
    
    // Always try the API call first, regardless of health check status
    try {
      console.log('Attempting DELETE to /api/tasks/' + id);
      const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Task deletion API call successful');
        // Task will be updated via Socket.IO or we can update local state
        return;
      } else {
        console.error('❌ Task deletion API call failed with status:', response.status);
        throw new Error(`Failed to delete task: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting task via API:', error);
      console.log('Falling back to local state...');
      
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