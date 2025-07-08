import { VoiceControls } from "./VoiceControls";
import { ParticipantList } from "./ParticipantList";

export function VoicePanel() {
  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <h2 className="font-semibold text-lg">Voice Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <VoiceControls />
        <ParticipantList />
      </div>
    </div>
  );
}