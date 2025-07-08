import { ModalProvider } from "@/providers/ModalProvider";
import { TooltipProvider } from "@/providers/TooltipProvider";
import { TaskProvider } from "@/providers/TaskProvider";
import { ReferenceProvider } from "@/providers/ReferenceProvider";
import { VoiceProvider } from "@/providers/VoiceProvider";
import { BackendProvider } from "@/providers/BackendProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <BackendProvider>
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
    </BackendProvider>
  );
};
