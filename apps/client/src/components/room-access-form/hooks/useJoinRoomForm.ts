import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { JoinRoomForm } from "../types";
import { isRoomIdValid } from "../utils";
import { joinRoomSchema } from "../validator";

export const useJoinRoomForm = (roomId: string) => {
  return useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: "",
      roomId: isRoomIdValid(roomId) ? roomId : "",
    },
  });
};
