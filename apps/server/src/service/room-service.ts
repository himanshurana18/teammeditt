import type { Server, Socket } from "socket.io";

import { CodeServiceMsg, RoomServiceMsg } from "@CodeX/types/message";
import type { ExecutionResult } from "@CodeX/types/terminal";

import { generateRoomID } from "@/utils/generate-room-id";
import { normalizeRoomId } from "@/utils/normalize-room-id";

import * as codeService from "./code-service";
import * as userService from "./user-service";

const roomUsersCache = new Map<string, Record<string, string>>();

const roomNotes = new Map<string, string>();

export const getUserRoom = (socket: Socket): string | undefined => {
  for (const room of socket.rooms) {
    if (room !== socket.id) return room;
  }
  return undefined;
};

export const create = async (socket: Socket, name: string): Promise<void> => {
  const customId = userService.connect(socket, name);

  let roomID: string;
  do {
    roomID = generateRoomID();
  } while (codeService.roomExists(roomID));

  await socket.join(roomID);

  roomUsersCache.set(roomID, { [customId]: name });

  socket.emit(RoomServiceMsg.CREATE, roomID, customId);
};

export const join = async (
  socket: Socket,
  io: Server,
  roomID: string,
  name: string
): Promise<void> => {
  roomID = normalizeRoomId(roomID);

  if (!io.sockets.adapter.rooms.has(roomID)) {
    socket.emit(RoomServiceMsg.NOT_FOUND, roomID);
    return;
  }

  const customId = userService.connect(socket, name);
  await socket.join(roomID);

  const users = roomUsersCache.get(roomID) || {};
  users[customId] = name;
  roomUsersCache.set(roomID, users);

  socket.emit(RoomServiceMsg.JOIN, customId);
  socket.to(roomID).emit(RoomServiceMsg.SYNC_USERS, users);
};

export const leave = async (socket: Socket, io: Server): Promise<void> => {
  try {
    if (!socket || socket.disconnected) return;

    const roomID = getUserRoom(socket);
    if (!roomID) return;

    const customId = userService.getSocCustomId(socket);
    if (!customId) return;

    const users = roomUsersCache.get(roomID);
    if (users) {
      delete users[customId];
      if (Object.keys(users).length === 0) {
        roomUsersCache.delete(roomID);
        codeService.deleteRoom(roomID);
      } else {
        roomUsersCache.set(roomID, users);
      }
    }

    if (io.sockets.adapter.rooms.has(roomID)) {
      socket.to(roomID).emit(RoomServiceMsg.LEAVE, customId);
      socket.to(roomID).emit(RoomServiceMsg.SYNC_USERS, users || {});
    }

    await socket.leave(roomID);

    userService.disconnect(socket);
  } catch {
    return;
  }
};

export const getUsersInRoom = (
  socket: Socket,
  io: Server,
  roomID: string = getUserRoom(socket)
): Record<string, string> => {
  if (!roomID) return {};

  let users = roomUsersCache.get(roomID);

  if (!users) {
    const room = io.sockets.adapter.rooms.get(roomID);
    if (!room) return {};

    users = {};
    for (const socketId of room) {
      const username = userService.getUsername(socketId);
      const customId = userService.getSocCustomId(
        io.sockets.sockets.get(socketId)
      );
      if (username && customId) {
        users[customId] = username;
      }
    }

    roomUsersCache.set(roomID, users);
  }

  io.to(socket.id).emit(RoomServiceMsg.SYNC_USERS, users);
  return users;
};

export const cleanupRoomCache = (roomID: string): void => {
  roomUsersCache.delete(roomID);
};

export const syncNote = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  const note = roomNotes.get(roomID) || "";
  io.to(socket.id).emit(RoomServiceMsg.UPDATE_MD, note);
};

export const updateNote = (socket: Socket, note: string): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  socket.to(roomID).emit(RoomServiceMsg.UPDATE_MD, note);
  roomNotes.set(roomID, note);
};

export const updateExecuting = (socket: Socket, executing: boolean): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  socket.to(roomID).emit(CodeServiceMsg.EXEC, executing);
};

export const updateTerminal = (socket: Socket, data: ExecutionResult): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  socket.to(roomID).emit(CodeServiceMsg.UPDATE_TERM, data);
};
