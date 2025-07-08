import { Card } from "@/components/card/Card";
import { Button } from "@/components/button/Button";
import { Avatar } from "@/components/avatar/Avatar";
import { CheckCircle, Circle, Plus, Calendar, User } from "@phosphor-icons/react";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
}

interface RightPanelProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask: () => void;
  onAssignTask: (taskId: string, userId: string) => void;
}

export function RightPanel({ 
  tasks, 
  onToggleTask, 
  onAddTask, 
  onAssignTask 
}: RightPanelProps) {
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Tasks</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddTask}
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleTask(task.id)}
                      onAssign={onAssignTask}
                    />
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => onToggleTask(task.id)}
                      onAssign={onAssignTask}
                    />
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

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onAssign: (taskId: string, userId: string) => void;
}

function TaskCard({ task, onToggle, onAssign }: TaskCardProps) {
  return (
    <Card className="p-3 bg-white dark:bg-neutral-800">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          {task.completed ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <Circle size={16} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${
            task.completed ? 'line-through text-neutral-500' : ''
          }`}>
            {task.title}
          </h4>
          
          {task.description && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <User size={12} className="text-neutral-400" />
              <Avatar username={task.assignedTo} size="sm" />
              <span className="text-xs text-neutral-500">{task.assignedTo}</span>
            </div>
            
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">
                  {task.deadline.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}