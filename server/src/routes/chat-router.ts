import express, { Response, Request } from "express";
import { v4 as uuid } from "uuid";
import Pusher from "pusher";

interface UserConnectionInterface {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
}

enum ConnectionEnum {
  multiChat = "multiChat",
  directChat = "directChat",
  channel = "channel",
  selfChat = "selfChat",
}

// user service part
const userConnectionsDb: {
  // hash by userId
  userId: string;
  userName: string;
  selfConnectionId: string;
  connectionList: UserConnectionInterface[];
}[] = [
  {
    // user service part
    userId: "lehusUserId",
    userName: "Lehus",
    selfConnectionId: "",
    connectionList: [
      {
        id: "302ec818-b042-4240-bc54-4e6fb80f6636",
        name: "myChannel",
        type: ConnectionEnum.channel,
        imageUrl: "",
      },
    ],
  },
  {
    // user service part
    userId: "testUserId",
    userName: "TestUser",
    selfConnectionId: "",
    connectionList: [
      {
        id: "302ec818-b042-4240-bc54-4e6fb80f6636",
        name: "myChannel",
        type: ConnectionEnum.channel,
        imageUrl: "",
      },
    ],
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
  {
    connectionId: "302ec818-b042-4240-bc54-4e6fb80f6636",
    connectionMessages: [
      {
        id: "testID",
        msgPayload: {
          senderId: "testUserId",
          senderName: "testUserId",
          text: "testText From DB FOR CHANNEl",
          type: ConnectionEnum.channel,
        },
      },
    ],
  },
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

const connectionDb: connectionInteface[] = [
  // hash by connectionId
  {
    connectionId: "302ec818-b042-4240-bc54-4e6fb80f6636",
    connectionName: "myChannel",
    connectionType: ConnectionEnum.channel,
    participants: ["lehus-id", "testUser"],
    participantsCanWrite: false,
    ownerId: "testUser",
    imageUrl: "",
  },
];

interface ConnectionRequestInterface {
  userId: string;
  requesters: { userId: string; userName: string }[];
}

const connectionRequestDb: ConnectionRequestInterface[] = []; // hash by userId

enum EventNamesEnum {
  msgFromConnection = "msgFromConnection",
  channelPost = "channelPost",
  directConnectionRequest = "directConnectionRequest",
  connectionAccepted = "connectionAccepted",
  connectionRejected = "connectionRejected",
  channelCreated = "channelCreated",
  channelSubscribed = "channelSubscribed",
  channelUnsubscribed = "channelUnsubscribed",
}

enum MQEventNamesEnum {
  getAllHistory = "getHistory",
  getRequesters = "getRequesters",
}

interface msgPayloadInterface {
  senderId: string;
  senderName: string;
  text: string;
  type: ConnectionEnum;
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

      // TODO !! runs on another service -> possibly will be removed because of the accessToken as prove of existance
      let userDataIndex;

      const userData = userConnectionsDb.find((userData, index) => {
        if (userData.userId === userId) {
          userDataIndex = index;
          return true;
        }
      });

      if (!userData || typeof userDataIndex === "undefined") {
        console.log("no such user");
        throw Error("no such user!!!"); // TODO throw error here
      }

      //

      // create msg

      const msgUuid = uuid();

      const tempMsgPayload: archivedMsg = {
        id: msgUuid,
        msgPayload: payload,
      };

      // find connection

      //   let userConnectionId;

      /* 
                    !!!!!!!!!!!!!!!!TODO Implement self connection creation after user created on if(!selfConnection)

      if (userData.selfConnectionId) {
        userConnectionId = userData.selfConnectionId; // TODO userData usage should be transformed to req parameter
      } else {
        userConnectionId = uuid.v4();
        const tempConnectionData = {
          connectionId: userConnectionId,
          connectionName: `Self connection ${userData.userId}`,  // TODO userData usage should be transformed to req parameter
          connectionType: ConnectionEnum.selfChat,
          participants: [],
          participantsCanWrite: false,
          ownerId: userData.userId,  // TODO userData usage should be transformed to req parameter
          imageUrl: "",
        };
        connectionDb.push(tempConnectionData);

        // update user Data

        // !!!!!!!!!!!!!!!!!!!!!!!!! TODO separate self connection id update in user service 

        const tempUserData = { ...userData };
        tempUserData.selfConnectionId = userConnectionId;

        //

        tempUserData.connectionList.push({
          id: tempConnectionData.connectionId,
          name: tempConnectionData.connectionName,
          type: tempConnectionData.connectionType,
          imageUrl: "",
        });

        userConnectionsDb[userDataIndex] = tempUserData;
        // sdf
      }
 */
      archiveMsg(userData.selfConnectionId, tempMsgPayload); // TODO could be event

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

      console.log("recieved connectionId");
      console.log(connectionId);

      console.log("connection data");

      connectionDb.forEach((connectionData) => {
        console.log(connectionData);
      });

      if (!connection) {
        console.log("Connection search Error!!!!"); // TODO throw error here
        throw Error("no such connection");
      }

      //   let msgRecievers = [];

      checkWritingPermissions(connection, payload.senderId);

      /*  msgRecievers = getMsgRecieversList(
        payload.senderId,
        connection.participants
      ); */

      const msgUuid = uuid();

      const tempMsgPayload: archivedMsg = {
        id: msgUuid,
        msgPayload: payload,
      };

      archiveMsg(connectionId, tempMsgPayload); // TODO could be event

      connection.participants.forEach((reciever) => {
        pusher.trigger(reciever, EventNamesEnum.msgFromConnection, {
          connectionId: connectionId,
          payload: tempMsgPayload,
        });
      });

      console.log("logs before send msgFromConnection");

      console.log(msgDb);

      res.send({
        status: "success",
        data: payload,
      });
    } catch (error) {
      console.error(`msgFromConnectionReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/channelPost", (req: Request, res: Response) => {
    try {
      const {
        connectionId,
        payload,
      }: { connectionId: string; payload: msgPayloadInterface } = req.body;

      const connection = connectionDb.find(
        (connection) => connection.connectionId === connectionId
      );

      console.log("recieved connectionId");
      console.log(connectionId);

      console.log("connection data");

      connectionDb.forEach((connectionData) => {
        console.log(connectionData);
      });

      if (!connection) {
        console.log("Connection search Error!!!!"); // TODO throw error here
        throw Error("no such connection");
      }

      //   let msgRecievers = [];

      checkWritingPermissions(connection, payload.senderId);

      /*  msgRecievers = getMsgRecieversList(
        payload.senderId,
        connection.participants
      ); */

      const msgUuid = uuid();

      const tempMsgPayload: archivedMsg = {
        id: msgUuid,
        msgPayload: payload,
      };

      archiveMsg(connectionId, tempMsgPayload); // TODO could be event

      connection.participants.forEach((reciever) => {
        pusher.trigger(reciever, EventNamesEnum.msgFromConnection, {
          connectionId: connectionId,
          payload: tempMsgPayload,
        });
      });

      console.log("logs before send msgFromConnection");

      console.log(msgDb);

      res.send({
        status: "success",
        data: payload,
      });
    } catch (error) {
      console.error(`msgFromConnectionReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/channelCreation", (req: Request, res: Response) => {
    try {
      const { userId, channelName }: { userId: string; channelName: string } =
        req.body;

      const connectionId = uuid();

      const connectionData = {
        connectionId: connectionId,
        connectionName: `${channelName}`,
        connectionType: ConnectionEnum.channel,
        participants: [userId],
        participantsCanWrite: false,
        ownerId: userId,
        imageUrl: "",
      };

      connectionDb.push(connectionData);

      let requesterConnectionIndex;

      userConnectionsDb.find((userConnections, index) => {
        requesterConnectionIndex = index;
        return userConnections.userId === userId;
      });

      if (typeof requesterConnectionIndex === "undefined") {
        console.log("no user found!!!");
        return Error("no user found");
      }

      userConnectionsDb[requesterConnectionIndex].connectionList.push({
        id: connectionData.connectionId,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      pusher.trigger(userId, EventNamesEnum.channelCreated, {
        connectionUuid: connectionData.connectionId,
        connectionName: connectionData.connectionName,
        connectionType: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      res.send({
        status: "success",
        data: {},
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

      if (!userData || typeof userDataIndex === "undefined") {
        console.log("no such user");
        throw Error("no such user!!!"); // TODO throw error here
      }

      const tempUserData = { ...userData };

      let connectionDataIndex;

      const connectionData = connectionDb.find((connection, index) => {
        connectionDataIndex = index;
        return connection.connectionId === connectionId;
      });

      if (!connectionData || typeof connectionDataIndex === "undefined") {
        console.log("no such connection"); // TODO throw error here
        throw Error("no such connection!!!");
      }

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

      pusher.trigger(requesterId, EventNamesEnum.channelSubscribed, {
        connectionUuid: connectionData.connectionId,
        connectionName: connectionData.connectionName,
        connectionType: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      res.send({
        status: "success",
        data: {},
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

      if (!userData || typeof userDataIndex === "undefined") {
        console.log("no such user");
        throw Error("no such user!!!"); // TODO throw error here
      }

      // delete user from connection

      let connectionDataIndex;

      const connectionData = connectionDb.find((connection, index) => {
        connectionDataIndex = index;
        return connection.connectionId === connectionId;
      });

      if (!connectionData || typeof connectionDataIndex === "undefined") {
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

      pusher.trigger(requesterId, EventNamesEnum.channelUnsubscribed, {
        connectionUuid: connectionData.connectionId,
      });

      res.send({
        status: "success",
        data: {},
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

      if (
        connectionRequestData &&
        typeof connectionRequestIndex !== "undefined"
      ) {
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

      console.log("logs before send directConnectionRequestReq");

      console.log("connection request DB");
      console.log(connectionRequestDb);

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
      }: {
        userId: string;
        requesterId: string;
      } = req.body;

      // clean from requesters -> get userId from there for both and add to DB

      let connectionRequestIndex;

      const connectionRequestData = connectionRequestDb.find(
        (connectionRequest, index) => {
          connectionRequestIndex = index;
          return connectionRequest.userId === userId;
        }
      );

      console.log("userId");
      console.log(userId);
      connectionRequestDb.forEach((test) => {
        console.log(test);
      });

      console.log("connection request data");
      console.log(connectionRequestData);

      if (
        !connectionRequestData ||
        typeof connectionRequestIndex === "undefined"
      ) {
        console.log("No connection for approve");
        throw Error("No connection for approve"); // TODO throw error here
      }

      connectionRequestDb[connectionRequestIndex].requesters =
        connectionRequestDb[connectionRequestIndex].requesters.filter(
          (requester) => requester.userId !== requesterId
        );

      // check requester existance

      // TODO replace below with EXTRA req to user-service -> future answer is sent via event from user-service

      // first request to user-service -> than emit event to connection service -> emit Pusher event

      let requesterConnectionIndex;

      userConnectionsDb.find((userConnections, index) => {
        requesterConnectionIndex = index;
        return userConnections.userId === requesterId;
      });

      if (typeof requesterConnectionIndex === "undefined") {
        console.log("no user found!!!");
        return Error("no user found");
      }

      // check approver existence

      let approverConnectionIndex;

      userConnectionsDb.find((userConnections, index) => {
        approverConnectionIndex = index;
        return userConnections.userId === userId;
      });

      if (typeof approverConnectionIndex === "undefined") {
        console.log("no approver found!!!");
        return Error("no approver found");
      }

      // adding connection to DB

      const connectionUuid = uuid();

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

      // adding connection to requester TODO move this logic to user-service

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
        connectionUuid: connectionUuid,
        connectionName: connectionData.connectionName,
        connectionType: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      pusher.trigger(userId, EventNamesEnum.connectionAccepted, {
        requesterId,
        accepterId: userId,
        connectionUuid: connectionUuid,
        connectionName: connectionData.connectionName,
        connectionType: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      console.log("logs before send connectionAcceptedReq");

      console.log("connection request DB");
      console.log(connectionRequestDb);

      console.log("user connections Db");
      console.log({ ...userConnectionsDb });

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
      }: {
        userId: string;
        requesterId: string;
      } = req.body;

      let connectionRequestIndex;

      const connectionRequestData = connectionRequestDb.find(
        (connectionRequest, index) => {
          connectionRequestIndex = index;
          return connectionRequest.userId === userId;
        }
      );

      if (
        !connectionRequestData ||
        typeof connectionRequestIndex === "undefined"
      ) {
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

      console.log("logs before send connectionRejectedReq");

      console.log("connection request DB");
      console.log(connectionRequestDb);

      console.log("user connections Db");
      console.log(userConnectionsDb);

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
    // TODO refactor
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

      console.log("getHistoryReq logs");
      console.log(msgDb);

      pusher.trigger(userId, MQEventNamesEnum.getAllHistory, {
        connectionId,
        msgList: history,
      });

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(`getHistoryReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/getHistoryBySelectedConnections", (req, res) => {
    // !!! transfer to Map(Object)
    try {
      const {
        userId,
        selectedConnectionIdList,
      }: {
        userId: string;
        selectedConnectionIdList: string[];
      } = req.body;

      // check user existence

      //   let approverConnectionIndex;

      // TODO user existance approved by access token

      /* const userData = userConnectionsDb.find((userConnections, index) => {
        approverConnectionIndex = index;
        return userConnections.userId === userId;
      });

      if (!approverConnectionIndex) {
        console.log("no approver found!!!");
        return Error("no approver found");
      }
 */

      console.log("selected connection id list");
      console.log(selectedConnectionIdList);

      const msgHistoryData = selectedConnectionIdList.map((connectionId) => {
        const msgData = msgDb.find((msgArchiveData) => {
          return msgArchiveData.connectionId === connectionId;
        });

        return {
          connectionId,
          msgList:
            msgData && msgData.connectionMessages.length
              ? msgData.connectionMessages
              : [],
        };
      });

      console.log("msg history data");
      console.log(msgHistoryData);

      pusher.trigger(userId, MQEventNamesEnum.getAllHistory, {
        msgHistory: msgHistoryData,
      });

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(`getAllHistoryReq error:: ${(error as Error).message}`);
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

      console.log("getRequestersList logs");
      console.log(connectionRequestDb);

      pusher.trigger(requesterId, MQEventNamesEnum.getRequesters, {
        requesters: [...requesterList],
      });

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(`getRequestersList error:: ${(error as Error).message}`);
      throw error;
    }
  });

  return router;
};
