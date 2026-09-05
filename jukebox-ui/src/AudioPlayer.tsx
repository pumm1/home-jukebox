import { API_URL } from "./api/client";

interface AudioPlayerProps {
    path: string
}

export const AudioPlayer = ({ path }: AudioPlayerProps ) => {
  const src = `${API_URL}/stream/${encodeURI(path)}`

  return (
    <audio
      controls
      preload="metadata"
      src={src}
    />
  );
}