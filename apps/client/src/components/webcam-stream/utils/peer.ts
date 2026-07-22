import type { Dispatch, RefObject, SetStateAction } from "react";

import Peer from "simple-peer";
import { toast } from "sonner";

import { StreamServiceMsg } from "@CodeX/types/message";

import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";

export const createPeer = (
  userID: string,
  initiator: boolean,
  streamRef: RefObject<MediaStream | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,

  pendingSignalsRef: RefObject<Record<string, any[]>>
) => {
  const socket = getSocket();
  try {
    cleanupPeer(userID, peersRef, setRemoteStreams);

    const peer = new Peer({
      initiator,

      stream: streamRef.current?.getTracks().length
        ? streamRef.current
        : undefined,
    });

    peer.on("signal", (signal) => {
      socket.emit(StreamServiceMsg.SIGNAL, signal);
    });

    peer.on("stream", (stream) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [userID]: stream,
      }));
    });

    peer.on("error", (err) => {
      console.warn(`Peer connection error:\n${parseError(err)}`);
      cleanupPeer(userID, peersRef, setRemoteStreams);
    });

    peer.on("connect", () => {
      console.log(`Peer connection established with ${userID}`);
    });

    const pendingSignals = pendingSignalsRef.current[userID] || [];
    pendingSignals.forEach((signal) => {
      try {
        peer.signal(signal);
      } catch (error) {
        console.warn(
          `Error processing pending signal for ${userID}:\n${error}`
        );
      }
    });
    delete pendingSignalsRef.current[userID];

    peersRef.current[userID] = peer;
    return peer;
  } catch (error) {
    toast.error(`Error creating peer connection:\n${parseError(error)}`);
    return null;
  }
};

export const handleSignal = (
  signal: any,
  userID: string,
  streamRef: RefObject<MediaStream | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>
) => {
  try {
    let peer = peersRef.current[userID];

    if (!peer || peer.destroyed) {
      if (!pendingSignalsRef.current[userID]) {
        pendingSignalsRef.current[userID] = [];
      }
      pendingSignalsRef.current[userID].push(signal);

      peer = createPeer(
        userID,
        false,
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef
      ) as Peer.Instance;
    }

    if (peer && !peer.destroyed) {
      peer.signal(signal);
    }
  } catch (error) {
    console.error(`Error handling peer signal:\n${parseError(error)}`);
  }
};

export const cleanupPeer = (
  userID: string,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<SetStateAction<Record<string, MediaStream | null>>>
) => {
  const peer = peersRef.current[userID];
  if (peer) {
    if (!peer.destroyed) {
      try {
        peer.destroy();
      } catch (error) {
        console.warn(
          `Error destroying peer connection for ${userID}.\n${error}`
        );
      }
    }
    delete peersRef.current[userID];
  }

  setRemoteStreams((prev) => {
    const newStreams = { ...prev };
    delete newStreams[userID];
    return newStreams;
  });
};
