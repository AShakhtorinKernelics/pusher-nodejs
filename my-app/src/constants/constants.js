export const constants = {
  app_key: "aaef2f3cfff1fc95bb62",
  app_cluster: "eu",
};

export const EventNamesEnum = {
  msgFromConnection: "msgFromConnection",
  channelPost: "channelPost",
  directConnectionRequest: "directConnectionRequest",
  connectionAccepted: "connectionAccepted",
  connectionRejected: "connectionRejected",
  channelCreated: "channelCreated",
  channelSubscribed: "channelSubscribed",
  channelUnsubscribed: "channelUnsubscribed",
};

export const MQEventNamesEnum = {
  getHistory: "getHistory",
  getRequesters: "getRequesters",
  getConnections: "getConnections",
};

export const ConnectionEnum = {
  multiChat: "multiChat",
  directChat: "directChat",
  channel: "channel",
  selfChat: "selfChat",
};
