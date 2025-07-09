import { useState } from "react";
import { Button } from "@/components/button/Button";
import { Input } from "@/components/input/Input";
import { Modal } from "@/components/modal/Modal";

interface UserNameModalProps {
  isOpen: boolean;
  onSubmit: (userName: string) => void;
}

export function UserNameModal({ isOpen, onSubmit }: UserNameModalProps) {
  const [userName, setUserName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onSubmit(userName.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Enter Your Name</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Please enter your name to join the collaboration room.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full"
            autoFocus
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={!userName.trim()}
          >
            Join Room
          </Button>
        </form>
      </div>
    </Modal>
  );
}