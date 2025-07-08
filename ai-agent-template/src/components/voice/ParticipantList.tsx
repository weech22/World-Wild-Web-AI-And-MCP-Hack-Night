import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { useVoice } from "@/providers/VoiceProvider";
import { 
  MicrophoneSlash, 
  SpeakerHigh, 
  SpeakerSlash,
  Waveform,
  Circle
} from "@phosphor-icons/react";

export function ParticipantList() {
  const { participants, localParticipant, isConnected } = useVoice();

  if (!isConnected) {
    return (
      <Card className="p-4 bg-white dark:bg-neutral-900">
        <h3 className="font-semibold text-sm mb-3">Participants</h3>
        <div className="text-center py-8">
          <Circle size={32} className="mx-auto mb-2 text-neutral-400" />
          <p className="text-neutral-500 text-sm">Not connected to voice</p>
        </div>
      </Card>
    );
  }

  const allParticipants = [
    ...(localParticipant ? [localParticipant] : []),
    ...participants
  ];

  return (
    <Card className="p-4 bg-white dark:bg-neutral-900">
      <h3 className="font-semibold text-sm mb-3">
        Participants ({allParticipants.length})
      </h3>
      
      <div className="space-y-2">
        {allParticipants.map((participant) => (
          <ParticipantItem key={participant.id} participant={participant} />
        ))}
      </div>
    </Card>
  );
}

interface ParticipantItemProps {
  participant: {
    id: string;
    name: string;
    isMuted: boolean;
    isCurrentUser: boolean;
    audioLevel: number;
    isConnected: boolean;
  };
}

function ParticipantItem({ participant }: ParticipantItemProps) {
  const getStatusColor = () => {
    if (!participant.isConnected) return "text-neutral-400";
    if (participant.audioLevel > 0.5) return "text-green-500";
    if (participant.audioLevel > 0.2) return "text-yellow-500";
    return "text-neutral-500";
  };

  const getStatusIcon = () => {
    if (!participant.isConnected) {
      return <Circle size={12} className="text-neutral-400" />;
    }
    if (participant.audioLevel > 0.1) {
      return <Waveform size={12} className={getStatusColor()} />;
    }
    return <Circle size={12} className="text-green-500" />;
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800">
      <div className="relative">
        <Avatar 
          username={participant.name} 
          size="sm"
          className={`${!participant.isConnected ? "opacity-50" : ""}`}
        />
        {participant.audioLevel > 0.1 && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm truncate ${
            participant.isCurrentUser ? "text-blue-600 dark:text-blue-400" : ""
          }`}>
            {participant.name}
            {participant.isCurrentUser && " (You)"}
          </span>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          {participant.isMuted && (
            <MicrophoneSlash size={10} className="text-red-500" />
          )}
          {!participant.isConnected && (
            <span className="text-xs text-neutral-400">Disconnected</span>
          )}
          {participant.isConnected && !participant.isMuted && (
            <span className="text-xs text-neutral-500">
              {participant.audioLevel > 0.1 ? "Speaking" : "Listening"}
            </span>
          )}
          {participant.isConnected && participant.isMuted && (
            <span className="text-xs text-red-500">Muted</span>
          )}
        </div>
      </div>
      
      {/* Audio level indicator */}
      {participant.isConnected && (
        <div className="flex flex-col gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${
                participant.audioLevel > (i + 1) * 0.2
                  ? "bg-green-500"
                  : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}