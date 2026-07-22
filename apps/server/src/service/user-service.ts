import type { Socket } from "socket.io";

import { CodeServiceMsg } from "@CodeX/types/message";
import type { Cursor } from "@CodeX/types/operation";

import { getUserRoom } from "./room-service";

type UserData = {
  username: string;
  customId: string;
};

const socketToUserData = new Map<string, UserData>();
const customIdToSocketId = new Map<string, string>();

const generateCustomId = (): string => {
  const generateId = (num: number): string => {
    let id = "";
    while (num >= 0) {
      id = String.fromCharCode(65 + (num % 26)) + id;
      num = Math.floor(num / 26) - 1;
    }
    return id;
  };

  let counter = 0;
  let newId: string;

  do {
    newId = generateId(counter++);
  } while (customIdToSocketId.has(newId));

  return newId;
};

export const getUsername = (socketId: string): string | undefined => {
  return socketToUserData.get(socketId)?.username;
};

export const connect = (socket: Socket, username: string): string => {
  const customId = generateCustomId();
  const userData: UserData = { username, customId };

  socketToUserData.set(socket.id, userData);
  customIdToSocketId.set(customId, socket.id);

  return customId;
};

export const disconnect = (socket: Socket): void => {
  const userData = socketToUserData.get(socket.id);
  if (userData) {
    customIdToSocketId.delete(userData.customId);
    socketToUserData.delete(socket.id);
  }

  socket.disconnect();
};

export const updateCursor = (socket: Socket, cursor: Cursor): void => {
  const roomId = getUserRoom(socket);
  const userData = socketToUserData.get(socket.id);

  if (userData) {
    socket
      .to(roomId)
      .emit(CodeServiceMsg.UPDATE_CURSOR, userData.customId, cursor);
  }
};

export const getSocCustomId = (socket: Socket): string | undefined => {
  return socketToUserData.get(socket.id)?.customId;
};

export const getSocketId = (customId: string): string | undefined => {
  return customIdToSocketId.get(customId);
};

export const getCustomId = (socketId: string): string | undefined => {
  return socketToUserData.get(socketId)?.customId;
};

export const isCustomIdInUse = (customId: string): boolean => {
  return customIdToSocketId.has(customId);
};
