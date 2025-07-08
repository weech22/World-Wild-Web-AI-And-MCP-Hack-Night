import { ModalProvider } from "@/providers/ModalProvider";
import { TooltipProvider } from "@/providers/TooltipProvider";
import { TaskProvider } from "@/providers/TaskProvider";
import { ReferenceProvider } from "@/providers/ReferenceProvider";
import { VoiceProvider } from "@/providers/VoiceProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <ModalProvider>
        <TaskProvider>
          <ReferenceProvider>
            <VoiceProvider>
              {children}
            </VoiceProvider>
          </ReferenceProvider>
        </TaskProvider>
      </ModalProvider>
    </TooltipProvider>
  );
};
