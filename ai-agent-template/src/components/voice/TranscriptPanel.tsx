import { useEffect, useRef } from "react";
import { Card } from "@/components/card/Card";
import { Button } from "@/components/button/Button";
import { Avatar } from "@/components/avatar/Avatar";
import { useVoice } from "@/providers/VoiceProvider";
import { Trash, Download, Copy } from "@phosphor-icons/react";

export function TranscriptPanel() {
  const { transcripts, isTranscribing, clearTranscripts } = useVoice();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  const handleCopyTranscripts = () => {
    const transcriptText = transcripts
      .filter(t => t.isComplete)
      .map(t => `${t.participantName}: ${t.text}`)
      .join('\n');
    
    navigator.clipboard.writeText(transcriptText);
  };

  const handleDownloadTranscripts = () => {
    const transcriptText = transcripts
      .filter(t => t.isComplete)
      .map(t => `[${t.timestamp.toLocaleString()}] ${t.participantName}: ${t.text}`)
      .join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col bg-white dark:bg-neutral-900">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Voice Transcripts</h3>
            {isTranscribing && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-500">Recording</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={handleCopyTranscripts}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={transcripts.length === 0}
            >
              <Copy size={14} />
            </Button>
            <Button
              onClick={handleDownloadTranscripts}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={transcripts.length === 0}
            >
              <Download size={14} />
            </Button>
            <Button
              onClick={clearTranscripts}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={transcripts.length === 0}
            >
              <Trash size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {transcripts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <Copy size={20} className="text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">Mock transcripts loaded</p>
            <p className="text-neutral-400 text-xs mt-1">
              {isTranscribing ? "Real transcription active - start speaking!" : "Click 'Start Transcription' to enable real voice-to-text"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transcripts.map((transcript) => (
              <TranscriptItem key={transcript.id} transcript={transcript} />
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>
    </Card>
  );
}

interface TranscriptItemProps {
  transcript: {
    id: string;
    participantId: string;
    participantName: string;
    text: string;
    timestamp: Date;
    isComplete: boolean;
  };
}

function TranscriptItem({ transcript }: TranscriptItemProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-3 group">
      <div className="flex-shrink-0 mt-1">
        <Avatar username={transcript.participantName} size="sm" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{transcript.participantName}</span>
          <span className="text-xs text-neutral-500">
            {formatTime(transcript.timestamp)}
          </span>
          {!transcript.isComplete && (
            <span className="text-xs text-blue-500 font-medium">Speaking...</span>
          )}
        </div>
        
        <div className={`text-sm ${
          transcript.isComplete 
            ? "text-neutral-900 dark:text-neutral-100" 
            : "text-neutral-600 dark:text-neutral-400 italic"
        }`}>
          {transcript.text}
          {!transcript.isComplete && (
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
          )}
        </div>
      </div>
    </div>
  );
}