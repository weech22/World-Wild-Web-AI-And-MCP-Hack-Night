import { useTask } from "@/providers/TaskProvider";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Calendar, Clock, CheckCircle, Circle } from "@phosphor-icons/react";
import { useState } from "react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    assignedTo: string;
    deadline?: Date;
    completed: boolean;
    createdAt: Date;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const { toggleTask } = useTask();
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    toggleTask(task.id);
  };

  const isOverdue = task.deadline && task.deadline < new Date() && !task.completed;
  const isDueSoon = task.deadline && !task.completed && 
    task.deadline.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // 24 hours

  const getDeadlineColor = () => {
    if (task.completed) return "text-neutral-500";
    if (isOverdue) return "text-red-500";
    if (isDueSoon) return "text-yellow-600";
    return "text-neutral-600";
  };

  const formatDeadline = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card 
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        task.completed ? 'opacity-75 bg-neutral-50 dark:bg-neutral-800/50' : 'bg-white dark:bg-neutral-900'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`flex-shrink-0 mt-1 p-1 rounded-full transition-colors ${
            task.completed 
              ? 'text-green-500 hover:text-green-600' 
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          {task.completed ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header - Title and Assignee */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm leading-5 ${
              task.completed ? 'line-through text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'
            }`}>
              {task.title}
            </h3>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-neutral-500 hidden sm:block">
                {task.assignedTo}
              </span>
              <Avatar username={task.assignedTo} size="xs" />
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className={`text-xs leading-4 line-clamp-2 ${
              task.completed ? 'text-neutral-400' : 'text-neutral-600 dark:text-neutral-400'
            }`}>
              {task.description}
            </p>
          )}

          {/* Footer - Date and Status */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Deadline */}
              {task.deadline && (
                <div className={`flex items-center gap-1 text-xs ${getDeadlineColor()}`}>
                  <Calendar size={12} />
                  <span className="whitespace-nowrap">{formatDeadline(task.deadline)}</span>
                </div>
              )}
              
              {/* Overdue indicator */}
              {isOverdue && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <Clock size={12} />
                  <span>Overdue</span>
                </div>
              )}
            </div>

            {/* Mobile assignee name */}
            <div className="text-xs text-neutral-500 truncate max-w-[80px] sm:hidden">
              {task.assignedTo}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}