import { useCallback, useEffect, useRef, useState } from "react";

import {
  Mic,
  MicOff,
  RefreshCw,
  Video,
  VideoOff,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { isMobile } from "react-device-detect";
import type Peer from "simple-peer";
import { toast } from "sonner";

import { StreamServiceMsg } from "@CodeX/types/message";
import type { User } from "@CodeX/types/user";

import { storage } from "@/lib/services/storage";
import { userMap } from "@/lib/services/user-map";
import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import {
  switchAudioDevice,
  switchVideoDevice,
} from "@/components/webcam-stream/utils/media";

import { DeviceControls } from "./components/device-controls";
import { VideoControls } from "./components/video-controls";
import type { MediaDevice } from "./types";
import { rotateCamera, toggleCamera, toggleMic } from "./utils/controls";
import {
  enumerateDevices,
  handleDevicePermissionGranted,
  initDevices,
} from "./utils/device";
import { getMedia } from "./utils/media";
import { cleanupPeer, createPeer, handleSignal } from "./utils/peer";

interface WebcamStreamProps {
  users: User[];
}

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [hasRequestedPermissions, setHasRequestedPermissions] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream | null>
  >({});
  const [remoteMicStates, setRemoteMicStates] = useState<
    Record<string, boolean>
  >({});
  const [remoteSpeakerStates, setRemoteSpeakerStates] = useState<
    Record<string, boolean>
  >({});

  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>(
    []
  );
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");

  const socket = getSocket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const pendingSignalsRef = useRef<Record<string, unknown[]>>({});

  const handleGetMedia = useCallback(async () => {
    return getMedia(
      selectedVideoDevice,
      selectedAudioInput,
      selectedAudioOutput,
      cameraFacingMode,
      micOn,
      streamRef,
      videoRef,
      peersRef,
      setRemoteStreams,
      pendingSignalsRef
    );
  }, [
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    cameraFacingMode,
    micOn,
  ]);

  // Handle video device selection
  const handleVideoDeviceSelect = async (deviceId: string) => {
    try {
      const success = await switchVideoDevice(
        deviceId,
        streamRef,
        videoRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef,
        micOn,
        selectedAudioInput,
        selectedAudioOutput,
        cameraFacingMode
      );

      if (success) {
        setSelectedVideoDevice(deviceId);
      }
    } catch (error) {
      toast.error(`Failed to switch video device: ${parseError(error)}`);
    }
  };

  // Handle audio input device selection
  const handleAudioInputSelect = async (deviceId: string) => {
    try {
      const success = await switchAudioDevice(
        deviceId,
        streamRef,
        videoRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef,
        micOn,
        selectedVideoDevice,
        selectedAudioOutput,
        cameraFacingMode
      );

      if (success) {
        setSelectedAudioInput(deviceId);
      }
    } catch (error) {
      toast.error(`Failed to switch audio device: ${parseError(error)}`);
    }
  };

  // Handle audio output device selection
  const handleAudioOutputSelect = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    if (videoRef.current && "setSinkId" in videoRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (videoRef.current as any).setSinkId(deviceId);
      } catch (error) {
        toast.error(`Error setting audio output: ${parseError(error)}`);
      }
    }
  };

  // Initialize device enumeration
  useEffect(() => {
    const handleDeviceChange = async () => {
      await enumerateDevices(
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices,
        selectedVideoDevice,
        setSelectedVideoDevice,
        selectedAudioInput,
        setSelectedAudioInput,
        selectedAudioOutput,
        setSelectedAudioOutput
      );
    };

    initDevices(handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [selectedVideoDevice, selectedAudioInput, selectedAudioOutput]);

  // Request permissions on mount
  useEffect(() => {
    const requestInitialPermissions = async () => {
      if (hasRequestedPermissions) return;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasLabels = devices.some((device) => device.label !== "");

        if (!hasLabels) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
          });
          stream.getTracks().forEach((track) => track.stop());
        }

        await enumerateDevices(
          setVideoDevices,
          setAudioInputDevices,
          setAudioOutputDevices,
          selectedVideoDevice,
          setSelectedVideoDevice,
          selectedAudioInput,
          setSelectedAudioInput,
          selectedAudioOutput,
          setSelectedAudioOutput
        );

        setHasRequestedPermissions(true);
      } catch (error) {
        console.warn("Initial permission request failed:", error);
      }
    };

    requestInitialPermissions();
  }, [
    hasRequestedPermissions,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoDevice,
  ]);

  // Initialize device enumeration
  useEffect(() => {
    const handleDeviceChange = async () => {
      await enumerateDevices(
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices,
        selectedVideoDevice,
        setSelectedVideoDevice,
        selectedAudioInput,
        setSelectedAudioInput,
        selectedAudioOutput,
        setSelectedAudioOutput
      );
    };

    initDevices(handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [selectedVideoDevice, selectedAudioInput, selectedAudioOutput]);

  const toggleSpeaker = (newState: boolean) => {
    setSpeakerOn(newState);
    socket.emit(StreamServiceMsg.SPEAKER_STATE, newState);

    // Find all video elements in the component and update their muted state
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach((video) => {
      if (video !== videoRef.current) {
        // Don't mute local video
        video.muted = !newState;
      }
    });
  };

  // Socket event effect
  useEffect(() => {
    if (hasRequestedPermissions) {
      socket.emit(StreamServiceMsg.STREAM_READY);
      socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
    }

    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      if (hasRequestedPermissions) {
        createPeer(
          userID,
          true,
          streamRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef
        );
        socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
      }
    });

    socket.on(
      StreamServiceMsg.MIC_STATE,
      ({ userID, micOn }: { userID: string; micOn: boolean }) => {
        setRemoteMicStates((prev) => ({ ...prev, [userID]: micOn }));
      }
    );

    socket.on(
      StreamServiceMsg.SPEAKER_STATE,
      ({ userID, speakersOn }: { userID: string; speakersOn: boolean }) => {
        setRemoteSpeakerStates((prev) => ({ ...prev, [userID]: speakersOn }));
      }
    );

    socket.on(
      StreamServiceMsg.SIGNAL,
      ({ userID, signal }: { userID: string; signal: unknown }) => {
        if (hasRequestedPermissions) {
          handleSignal(
            signal,
            userID,
            streamRef,
            peersRef,
            setRemoteStreams,
            pendingSignalsRef
          );
        }
      }
    );

    socket.on(StreamServiceMsg.CAMERA_OFF, (userID: string) => {
      if (userID !== storage.getUserId()) {
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[userID];
          return newStreams;
        });
      }
    });

    return () => {
      socket.off(StreamServiceMsg.STREAM_READY);
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.USER_DISCONNECTED);
      socket.off(StreamServiceMsg.MIC_STATE);
      socket.off(StreamServiceMsg.SPEAKER_STATE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, hasRequestedPermissions]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.keys(peersRef.current).forEach((userID) => {
        cleanupPeer(userID, peersRef, setRemoteStreams);
      });
      socket.emit(StreamServiceMsg.CAMERA_OFF);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex h-full flex-col bg-[color:var(--panel-background)]/90">
      <div className="flex items-center justify-between rounded-t-md border-b bg-[color:var(--toolbar-bg-secondary)]/90 px-2 py-1 text-xs text-[color:var(--toolbar-foreground)]">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex size-2 rounded-full bg-pink-400"
            aria-hidden="true"
          />
          <span className="opacity-80">Video & Voice</span>
        </div>
        <div className="flex items-center gap-1 opacity-60">
          <span className="h-1.5 w-8 rounded-full bg-current/40" />
          <span className="h-1.5 w-6 rounded-full bg-current/40" />
        </div>
      </div>
      <div
        className="grid flex-1 auto-rows-[1fr] gap-3 overflow-y-auto p-2"
        style={{
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        }}
      >
        {/* Local video */}
        <div className="relative">
          <div className="relative aspect-video overflow-hidden rounded-lg border bg-black/10 shadow-sm ring-1 ring-border dark:bg-black/30">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="size-full scale-x-[-1] rounded-lg object-cover"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar
                  user={{
                    id: storage.getUserId() ?? "",
                    username: userMap.get(storage.getUserId() ?? "") ?? "",
                  }}
                  size="lg"
                  showTooltip={false}
                />
              </div>
            )}
            <VideoControls
              isLocal={true}
              userId={storage.getUserId() ?? ""}
              micOn={micOn}
              speakersOn={speakerOn}
              remoteMicStates={remoteMicStates}
              remoteSpeakerStates={remoteSpeakerStates}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/60 px-2 py-1 text-xs text-white">
              {userMap.get(storage.getUserId() ?? "")} (you)
            </div>
          </div>
        </div>

        {/* Remote videos */}
        {users
          .filter((user) => user.id !== storage.getUserId())
          .map((user) => (
            <div key={user.id} className="relative">
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-black/10 shadow-sm ring-1 ring-border dark:bg-black/30">
                {remoteStreams[user.id] ? (
                  <video
                    autoPlay
                    playsInline
                    muted={!speakerOn}
                    className="size-full scale-x-[-1] rounded-lg object-cover"
                    ref={(element) => {
                      if (element) element.srcObject = remoteStreams[user.id];
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar user={user} size="lg" showTooltip={false} />
                  </div>
                )}
                <VideoControls
                  isLocal={false}
                  userId={user.id}
                  micOn={micOn}
                  speakersOn={speakerOn}
                  remoteMicStates={remoteMicStates}
                  remoteSpeakerStates={remoteSpeakerStates}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/60 px-2 py-1 text-xs text-white">
                  {user.username}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Controls */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border bg-background/80 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <DeviceControls
              icon={cameraOn ? Video : VideoOff}
              label="camera"
              devices={videoDevices}
              selectedDevice={selectedVideoDevice}
              onDeviceSelect={handleVideoDeviceSelect}
              onToggle={async () =>
                await toggleCamera(
                  cameraOn,
                  setCameraOn,
                  setMicOn,
                  streamRef,
                  videoRef,
                  handleGetMedia
                )
              }
              isEnabled={cameraOn}
              onDevicePermissionGranted={async (kind) => {
                await handleDevicePermissionGranted(
                  kind,
                  setVideoDevices,
                  setAudioInputDevices,
                  setAudioOutputDevices
                );
              }}
            />

            {isMobile && cameraOn && (
              <Button
                onClick={async () =>
                  await rotateCamera(
                    cameraOn,
                    cameraFacingMode,
                    setCameraFacingMode,
                    streamRef,
                    handleGetMedia
                  )
                }
                variant="ghost"
                size="icon"
                className="bg-foreground/10 hover:bg-foreground/20"
                aria-label="Rotate camera"
              >
                <RefreshCw className="size-5" />
              </Button>
            )}
          </div>

          <DeviceControls
            icon={micOn ? Mic : MicOff}
            label="microphone"
            devices={audioInputDevices}
            selectedDevice={selectedAudioInput}
            onDeviceSelect={handleAudioInputSelect}
            onToggle={() => toggleMic(micOn, setMicOn, streamRef)}
            isEnabled={micOn}
            disableToggle={!cameraOn}
            onDevicePermissionGranted={async (kind) => {
              await handleDevicePermissionGranted(
                kind,
                setVideoDevices,
                setAudioInputDevices,
                setAudioOutputDevices
              );
            }}
          />

          <DeviceControls
            icon={speakerOn ? Volume2 : VolumeOff}
            label="speaker"
            devices={audioOutputDevices}
            selectedDevice={selectedAudioOutput}
            onDeviceSelect={handleAudioOutputSelect}
            onToggle={() => toggleSpeaker(!speakerOn)}
            isEnabled={speakerOn}
            onDevicePermissionGranted={async (kind) => {
              await handleDevicePermissionGranted(
                kind,
                setVideoDevices,
                setAudioInputDevices,
                setAudioOutputDevices
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export { WebcamStream };
