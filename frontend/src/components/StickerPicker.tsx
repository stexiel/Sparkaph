import React from "react";
import { API_URL, APPS_URL, WS_URL } from '../config';
interface StickerPickerProps {
  onStickerClick: (stickerUrl: string) => void;
}

const stickers = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0HlHJGHe3yAMhdQY/giphy.gif",
  "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
  "https://media.giphy.com/media/l0HlMw7Y5e5Y556yQ/giphy.gif",
];

const StickerPicker: React.FC<StickerPickerProps> = ({ onStickerClick }) => {
  return (
    <div className="absolute bottom-16 right-0 z-50 w-56 h-56 md:w-64 md:h-64 ios-glass rounded-2xl p-4 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {stickers.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Sticker ${index + 1}`}
            className="w-full h-auto cursor-pointer hover:scale-110 transition-transform rounded-lg"
            onClick={() => onStickerClick(url)}
          />
        ))}
      </div>
    </div>
  );
};

export default StickerPicker;
