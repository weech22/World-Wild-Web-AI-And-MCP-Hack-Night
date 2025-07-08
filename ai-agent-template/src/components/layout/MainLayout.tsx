import { ReactNode } from "react";

interface MainLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export function MainLayout({ leftPanel, centerPanel, rightPanel }: MainLayoutProps) {
  return (
    <div className="h-[100vh] w-full flex bg-neutral-50 dark:bg-neutral-900">
      <div className="w-64 border-r border-neutral-300 dark:border-neutral-800 overflow-y-auto">
        {leftPanel}
      </div>
      
      <div className="flex-1 flex flex-col">
        {centerPanel}
      </div>
      
      <div className="w-80 border-l border-neutral-300 dark:border-neutral-800 overflow-y-auto">
        {rightPanel}
      </div>
    </div>
  );
}