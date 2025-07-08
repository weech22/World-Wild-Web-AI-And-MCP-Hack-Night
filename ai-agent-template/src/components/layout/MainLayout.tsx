import { ReactNode, useState } from "react";
import { Button } from "@/components/button/Button";
import { List, X, Microphone } from "@phosphor-icons/react";

interface MainLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  voicePanel?: ReactNode;
}

export function MainLayout({ leftPanel, centerPanel, rightPanel, voicePanel }: MainLayoutProps) {
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  return (
    <div className="h-[100vh] w-full flex bg-neutral-50 dark:bg-neutral-900">
      {/* Left Panel - Hidden on mobile/tablet, visible on desktop */}
      <div className="hidden lg:block w-64 border-r border-neutral-300 dark:border-neutral-800 overflow-y-auto">
        {leftPanel}
      </div>
      
      {/* Mobile Left Panel Overlay */}
      {showLeftPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-800 overflow-y-auto">
            <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeftPanel(false)}
                className="ml-auto"
              >
                <X size={16} />
              </Button>
            </div>
            {leftPanel}
          </div>
          <div 
            className="flex-1 bg-black/50"
            onClick={() => setShowLeftPanel(false)}
          />
        </div>
      )}
      
      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile navigation buttons */}
        <div className="lg:hidden flex items-center justify-between p-2 border-b border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLeftPanel(true)}
            className="flex items-center gap-2"
          >
            <List size={16} />
            <span className="text-sm">References</span>
          </Button>
          
          {voicePanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoicePanel(true)}
              className="flex items-center gap-2"
            >
              <Microphone size={16} />
              <span className="text-sm">Voice</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRightPanel(true)}
            className="flex items-center gap-2"
          >
            <span className="text-sm">Tasks</span>
            <List size={16} />
          </Button>
        </div>
        
        {centerPanel}
      </div>
      
      {/* Right Panel - Hidden on mobile/tablet, visible on desktop */}
      <div className="hidden lg:block w-80 border-l border-neutral-300 dark:border-neutral-800 overflow-y-auto">
        {rightPanel}
      </div>
      
      {/* Voice Panel - Hidden on mobile/tablet, visible on desktop */}
      {voicePanel && (
        <div className="hidden lg:block w-80 border-l border-neutral-300 dark:border-neutral-800 overflow-y-auto">
          {voicePanel}
        </div>
      )}
      
      {/* Mobile Right Panel Overlay */}
      {showRightPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/50"
            onClick={() => setShowRightPanel(false)}
          />
          <div className="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-300 dark:border-neutral-800 overflow-y-auto">
            <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRightPanel(false)}
                className="ml-auto"
              >
                <X size={16} />
              </Button>
            </div>
            {rightPanel}
          </div>
        </div>
      )}
      
      {/* Mobile Voice Panel Overlay */}
      {showVoicePanel && voicePanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/50"
            onClick={() => setShowVoicePanel(false)}
          />
          <div className="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-300 dark:border-neutral-800 overflow-y-auto">
            <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoicePanel(false)}
                className="ml-auto"
              >
                <X size={16} />
              </Button>
            </div>
            {voicePanel}
          </div>
        </div>
      )}
    </div>
  );
}