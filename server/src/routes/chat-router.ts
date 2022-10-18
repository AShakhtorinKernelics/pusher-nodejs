import express, { Response, Request } from "express";
import { v4 as uuid } from "uuid";
import Pusher from "pusher";
import { Connection } from "../models/Connection";
import { UserConnectionList } from "../models/UserConnectionList";
import { ArchivedConnectionData } from "../models/ArchivedConnectionData";
import { ConnectionRequest } from "../models/ConnectionRequest";

interface UserConnectionInterface {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
}

export enum ConnectionEnum {
  multiChat = "multiChat",
  directChat = "directChat",
  channel = "channel",
  selfChat = "selfChat",
}

interface archivedMsg {
  msgPayload: msgPayloadInterface;
}

interface archivedConnectionData {
  connectionId: string;
  connectionMessages: archivedMsg[];
}

interface connectionInteface {
  connectionId: string;
  connectionName: string;
  connectionType: ConnectionEnum;
  participants: string[];
  ownerId: string;
  participantsCanWrite: boolean;
  imageUrl: string;
}

interface ConnectionRequestInterface {
  userId: string;
  requesters: { userId: string; userName: string }[];
}

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
  getConnections = "getConnections",
}

interface msgPayloadInterface {
  senderId: string;
  senderName: string;
  text: string;
  type: ConnectionEnum;
}

export const chatRouterInit = (pusher: Pusher) => {
  const router = express.Router();

  const checkWritingPermissions = (
    connection: connectionInteface,
    senderId: string
  ) => {
    if (!connection.participantsCanWrite && connection.ownerId !== senderId) {
      console.log("Sending error!!!"); // TODO throw error here
      throw Error("No writing permissions");
    }
  };

  const archiveMsg = async (connectionId: string, msgPayload: archivedMsg) => {
    /* const connectionHistory = msgDb.find(
      (historyData) => historyData.connectionId === connectionId
    ); */

    const connectionHistory = await ArchivedConnectionData.findOne({
      connectionId,
    });

    if (connectionHistory) {
      connectionHistory.connectionMessages;

      connectionHistory.connectionMessages.push(msgPayload);
      await connectionHistory.save();
    } else {
      const archivedConnectionData = new ArchivedConnectionData({
        connectionId,
        connectionMessages: [msgPayload],
      });

      /* msgDb.push({
        connectionId,
        connectionMessages: [msgPayload],
      }); */

      await archivedConnectionData.save();
    }
  };

  const getArchiveMsgList = async (connectionId: string) => {
    /* const connectionHistory = msgDb.find(
      (historyData) => historyData.connectionId === connectionId
    ); */

    const connectionHistory = await ArchivedConnectionData.findOne({
      connectionId,
    });

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

  router.post("/writeSelf", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        payload,
      }: { userId: string; payload: msgPayloadInterface } = req.body;

      const tempMsgPayload: archivedMsg = {
        msgPayload: payload,
      };

      const userConnection = await UserConnectionList.findOne({
        userId,
      });

      if (!userConnection) {
        console.log("No such user error!");
        throw Error("No such user error!");
      }

      const existingselfConnection = userConnection.connectionList.find(
        (connection: any) =>
          connection.connectionType === ConnectionEnum.selfChat
      );

      let selfConnectionId;

      if (!existingselfConnection) {
        const userConnectionId = uuid();

        const tempConnectionData = {
          connectionId: userConnectionId,
          connectionName: `Self connection ${userId}`,
          connectionType: ConnectionEnum.selfChat,
          participants: [userId],
          participantsCanWrite: false,
          ownerId: userId,
          imageUrl: "",
        };

        const selfConnection = new Connection(tempConnectionData);

        await selfConnection.save();

        userConnection.connectionList.push({
          connectionId: tempConnectionData.connectionId,
          connectionName: tempConnectionData.connectionName,
          connectionType: tempConnectionData.connectionType,
          imageUrl: tempConnectionData.imageUrl,
        });

        await userConnection.save();
        selfConnectionId = userConnectionId;
      } else {
        selfConnectionId = existingselfConnection.connectionId;
      }

      await archiveMsg(selfConnectionId, tempMsgPayload); // TODO could be event

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(`writeSelfReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post(
    "/sendMessageToConnection",
    async (req: Request, res: Response) => {
      try {
        const {
          connectionId,
          payload,
        }: { connectionId: string; payload: msgPayloadInterface } = req.body;

        const connection = await Connection.findOne({ connectionId });

        if (!connection) {
          console.log("Connection search Error!!!!"); // TODO throw error here
          throw Error("no such connection");
        }

        checkWritingPermissions(connection, payload.senderId);

        const tempMsgPayload: archivedMsg = {
          msgPayload: payload,
        };

        await archiveMsg(connectionId, tempMsgPayload); // TODO could be event

        connection.participants.forEach((reciever) => {
          pusher.trigger(reciever, EventNamesEnum.msgFromConnection, {
            connectionId: connectionId,
            payload: tempMsgPayload,
          });
        });

        res.send({
          status: "success",
          data: {},
        });
      } catch (error) {
        console.error(
          `msgFromConnectionReq error:: ${(error as Error).message}`
        );
        throw error;
      }
    }
  );

  router.post("/channelPost", async (req: Request, res: Response) => {
    try {
      const {
        connectionId,
        payload,
      }: { connectionId: string; payload: msgPayloadInterface } = req.body;

      const connection = await Connection.findOne({ connectionId });

      if (!connection) {
        console.log("Connection search Error!!!!"); // TODO throw error here
        throw Error("no such connection");
      }

      checkWritingPermissions(connection, payload.senderId);

      const tempMsgPayload: archivedMsg = {
        msgPayload: payload,
      };

      await archiveMsg(connectionId, tempMsgPayload); // TODO could be event

      connection.participants.forEach((reciever) => {
        pusher.trigger(reciever, EventNamesEnum.msgFromConnection, {
          connectionId: connectionId,
          payload: tempMsgPayload,
        });
      });

      res.send({
        status: "success",
        data: {},
      });
    } catch (error) {
      console.error(`msgFromConnectionReq error:: ${(error as Error).message}`);
      throw error;
    }
  });

  router.post("/channelCreation", async (req: Request, res: Response) => {
    try {
      const { userId, channelName }: { userId: string; channelName: string } =
        req.body;
      // create and save connection
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

      const dbConnectionData = new Connection({ ...connectionData });

      await dbConnectionData.save();
      // find  user data and add connectionList
      const userConnectionListData = await UserConnectionList.findOne({
        userId,
      });

      if (!userConnectionListData) {
        console.log("No such user error!");
        throw Error("No such user error!");
      }

      userConnectionListData.connectionList.push({
        id: connectionData.connectionId,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      await userConnectionListData.save();

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

  router.post("/channelSubscription", async (req: Request, res: Response) => {
    try {
      const {
        connectionId,
        requesterId,
      }: { connectionId: string; requesterId: string } = req.body;
      // find and add user to connection
      const connectionData = await Connection.findOne({ connectionId });

      if (!connectionData) {
        console.log("no such connection"); // TODO throw error here
        throw Error("no such connection!!!");
      }

      connectionData.participants.push(requesterId);

      await connectionData.save();
      // add connection to user connection data
      const userConnectionListData = await UserConnectionList.findOne({
        requesterId,
      });

      if (!userConnectionListData || userConnectionListData?.connectionList) {
        console.log("no connection list!");
        throw Error("NO connection list!");
      }

      userConnectionListData.connectionList.push({
        id: connectionData.connectionId,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      await userConnectionListData.save();

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

  router.post("/channelUnsubscribe", async (req: Request, res: Response) => {
    // TODO finish refactoring below
    try {
      const {
        connectionId,
        requesterId,
      }: { connectionId: string; requesterId: string } = req.body;

      // let userDataIndex;

      const connectionData = await Connection.findOne({ connectionId });

      if (!connectionData) {
        console.log("no such connection"); // TODO throw error here
        throw Error("no such connection!!!");
      }

      connectionData.participants.filter(
        (participant) => participant !== requesterId
      );

      await connectionData.save();

      // add connection to user connection data
      const userConnectionListData = await UserConnectionList.findOne({
        requesterId,
      });

      if (!userConnectionListData || userConnectionListData?.connectionList) {
        console.log("no connection list!");
        throw Error("NO connection list!");
      }

      userConnectionListData.connectionList =
        userConnectionListData.connectionList.filter(
          (connection: any) => connection.id !== connectionId
        );

      await userConnectionListData.save();

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

  router.post(
    "/directConnectionRequest",
    async (req: Request, res: Response) => {
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

        const connectionRequestData = await ConnectionRequest.findOne({
          userId,
        });

        const tempConnectionRequestData = {
          userId: requesterId,
          userName: requesterName,
        };

        if (
          connectionRequestData /* &&
          typeof connectionRequestIndex !== "undefined" */
        ) {
          // connectionRequestDb[connectionRequestIndex].requesters.push(
          // tempConnectionRequestData
          // );

          connectionRequestData.requesters.push(tempConnectionRequestData);

          await connectionRequestData.save();
        } else {
          // connectionRequestDb.push({
          // userId,
          // requesters: [tempConnectionRequestData],
          // });

          const newConnectionRequest = new ConnectionRequest({
            userId,
            requesters: [tempConnectionRequestData],
          });

          await newConnectionRequest.save();
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
    }
  );

  router.post("/connectionAccepted", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        requesterId,
      }: {
        userId: string;
        requesterId: string;
      } = req.body;

      // clean from requesters -> get userId from there for both and add to DB

      // let connectionRequestIndex;

      // const connectionRequestData = connectionRequestDb.find(
      // (connectionRequest, index) => {
      // connectionRequestIndex = index;
      // return connectionRequest.userId === userId;
      // }
      // );

      const connectionRequestData = await ConnectionRequest.findOne({ userId });

      if (
        !connectionRequestData /* ||
        typeof connectionRequestIndex === "undefined" */
      ) {
        console.log("No connection for approve");
        throw Error("No connection for approve"); // TODO throw error here
      }

      connectionRequestData.requesters.filter(
        (requester) => requester.userId !== requesterId
      );

      await connectionRequestData.save();
      // connectionRequestDb[connectionRequestIndex].requesters =
      // connectionRequestDb[connectionRequestIndex].requesters.filter(
      // (requester) => requester.userId !== requesterId
      // );

      // check requester existance

      // TODO replace below with EXTRA req to user-service -> future answer is sent via event from user-service

      // first request to user-service -> than emit event to connection service -> emit Pusher event

      /* let requesterConnectionIndex;

      UserConnectionList.findOne({ userId: requesterId });

      userConnectionsDb.find((userConnections, index) => {
        requesterConnectionIndex = index;
        return userConnections.userId === requesterId;
      });

      if (typeof requesterConnectionIndex === "undefined") {
        console.log("no user found!!!");
        return Error("no user found");
      }
 */
      // check approver existence

      /* let approverConnectionIndex;

      userConnectionsDb.find((userConnections, index) => {
        approverConnectionIndex = index;
        return userConnections.userId === userId;
      });

      if (typeof approverConnectionIndex === "undefined") {
        console.log("no approver found!!!");
        return Error("no approver found");
      }
 */
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

      const tempConnectinData = new Connection(connectionData);
      await tempConnectinData.save();

      // connectionDb.push(connectionData);

      // adding connection to requester TODO move this logic to user-service
      // TODO user-service communication

      const userConnectionData = await UserConnectionList.findOne({
        userId: userId,
      });

      console.log("userId");
      console.log(userConnectionData);

      if (
        !userConnectionData ||
        typeof userConnectionData?.connectionList === "undefined"
      ) {
        console.log("no connection list!");
        throw Error("NO connection list!");
      }

      userConnectionData.connectionList.push({
        id: connectionUuid,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      await userConnectionData.save();

      const requesterConnectionData = await UserConnectionList.findOne({
        userId: requesterId,
      });

      console.log("requesterId");
      console.log(requesterConnectionData);

      if (
        !requesterConnectionData ||
        typeof requesterConnectionData?.connectionList === "undefined"
      ) {
        console.log("no connection list!");
        throw Error("NO connection list!");
      }

      requesterConnectionData.connectionList.push({
        id: connectionUuid,
        name: connectionData.connectionName,
        type: connectionData.connectionType,
        imageUrl: connectionData.imageUrl,
      });

      await requesterConnectionData.save();

      /*  userConnectionsDb[requesterConnectionIndex].connectionList.push({
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
      }); */

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

  router.post("/connectionRejected", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        requesterId,
      }: {
        userId: string;
        requesterId: string;
      } = req.body;

      // let connectionRequestIndex;

      // const connectionRequestData = connectionRequestDb.find(
      // (connectionRequest, index) => {
      // connectionRequestIndex = index;
      // return connectionRequest.userId === userId;
      // }
      // );
      const connectionRequestData = await ConnectionRequest.findOne({ userId });

      if (
        !connectionRequestData /* ||
        typeof connectionRequestIndex === "undefined" */
      ) {
        console.log("No connection for approve");
        throw Error("No connection for approve"); // TODO throw error here
      }

      // connectionRequestDb[connectionRequestIndex].requesters =
      // connectionRequestDb[connectionRequestIndex].requesters.filter(
      // (requester) => requester.userId !== requesterId
      // );

      connectionRequestData.requesters.filter(
        (requester) => requester.userId !== requesterId
      );

      await connectionRequestData.save();

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

  router.post("/getHistory", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        connectionId,
      }: {
        userId: string;
        connectionId: string;
      } = req.body;

      /* const connectionData = connectionDb.find((connection) => {
        return connection.connectionId === connectionId;
      }); */

      const connectionData = await Connection.findOne({ connectionId });

      if (!connectionData) {
        console.log("No connection found!!!");
        throw Error("No connection found!!!"); // TODO throw error here
      }

      const isReqAllowed = checkConnectionAccess(connectionData, userId);

      if (!isReqAllowed) {
        console.log("No connection access allowed!!!");
        throw Error("No connection access allowed!!!"); // TODO throw error here
      }

      const history = await getArchiveMsgList(connectionId);

      console.log("archive db");
      const test = await ArchivedConnectionData.find({});
      console.log(test);

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

  router.post("/getHistoryBySelectedConnections", async (req, res) => {
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

      /* const msgHistoryData = await selectedConnectionIdList.map(
        async (connectionId) => {
          const msgArchivedData = await ArchivedConnectionData.findOne({
            connectionId,
          });

          console.log("msg archived data");
          console.log(msgArchivedData);

          return {
            connectionId,
            msgList:
              msgArchivedData && msgArchivedData.connectionMessages.length
                ? msgArchivedData.connectionMessages
                : [],
          };
        }
      ); */

      const msgHistoryData = await Promise.all(
        selectedConnectionIdList.map(async (connectionId) => {
          const msgArchivedData = await ArchivedConnectionData.findOne({
            connectionId,
          });

          console.log("msgHistoryData");
          console.log(msgHistoryData);
          return {
            connectionId,
            msgList:
              msgArchivedData && msgArchivedData.connectionMessages.length
                ? msgArchivedData.connectionMessages
                : [],
          };
        })
      );

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

  router.post("/getRequestersList", async (req: Request, res: Response) => {
    try {
      const { requesterId }: { requesterId: string } = req.body;

      /*  const requesterData = connectionRequestDb.find(
        (connectionReq) => connectionReq.userId === requesterId
      ); */

      const requesterData = await ConnectionRequest.findOne({
        userId: requesterId,
      });

      const requesterList = requesterData ? requesterData.requesters : [];

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

  router.post(
    "/getConnectionListByUserId",
    async (req: Request, res: Response) => {
      try {
        const { userId }: { userId: string } = req.body;

        const userConnectionInfo = await UserConnectionList.findOne({
          userId,
        });

        if (!userConnectionInfo) {
          const newConnectionList = new UserConnectionList({
            userId,
            connectionList: [],
          });
          await newConnectionList.save();
        }

        pusher.trigger(userId, "getConnections", {
          connectionList: userConnectionInfo
            ? [...userConnectionInfo.connectionList]
            : [],
        });

        console.log("get connections");
        const test = UserConnectionList.find();
        console.log(test);

        res.send({
          status: "success",
          data: {},
        });
      } catch (error) {
        console.error(
          `getConnectionListByUserId error:: ${(error as Error).message}`
        );
        throw error;
      }
    }
  );

  return router;
};
