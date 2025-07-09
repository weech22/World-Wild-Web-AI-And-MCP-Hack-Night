import { Button } from "@/components/button/Button";
import { useTask } from "@/providers/TaskProvider";
import { TaskCard } from "@/components/task/TaskCard";
import { Circle, Plus } from "@phosphor-icons/react";

export function RightPanel() {
  const { tasks, addTask } = useTask();
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  const handleAddTask = () => {
    const taskName = window.prompt("Enter task name:");
    
    if (taskName && taskName.trim()) {
      addTask({
        title: taskName.trim(),
        description: "Click to edit this task",
        assignedTo: "Unassigned",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        completed: false
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Tasks</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddTask}
            className="h-8 w-8 p-0"
          >
            <Plus size={16} />
          </Button>
        </div>
        
        <div className="flex gap-4 text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            {pendingTasks.length} pending
          </span>
          <span className="text-neutral-600 dark:text-neutral-400">
            {completedTasks.length} completed
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Circle size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-neutral-500 text-sm">No tasks yet</p>
            <p className="text-neutral-400 text-xs mt-1">
              AI will create tasks as you chat
            </p>
          </div>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-neutral-700 dark:text-neutral-300">
                  Pending Tasks
                </h3>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
            
            {completedTasks.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3 text-neutral-700 dark:text-neutral-300">
                  Completed Tasks
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}