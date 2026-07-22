import type { Server, Socket } from "socket.io";

import { CodeServiceMsg } from "@CodeX/types/message";
import type { EditOp } from "@CodeX/types/operation";

import { getUserRoom } from "./room-service";
import { getCustomId } from "./user-service";

type RoomData = {
  code: string;
  langId: string;
};

const roomData = new Map<string, RoomData>();

const DEFAULT_LANG_ID = "html";

export const roomExists = (roomID: string): boolean => {
  return roomData.has(roomID);
};

function initializeRoom(roomID: string): RoomData {
  let data = roomData.get(roomID);
  if (!data) {
    data = { code: "", langId: DEFAULT_LANG_ID };
    roomData.set(roomID, data);
  }
  return data;
}

export const getCode = (roomID: string): string => {
  return roomData.get(roomID)?.code || "";
};

export const getLang = (roomID: string): string => {
  return roomData.get(roomID)?.langId || DEFAULT_LANG_ID;
};

export const setLang = (roomID: string, langId: string): void => {
  const data = initializeRoom(roomID);
  data.langId = langId;
};

export const syncCode = (socket: Socket, io: Server): void => {
  const customId = getCustomId(socket.id);
  if (customId) {
    const code = getCode(getUserRoom(socket));
    io.to(socket.id).emit(CodeServiceMsg.SYNC_CODE, code);
  }
};

export const syncLang = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  const customId = getCustomId(socket.id);
  if (customId) {
    const langId = getLang(roomID);
    io.to(socket.id).emit(CodeServiceMsg.UPDATE_LANG, langId);
  }
};

export const updateLang = (socket: Socket, langId: string): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  const customId = getCustomId(socket.id);
  if (customId) {
    setLang(roomID, langId);
    socket.to(roomID).emit(CodeServiceMsg.UPDATE_LANG, langId);
  }
};

const spliceString = (
  original: string,
  start: number,
  end: number,
  insert: string
): string => {
  if (start === end && !insert) return original;
  if (start === 0 && end === original.length) return insert;
  return original.substring(0, start) + insert + original.substring(end);
};

export const updateCode = (socket: Socket, operation: EditOp): void => {
  const roomID = getUserRoom(socket);
  const customId = getCustomId(socket.id);

  if (!customId || !roomID) return;

  socket.to(roomID).emit(CodeServiceMsg.UPDATE_CODE, operation);

  const currentCode = getCode(roomID);
  const [txt, startLnNum, startCol, endLnNum, endCol] = operation;

  const lines = currentCode.split("\n");
  const maxLine = Math.max(lines.length, startLnNum);

  if (maxLine > lines.length) {
    lines.length = maxLine;
    lines.fill("", lines.length, maxLine);
  }

  const isEmptyLineDeletion =
    txt === "" && startLnNum < endLnNum && startCol === 1 && endCol === 1;

  if (isEmptyLineDeletion) {
    lines.splice(startLnNum - 1, endLnNum - startLnNum);
  } else if (startLnNum === endLnNum) {
    const lineIndex = startLnNum - 1;
    const line = lines[lineIndex] || "";

    const safeStartCol = Math.max(0, Math.min(startCol - 1, line.length));
    const safeEndCol = Math.max(0, Math.min(endCol - 1, line.length));

    lines[lineIndex] = spliceString(line, safeStartCol, safeEndCol, txt);
  } else {
    const textLines = txt.split("\n");
    const startLineIndex = startLnNum - 1;
    const endLineIndex = endLnNum - 1;

    const startLine = lines[startLineIndex] || "";
    const endLine = lines[endLineIndex] || "";

    const safeStartCol = Math.min(Math.max(0, startCol - 1), startLine.length);
    const safeEndCol = Math.min(Math.max(0, endCol - 1), endLine.length);

    const newStartLine = spliceString(
      startLine,
      safeStartCol,
      startLine.length,
      textLines[0]
    );
    const newEndLine = spliceString(
      endLine,
      0,
      safeEndCol,
      textLines[textLines.length - 1]
    );

    const newLinesCount = textLines.length;
    const removedLinesCount = endLineIndex - startLineIndex + 1;
    const sizeChange = newLinesCount - removedLinesCount;

    if (sizeChange > 0) {
      lines.length += sizeChange;
    }

    if (newLinesCount === 2) {
      lines[startLineIndex] = newStartLine;
      lines[startLineIndex + 1] = newEndLine;
      if (removedLinesCount > 2) {
        lines.splice(startLineIndex + 2, removedLinesCount - 2);
      }
    } else {
      const newLines = [newStartLine, ...textLines.slice(1, -1), newEndLine];
      lines.splice(startLineIndex, removedLinesCount, ...newLines);
    }
  }

  const updatedCode = lines.join("\n");
  const data = initializeRoom(roomID);
  data.code = updatedCode;
};

export const deleteRoom = (roomID: string): void => {
  roomData.delete(roomID);
};
