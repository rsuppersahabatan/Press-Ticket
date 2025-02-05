import { Server } from "http";
import { verify } from "jsonwebtoken";
import { Server as SocketIO } from "socket.io";
import authConfig from "../config/auth";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import User from "../models/User";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  iat: number;
  exp: number;
}

interface UserStatus {
  userId: number;
  online: boolean;
}

let io: SocketIO;

export const setIO = (io: SocketIO): void => {
  io = io;
};

export const initIO = (httpServer: Server): void => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
    },
    pingTimeout: 30000,
    pingInterval: 15000
  });

  io.on("connection", async socket => {
    logger.info("Client Connected");
    let userId: number | undefined;

    const { token } = socket.handshake.query;
    try {
      if (typeof token === "string") {
        const tokenData = verify(token, authConfig.secret) as TokenPayload;
        logger.debug(JSON.stringify(tokenData), "io-onConnection: tokenData");
        userId = parseInt(tokenData.id);

        if (userId) {
          const user = await User.findByPk(userId);
          if (user) {
            const userRoom = io.sockets.adapter.rooms.get(userId.toString());
            const hasConnectedSockets = userRoom && userRoom.size > 0;
            
            if (!hasConnectedSockets) {
              await user.update({ online: true });
              io.emit("userSessionUpdate", {
                userId: user.id,
                online: true
              });
              logger.info(`User ${userId} is now online`);
            }
            socket.join(userId.toString());
          }
        }
      }
    } catch (error) {
      logger.error(JSON.stringify(error), "Error decoding token");
      socket.disconnect();
      return;
    }

    socket.on("userStatus", async ({ userId, online }: UserStatus) => {
      try {
        if (!userId) return;
        
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({ online });
          io.emit("userSessionUpdate", {
            userId: user.id,
            online
          });
          logger.info(`User ${userId} status updated to ${online ? "online" : "offline"}`);
        }
      } catch (err) {
        logger.error(err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        if (userId) {
          const userRoom = io.sockets.adapter.rooms.get(userId.toString());
          const hasConnectedSockets = userRoom && userRoom.size > 0;

          if (!hasConnectedSockets) {
            const user = await User.findByPk(userId);
            if (user) {
              await user.update({ online: false });
              io.emit("userSessionUpdate", {
                userId: user.id,
                online: false
              });
              logger.info(`User ${userId} is now offline (disconnected)`);
            }
          }
        }
      } catch (err) {
        logger.error("Error on disconnect:", err);
      }
    });

    socket.on("logout", async () => {
      try {
        if (userId) {
          const user = await User.findByPk(userId);
          if (user) {
            await user.update({ online: false });
            io.emit("userSessionUpdate", {
              userId: user.id,
              online: false
            });
            logger.info(`User ${userId} logged out`);
          }
          socket.leave(userId.toString());
        }
      } catch (err) {
        logger.error("Error on logout:", err);
      }
    });

    socket.on("joinChatBox", (ticketId: string) => {
      logger.info("A client joined a ticket channel");
      socket.join(ticketId);
    });

    socket.on("joinNotification", () => {
      logger.info("A client joined notification channel");
      socket.join("notification");
    });

    socket.on("joinTickets", (status: string) => {
      logger.info(`A client joined to ${status} tickets channel.`);
      socket.join(status);
    });
  });
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
