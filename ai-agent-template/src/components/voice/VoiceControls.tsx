import { useState } from "react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { useVoice } from "@/providers/VoiceProvider";
import { 
  Microphone, 
  MicrophoneSlash, 
  SpeakerHigh, 
  SpeakerSlash, 
  Phone, 
  PhoneSlash,
  Waveform,
  ChatCircle
} from "@phosphor-icons/react";

export function VoiceControls() {
  const {
    isConnected,
    isConnecting,
    isMuted,
    isDeafened,
    volume,
    participants,
    localParticipant,
    isTranscribing,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleDeafen,
    setVolume,
    startTranscription,
    stopTranscription
  } = useVoice();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const handleJoinRoom = async () => {
    if (userName.trim()) {
      await joinRoom("main-room", userName.trim());
      setShowJoinModal(false);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const handleToggleTranscription = () => {
    if (isTranscribing) {
      stopTranscription();
    } else {
      startTranscription();
    }
  };

  if (!isConnected && !isConnecting) {
    return (
      <Card className="p-4 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Voice Chat</h3>
        </div>
        
        {!showJoinModal ? (
          <div className="space-y-2">
            <Button
              onClick={() => setShowJoinModal(true)}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Phone size={16} />
              Join Voice Room
            </Button>
            <div className="text-xs text-center text-neutral-500">
              🎙️ Voice chat ready for testing!
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-sm bg-white dark:bg-neutral-900"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleJoinRoom}
                disabled={!userName.trim()}
                className="flex-1"
              >
                Join Voice Chat
              </Button>
              <Button
                onClick={() => setShowJoinModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Voice Chat</h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600 dark:text-green-400">
            {isConnecting ? "Connecting..." : "Connected"}
          </span>
        </div>
      </div>

      {/* Participant count */}
      <div className="mb-4">
        <span className="text-xs text-neutral-500">
          {participants.length + (localParticipant ? 1 : 0)} participants connected
        </span>
        <div className="text-xs text-neutral-400 mt-1">
          Open multiple tabs to test voice chat
        </div>
      </div>

      {/* Voice controls */}
      <div className="flex items-center gap-2 mb-4">
        {/* Mute/Unmute */}
        <Button
          onClick={toggleMute}
          variant={isMuted ? "default" : "outline"}
          size="sm"
          className={`flex items-center gap-2 ${isMuted ? "bg-red-500 hover:bg-red-600" : ""}`}
        >
          {isMuted ? <MicrophoneSlash size={16} /> : <Microphone size={16} />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>

        {/* Deafen/Undeafen */}
        <Button
          onClick={toggleDeafen}
          variant={isDeafened ? "default" : "outline"}
          size="sm"
          className={`flex items-center gap-2 ${isDeafened ? "bg-red-500 hover:bg-red-600" : ""}`}
        >
          {isDeafened ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
        </Button>

        {/* Volume control */}
        <div className="relative">
          <Button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <SpeakerHigh size={16} />
            {Math.round(volume * 100)}%
          </Button>
          
          {showVolumeSlider && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Transcription toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={handleToggleTranscription}
          variant={isTranscribing ? "default" : "outline"}
          size="sm"
          className={`flex items-center gap-2 ${isTranscribing ? "bg-blue-500 hover:bg-blue-600" : ""}`}
        >
          {isTranscribing ? <Waveform size={16} /> : <ChatCircle size={16} />}
          {isTranscribing ? "Stop Transcription" : "Start Transcription"}
        </Button>
      </div>

      {/* Leave room */}
      <Button
        onClick={handleLeaveRoom}
        variant="outline"
        size="sm"
        className="w-full flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <PhoneSlash size={16} />
        Leave Room
      </Button>
    </Card>
  );
}