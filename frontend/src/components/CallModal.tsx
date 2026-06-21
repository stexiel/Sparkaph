import React, { useState } from "react";
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import { API_URL, APPS_URL, WS_URL } from '../config';
interface CallModalProps {
  stream: MediaStream | null;
  callAccepted: boolean;
  callEnded: boolean;
  userVideo: React.RefObject<HTMLVideoElement>;
  myVideo: React.RefObject<HTMLVideoElement>;
  name: string;
  leaveCall: () => void;
  answerCall: () => void;
  receivingCall: boolean;
  isVideo: boolean;
}

const CallModal: React.FC<CallModalProps> = ({
  stream,
  callAccepted,
  callEnded,
  userVideo,
  myVideo,
  name,
  leaveCall,
  answerCall,
  receivingCall,
  isVideo,
}) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraOn;
        setCameraOn(!cameraOn);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4 md:p-6 w-full max-w-4xl flex flex-col items-center mx-4 md:mx-0">
        <h2 className="font-semibold text-base md:text-xl text-white mb-4 md:mb-6 text-center">
          {receivingCall && !callAccepted
            ? `INCOMING CALL FROM ${name}...`
            : `CALL WITH ${name}`}
        </h2>

        <div className="flex flex-col md:flex-row gap-4 w-full justify-center mb-6 md:mb-8 relative">
          {/* My Video */}
          {stream && (
            <div className="relative rounded-xl overflow-hidden border-2 border-[#FF9500] w-full md:w-1/2 aspect-video bg-black">
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                YOU
              </span>
            </div>
          )}

          {/* User Video */}
          {callAccepted && !callEnded && (
            <div className="relative rounded-xl overflow-hidden border-2 border-[#007AFF] w-full md:w-1/2 aspect-video bg-black">
              <video
                playsInline
                ref={userVideo}
                autoPlay
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                {name}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 md:gap-6">
          {receivingCall && !callAccepted ? (
            <button
              onClick={answerCall}
              className="bg-[#34C759] hover:bg-[#2DB84D] text-white p-3 md:p-4 rounded-full transition-colors animate-pulse"
            >
              <Phone size={28} className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          ) : (
            <>
              <button
                onClick={toggleMic}
                className={`p-3 md:p-4 rounded-full transition-colors ${micOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/20 text-red-500"}`}
              >
                {micOn ? (
                  <Mic size={22} className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <MicOff size={22} className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>

              {isVideo && (
                <button
                  onClick={toggleCamera}
                  className={`p-3 md:p-4 rounded-full transition-colors ${cameraOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/20 text-red-500"}`}
                >
                  {cameraOn ? (
                    <Video size={22} className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <VideoOff size={22} className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
              )}

              <button
                onClick={leaveCall}
                className="bg-[#FF3B30] hover:bg-[#D32F2A] text-white p-3 md:p-4 rounded-full transition-colors"
              >
                <PhoneOff size={28} className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
