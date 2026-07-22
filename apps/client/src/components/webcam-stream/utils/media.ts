import type { Dispatch, RefObject, SetStateAction } from "react";

import { isMobile } from "react-device-detect";
import type Peer from "simple-peer";
import { toast } from "sonner";

import { parseError } from "@/lib/utils";

import { cleanupPeer, createPeer } from "./peer";

export const getMedia = async (
  selectedVideoDevice: string,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: "user" | "environment",
  micOn: boolean,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>
) => {
  try {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    }

    const videoConstraints: MediaTrackConstraints = isMobile
      ? {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        }
      : {
          deviceId: selectedVideoDevice
            ? { exact: selectedVideoDevice }
            : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        };

    const audioConstraints: boolean | MediaTrackConstraints = selectedAudioInput
      ? { deviceId: { exact: selectedAudioInput } }
      : true;

    const constraints: MediaStreamConstraints = {
      video: videoConstraints,
      audio: audioConstraints,
    };

    const newStream = await navigator.mediaDevices.getUserMedia(constraints);

    newStream.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });

    if (videoRef.current) {
      videoRef.current.srcObject = newStream;

      if ("setSinkId" in videoRef.current && selectedAudioOutput) {
        try {
          await (videoRef.current as any).setSinkId(selectedAudioOutput);
        } catch (error) {
          console.warn("Error setting audio output device:", error);
        }
      }
    }

    Object.entries(peersRef.current).forEach(([userID, peer]) => {
      if (!peer.destroyed) {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              peer.removeTrack(track, streamRef.current!);
            });
          }

          newStream.getTracks().forEach((track) => {
            peer.addTrack(track, newStream);
          });
        } catch (error) {
          console.warn("Error updating peer tracks:", error);

          cleanupPeer(userID, peersRef, setRemoteStreams);
          createPeer(
            userID,
            true,
            { current: newStream },
            peersRef,
            setRemoteStreams,
            pendingSignalsRef
          );
        }
      }
    });

    streamRef.current = newStream;
    return true;
  } catch (error) {
    toast.error(`Error accessing media devices: ${parseError(error)}`);
    return false;
  }
};

export const switchVideoDevice = async (
  deviceId: string,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>,
  micOn: boolean,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: "user" | "environment"
) => {
  return getMedia(
    deviceId,
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
};

export const switchAudioDevice = async (
  deviceId: string,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>,
  micOn: boolean,
  selectedVideoDevice: string,
  selectedAudioOutput: string,
  cameraFacingMode: "user" | "environment"
) => {
  return getMedia(
    selectedVideoDevice,
    deviceId,
    selectedAudioOutput,
    cameraFacingMode,
    micOn,
    streamRef,
    videoRef,
    peersRef,
    setRemoteStreams,
    pendingSignalsRef
  );
};
