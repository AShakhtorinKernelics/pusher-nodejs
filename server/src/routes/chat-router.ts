import express, { Response, Request } from "express";
import uuid from "uuid";
import Pusher from "pusher";

interface UserConnectionInterface {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
}

// user service part
const userConnectionsDb: {
  userId: string;
  selfConnectionId: string;
  connectionList: UserConnectionInterface[];
}[] = [
  {
    // user service part
    userId: "lehus-id",
    selfConnectionId: "",
    connectionList: [],
  },
  {
    // user service part
    userId: "testUser",
    selfConnectionId: "",
    connectionList: [],
  },
];

interface archivedMsg {
  id: string;
  msgPayload: msgPayloadInterface;
}

interface archivedConnectionData {
  connectionId: string;
  connectionMessages: archivedMsg[];
}

const msgDb: archivedConnectionData[] = [
  // Try to convert into HashMap In DB
];

interface connectionInteface {
  connectionId: string;
  connectionName: string;
  connectionType: ConnectionEnum;
  participants: string[];
  ownerId: string;
  participantsCanWrite: boolean;
  imageUrl: string;
}

enum ConnectionEnum {
  multiChat = "multiChat",
  directChat = "directChat",
  channel = "channek",
  selfChat = "selfChat",
}

const connectionDb: connectionInteface[] = [
  {
    connectionId: "testConnection",
    connectionName: "testConnectionName",
    connectionType: ConnectionEnum.directChat,
    participants: ["lehus-id", "testUser"],
    participantsCanWrite: true,
    ownerId: "",
    imageUrl: "",
  },
];

interface ConnectionRequestInterface {
  userId: string;
  requesters: { userId: string; userName: string }[];
}

const connectionRequestDb: ConnectionRequestInterface[] = [];

enum EventNamesEnum {
  msgFromConnection = "message",
  channelPost = "channelPost",
  directConnectionRequest = "directConnectionRequest",
  connectionAccepted = "connectionAccepted",
  connectionRejected = "connectionRejected",
  getHistory = "getHistory",
}

interface eventInterface {
  type: EventNamesEnum;
  sourceConnectionId: string;
  payload: any;
  metadata: any;
}

interface msgPayloadInterface {
  senderId: string;
  senderName: string;
  text: string;
}

export const chatRouterInit = (pusher: Pusher) => {
  const router = express.Router();

  const getMsgRecieversList = (
    senderId: string,
    participants: string[]
  ): string[] => {
    return participants.filter((participant) => participant !== senderId);
  };

  const checkWritingPermissions = (
    connection: connectionInteface,
    senderId: string
  ) => {
    if (!connection.participantsCanWrite && connection.ownerId !== senderId) {
      console.log("Sending error!!!"); // TODO throw error here
      throw Error("No writing permissions");
    }
  };

  const archiveMsg = (connectionId: string, msgPayload: archivedMsg) => {
    const connectionHistory = msgDb.find(
      (historyData) => historyData.connectionId === connectionId
    );

    if (connectionHistory) {
      connectionHistory.connectionMessages.push(msgPayload);
    } else {
      msgDb.push({
        connectionId,
        connectionMessages: [msgPayload],
      });
    }
  };

  const getArchiveMsgList = (connectionId: string) => {
    const connectionHistory = msgDb.find(
      (historyData) => historyData.connectionId === connectionId
    );

    return connectionHistory ? [...connectionHistory?.connectionMessages] : [];
  };

  const checkConnectionAccess = (
    connection: connectionInteface,
    userId: string
  ): boolean => {
    return !!connection.participants.find(
      (participant) => participant === userId
    );
  };

  router.post("/writeSelf", (req: Request, res: Response) => {
    try {
      const {
        userId,
        payload,
      }: { userId: string; payload: msgPayloadInterface } = req.body;

      let userDataIndex;

      const userData = userConnectionsDb.find((userData, index) => {
        if (userData.userId === userId) {
          userDataIndex = index;
          return true;
        }
      });

      if (!userData || !userDataIndex) {
        console.log("no such user");
        throw Error("no such user!!!"); // TODO throw error here
      }

      // create msg

      const msgUuid = uuid.v4();

      const tempMsgPayload: archivedMsg = {
        id: msgUuid,
        msgPayload: payload,
      };

      // find connection

      let userConnectionId;

      if (userData.selfConnectionId) {
        userConnectionId = userData.selfConnectionId;
      } else {
        userConnectionId = uuid.v4();
        connectionDb.push({
          connectionId: userConnectionId,
          connectionName: `Self connection ${userData.userId}`,
          connectionType: ConnectionEnum.selfChat,
          participants: [],
          participantsCanWrite: false,
          ownerId: userData.userId,
          imageUrl: "",
        });
      }

      archiveMsg(userConnectionId, tempMsgPayload);

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(`writeSelfReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/sendMessageToConnection", (req: Request, res: Response) => {
    try {
      const {
        connectionId,
        payload,
      }: { connectionId: string; payload: msgPayloadInterface } = req.body;

      const connection = connectionDb.find(
        (connection) => connection.connectionId === connectionId
      );
      if (!connection) {
        console.log("Connection search Error!!!!"); // TODO throw error here
        throw Error("no such connection");
      }

      let msgRecievers = [];

      checkWritingPermissions(connection, payload.senderId);

      msgRecievers = getMsgRecieversList(
        payload.senderId,
        connection.participants
      );

      msgRecievers.forEach((reciever) => {
        pusher.trigger(reciever, EventNamesEnum.msgFromConnection, payload);
      });

      const msgUuid = uuid.v4();

      const tempMsgPayload: archivedMsg = {
        id: msgUuid,
        msgPayload: payload,
      };

      archiveMsg(connectionId, tempMsgPayload);

      res.send({
        status: "success",
        data: payload,
      });
    } catch (error) {
      console.error(`messageReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/channelCreation", (req: Request, res: Response) => {
    try {
      const { userId }: { userId: string } = req.body;

      const connectionId = uuid.v4();

      const connectionData = {
        connectionId: connectionId,
        connectionName: `channel Created By ${userId}`,
        connectionType: ConnectionEnum.channel,
        participants: [],
        participantsCanWrite: false,
        ownerId: userId,
        imageUrl: "",
      };

      connectionDb.push(connectionData);

      res.send({
        status: "success",
        data: { connectionId: connectionId },
      });
    } catch (err) {
      console.error(`channelCreationReq error:: ${(err as Error).message}`);
      throw err;
    }
  });

  router.post("/channelSubscription", (req: Request, res: Response) => {
    try {
      const {
        connectionId,
        requesterId,
      }: { connectionId: string; requesterId: string } = req.body;

      let userDataIndex;

      const userData = userConnectionsDb.find((userData, index) => {
        if (userData.userId === requesterId) {
          userDataIndex = index;
          return true;
        }
      });

      if (!userData || !userDataIndex) {
        console.log("no such user");
        throw Error("no such user!!!"); // TODO throw error here
      }

      const tempUserData = { ...userData };

      let connectionDataIndex;

      const connectionData = connectionDb.find((connection, index) => {
        connectionDataIndex = index;
        return connection.connectionId === connectionId;
      });

      if (!connectionData || !connectionDataIndex) {
        console.log("no such connection"); // TODO throw error here
        throw Error("no such connection!!!");
      }

      checkWritingPermissions(connectionData, requesterId);

      // add user to connection

      connectionDb[connectionDataIndex].participants.push(userData.userId);

      //

      tempUserData.connectionList.push({
        id: connectionData.connectionId,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      userConnectionsDb[userDataIndex] = { ...tempUserData };

      res.send({
        status: "success",
        data: {
          connectionId,
        },
      });
    } catch (error) {
      console.error(
        `channelSubscriptionReq error:: ${(error as Error).message}`
      );
      throw error;
    }
  });

  router.post("/channelUnsubscribe", (req: Request, res: Response) => {
    try {
      const {
        connectionId,
        requesterId,
      }: { connectionId: string; requesterId: string } = req.body;

      let userDataIndex;

      const userData = userConnectionsDb.find((userData, index) => {
        if (userData.userId === requesterId) {
          userDataIndex = index;
          return true;
        }
      });

      if (!userData || !userDataIndex) {
        console.log("no such user");
        throw Error("no such user!!!"); // TODO throw error here
      }

      // delete user from connection

      let connectionDataIndex;

      const connectionData = connectionDb.find((connection, index) => {
        connectionDataIndex = index;
        return connection.connectionId === connectionId;
      });

      if (!connectionData || !connectionDataIndex) {
        console.log("no such connection"); // TODO throw error here
        throw Error("no such connection!!!");
      }

      connectionDb[connectionDataIndex].participants.filter(
        (participant) => participant !== userData.userId
      );

      //

      const tempUserData = { ...userData };

      tempUserData.connectionList = tempUserData.connectionList.filter(
        (connection) => connection.id !== connectionId
      );

      userConnectionsDb[userDataIndex] = { ...tempUserData };

      res.send({
        status: "success",
        data: {
          connectionId,
        },
      });
    } catch (error) {
      console.error(
        `channelUnsubscribeReq error:: ${(error as Error).message}`
      );
      throw error;
    }
  });

  router.post("/directConnectionRequest", (req: Request, res: Response) => {
    try {
      const {
        userId,
        requesterId,
        requesterName,
      }: {
        userId: string;
        connectionId: string;
        requesterId: string;
        requesterName: string;
      } = req.body;

      let connectionRequestIndex;
      const connectionRequestData = connectionRequestDb.find(
        (conectionRequest, index) => {
          connectionRequestIndex = index;
          return conectionRequest.userId === userId;
        }
      );

      const tempConnectionRequestData = {
        userId: requesterId,
        userName: requesterName,
      };

      if (connectionRequestData && connectionRequestIndex) {
        connectionRequestDb[connectionRequestIndex].requesters.push(
          tempConnectionRequestData
        );
      } else {
        connectionRequestDb.push({
          userId,
          requesters: [tempConnectionRequestData],
        });
      }

      pusher.trigger(
        userId,
        EventNamesEnum.directConnectionRequest,
        tempConnectionRequestData
      );

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(
        `directConnectionRequestReq error:: ${(error as Error).message}`
      );
      throw error;
    }
  });

  router.post("/connectionAccepted", (req: Request, res: Response) => {
    try {
      const {
        userId,
        requesterId,
        requesterName,
      }: {
        userId: string;
        requesterId: string;
        requesterName: string;
      } = req.body;

      // clean from requesters -> get userId from there for both and add to DB

      let connectionRequestIndex;

      const connectionRequestData = connectionRequestDb.find(
        (connectionRequest, index) => {
          connectionRequestIndex = index;
          return connectionRequest.userId === userId;
        }
      );

      if (!connectionRequestData || !connectionRequestIndex) {
        console.log("No connection for approve");
        throw Error("No connection for approve"); // TODO throw error here
      }

      connectionRequestDb[connectionRequestIndex].requesters =
        connectionRequestDb[connectionRequestIndex].requesters.filter(
          (requester) => requester.userId !== requesterId
        );

      // check requester existance

      let requesterConnectionIndex;

      userConnectionsDb.find((userConnections, index) => {
        requesterConnectionIndex = index;
        return userConnections.userId === requesterId;
      });

      if (!requesterConnectionIndex) {
        console.log("no user found!!!");
        return Error("no user found");
      }

      // check approver existence

      let approverConnectionIndex;

      userConnectionsDb.find((userConnections, index) => {
        approverConnectionIndex = index;
        return userConnections.userId === userId;
      });

      if (!approverConnectionIndex) {
        console.log("no approver found!!!");
        return Error("no approver found");
      }

      // adding connection to DB

      const connectionUuid = uuid.v4();

      const connectionData = {
        connectionId: connectionUuid,
        connectionName: `connection for ${userId} and ${requesterId}`,
        connectionType: ConnectionEnum.directChat,
        participants: [userId, requesterId],
        participantsCanWrite: true,
        ownerId: "",
        imageUrl: "",
      };

      connectionDb.push(connectionData);

      // adding connection to requester

      userConnectionsDb[requesterConnectionIndex].connectionList.push({
        id: connectionUuid,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      // adding connection to approver

      userConnectionsDb[approverConnectionIndex].connectionList.push({
        id: connectionUuid,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      // pusher triggers

      pusher.trigger(requesterId, EventNamesEnum.connectionAccepted, {
        requesterId,
        accepterId: userId,
      });

      pusher.trigger(userId, EventNamesEnum.connectionAccepted, {
        requesterId,
        accepterId: userId,
      });

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(
        `connectionAcceptedReq error:: ${(error as Error).message}`
      );
      throw error;
    }
  });

  router.post("/connectionRejected", (req: Request, res: Response) => {
    try {
      const {
        userId,
        requesterId,
        requesterName,
      }: {
        userId: string;
        requesterId: string;
        requesterName: string;
      } = req.body;

      let connectionRequestIndex;

      const connectionRequestData = connectionRequestDb.find(
        (connectionRequest, index) => {
          connectionRequestIndex = index;
          return connectionRequest.userId === userId;
        }
      );

      if (!connectionRequestData || !connectionRequestIndex) {
        console.log("No connection for approve");
        throw Error("No connection for approve"); // TODO throw error here
      }

      connectionRequestDb[connectionRequestIndex].requesters =
        connectionRequestDb[connectionRequestIndex].requesters.filter(
          (requester) => requester.userId !== requesterId
        );

      pusher.trigger(requesterId, EventNamesEnum.connectionRejected, {
        requesterId,
        rejecterId: userId,
      });

      pusher.trigger(userId, EventNamesEnum.connectionRejected, {
        requesterId,
        rejecterId: userId,
      });

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(
        `connectionRejectedReq error:: ${(error as Error).message}`
      );
      throw error;
    }
  });

  router.post("/getHistory", (req: Request, res: Response) => {
    try {
      const {
        userId,
        connectionId,
      }: {
        userId: string;
        connectionId: string;
      } = req.body;

      const connectionData = connectionDb.find((connection) => {
        return connection.connectionId === connectionId;
      });

      if (!connectionData) {
        console.log("No connection found!!!");
        throw Error("No connection found!!!"); // TODO throw error here
      }

      const isReqAllowed = checkConnectionAccess(connectionData, userId);

      if (!isReqAllowed) {
        console.log("No connection access allowed!!!");
        throw Error("No connection access allowed!!!"); // TODO throw error here
      }

      const history = getArchiveMsgList(connectionId);

      res.send({
        status: "success",
        data: history,
      });
    } catch (error) {
      console.error(`getHistoryReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/getRequestersList", (req: Request, res: Response) => {
    try {
      const { requesterId }: { requesterId: string } = req.body;
      const requesterData = connectionRequestDb.find(
        (connectionReq) => connectionReq.userId === requesterId
      );

      const requesterList = requesterData ? requesterData.requesters : [];

      res.send({
        status: "success",
        data: [...requesterList],
      });
    } catch (error) {
      console.error(`getRequestersList error:: ${(error as Error).message}`);
      throw error;
    }
  });

  return router;
};
