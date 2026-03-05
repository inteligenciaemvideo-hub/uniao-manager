import { useRef } from "react";
import { Camera } from "lucide-react";

interface PlayerAvatarProps {
  playerId: string;
  nickname: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onPhotoChange?: (playerId: string, url: string) => void;
  satisfaction?: string | null;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[9px]",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-xl",
};

const PlayerAvatar = ({ playerId, nickname, photoUrl, size = "md", editable = false, onPhotoChange, satisfaction }: PlayerAvatarProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      const url = URL.createObjectURL(file);
      onPhotoChange(playerId, url);
    }
  };

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center font-bold overflow-hidden cursor-pointer`}
        onClick={() => editable && fileRef.current?.click()}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={nickname} className="w-full h-full object-cover" />
        ) : (
          nickname.slice(0, 2).toUpperCase()
        )}
      </div>
      {editable && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Camera size={10} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
      {satisfaction && (
        <span className="absolute -bottom-1 -right-1 text-sm">{satisfaction}</span>
      )}
    </div>
  );
};

export default PlayerAvatar;