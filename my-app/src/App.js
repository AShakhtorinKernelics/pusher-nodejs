import React, { Component } from "react";
import axios from "axios";
import Pusher from "pusher-js";
import MsgList from "./components/MsgList";
import ChatBox from "./components/ChatBox";
import ConnectionList from "./components/ConnectionList";
import UserList from "./components/UserList";
import UserRequest from "./components/UserRequest";
import UserConnectionRequest from "./components/UserConnectionRequest";
import ChannelCreationRequest from "./components/ChannelCreationRequest";
import ChannelSubscriptionRequest from "./components/ChannelSubscriptionRequest";
import logo from "./logo.svg";
import {
  constants,
  MQEventNamesEnum,
  EventNamesEnum,
  ConnectionEnum,
} from "./constants/constants";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      channelName: "",
      username: "",
      connections: [],
      connectionMsgMap: {},
      usersList: [],
      userRequestList: [],
      selectedUser: {},
      selectedConnection: {},
      userIdForConnectionRequest: "",
      channelIdForSubscribe: "",
    };
  }

  componentDidMount() {
    this.setState({
      username: "",
      text: "",
      channelName: "",
      connections: [],
      connectionMsgMap: {},
      usersList: [
        {
          userId: "lehusUserId",
          userName: "Lehus",
          selfConnectionId: "",
          connectionList: [],
        },
        {
          userId: "testUserId",
          userName: "TestUser",
          selfConnectionId: "",
          connectionList: [],
        },
      ],
      userRequestList: [],
      selectedUser: {},
      selectedConnection: {},
      userIdForConnectionRequest: "",
      channelIdForSubscribe: "",
    });

    this.handleNewMsg = this.handleNewMsg.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.selectUser = this.selectUser.bind(this);
    this.selectConnection = this.selectConnection.bind(this);
    this.acceptUserReq = this.acceptUserReq.bind(this);
    this.rejectUserReq = this.rejectUserReq.bind(this);
    this.handleNewUserConnectionReq =
      this.handleNewUserConnectionReq.bind(this);
    this.onUserIdChange = this.onUserIdChange.bind(this);
    this.msgTextChange = this.msgTextChange.bind(this);
    this.handleNewChannelRequest = this.handleNewChannelRequest.bind(this);
    this.onChannelNameChange = this.onChannelNameChange.bind(this);
    this.handleNewChannelSubscriptionRequest =
      this.handleNewChannelSubscriptionRequest.bind(this);
    this.channelIdForSubscribeChange =
      this.channelIdForSubscribeChange.bind(this);
  }

  pusherInit(userId) {
    console.log("pusher Init func");

    // get company Info
    const stockList = ["AAPL", "FB", "TSLA"].join(",");
    const token = "sk_d49e4fe09bd64537913bf4f1c00adc2d";
    const dataFilters = ["symbol", "industry", "companyName"].join(",");
    /*axios
      .get(
        `https://cloud.iexapis.com/v1/stock/market/company?symbols=${stockList}&filter=${dataFilters}&token=${token}`
      )
      .then((res) => {
        console.log("iex cloud company result");
        console.log(res);
      }); */

    // get Ticker Info

    /* const tickersDataFilters = [
      "companyName",
      "peRatio",
      "day5ChangePercent",
      "dividendYield",
    ].join(",");

    axios
      .get(
        `https://cloud.iexapis.com/v1/stock/market/stats?symbols=${stockList}&filter=${tickersDataFilters}&token=${token}`
      )
      .then((res) => {
        console.log("iex cloud company result");
        console.log(res);
      });
 */
    const pusher = new Pusher(constants.app_key, {
      cluster: constants.app_cluster,
    });

    pusher.connection.bind("connected", function () {
      console.log("Realtime is go!");
    });

    pusher.connection.bind("error", function (err) {
      if (err.error.data.code === 4004) {
        console.log(">>> detected limit error");
      }
    });

    const channel = pusher.subscribe(userId); // TODO change pusher id

    channel.bind("pusher:subscription_succeeded", (data) => {
      console.log("after subscription succeded");

      axios.post("http://localhost:5000/getRequestersList", {
        requesterId: this.state.selectedUser.userId,
      });

      axios.post("http://localhost:5000/getConnectionListByUserId", {
        userId: this.state.selectedUser.userId,
      });
    });

    channel.bind(EventNamesEnum.msgFromConnection, (data) => {
      // same callback as below !!
      console.log("msgFromConnection event");

      const { connectionId, payload } = data;

      let tempState = { ...this.state.connectionMsgMap };
      tempState[connectionId].push({ ...payload });

      this.setState({ connectionMsgMap: tempState });
    });

    channel.bind(EventNamesEnum.channelPost, (data) => {
      // same callback as above !!
      console.log("channelPost event");

      const { connectionId, payload } = data;

      let tempState = { ...this.state.connectionMsgMap };
      tempState[connectionId].push({ ...payload });

      this.setState({ connectionMsgMap: tempState });
    });

    channel.bind(EventNamesEnum.directConnectionRequest, (data) => {
      console.log("directConnectionRequest event");

      const { userId, userName } = data;
      const tempRequestList = [...this.state.userRequestList];
      tempRequestList.push({
        userId,
        userName,
      });

      this.setState({ userRequestList: tempRequestList });
    });

    channel.bind(EventNamesEnum.channelCreated, (data) => {
      console.log("channelCreated event");

      const { connectionUuid, connectionName, connectionType, imageUrl } = data;

      const connectionList = [...this.state.connections];

      connectionList.unshift({
        id: connectionUuid,
        name: connectionName,
        type: connectionType,
        imageUrl: imageUrl,
      });

      const tempConnectionMsgMap = { ...this.state.connectionMsgMap };
      tempConnectionMsgMap[connectionUuid] = [];

      this.setState({ connections: connectionList });
      this.setState({ connectionMsgMap: tempConnectionMsgMap });
    });

    channel.bind(EventNamesEnum.connectionAccepted, (data) => {
      console.log("connectionAccepted event");

      const {
        requesterId,
        accepterId,
        connectionUuid,
        connectionName,
        connectionType,
        imageUrl,
      } = data;

      const currentUserData = this.state.selectedUser;

      if (currentUserData.userId === accepterId) {
        const tempUserRequestList = this.state.userRequestList.filter(
          (userRequest) => userRequest.userId !== requesterId
        );
        this.setState({ userRequestList: tempUserRequestList });
      }

      const connectionList = [...this.state.connections];
      connectionList.unshift({
        id: connectionUuid,
        name: connectionName,
        type: connectionType,
        imageUrl: imageUrl,
      });

      const tempConnectionMsgMap = { ...this.state.connectionMsgMap };
      tempConnectionMsgMap[connectionUuid] = [];

      this.setState({ connections: connectionList });
      this.setState({ connectionMsgMap: tempConnectionMsgMap });
    });

    channel.bind(EventNamesEnum.connectionRejected, (data) => {
      console.log("connectionRejected event");

      const { requesterId, rejecterId } = data;

      if (this.state.selectedUser.userId === rejecterId) {
        const tempUserRequestList = this.state.userRequestList.filter(
          (userRequest) => userRequest.userId !== requesterId
        );
        this.setState({ userRequestList: tempUserRequestList });
      }
    });

    channel.bind(EventNamesEnum.channelSubscribed, (data) => {
      console.log("channelSubscribed event");

      const { connectionUuid, connectionName, connectionType, imageUrl } = data;
      const connectionList = [...this.state.connections];
      connectionList.unshift({
        id: connectionUuid,
        name: connectionName,
        type: connectionType,
        imageUrl: imageUrl,
      });

      const tempConnectionMsgMap = { ...this.state.connectionMsgMap };
      tempConnectionMsgMap[connectionUuid] = [];

      this.setState({ connections: connectionList });
      this.setState({ connectionMsgMap: tempConnectionMsgMap });
    });

    channel.bind(EventNamesEnum.channelUnsubscribed, (data) => {
      const { connectionUuid } = data;

      const connectionList = [...this.state.connections];
      connectionList.filter((connection) => connection.id === connectionUuid);

      const tempConnectionMsgMap = { ...this.state.connectionMsgMap };
      delete tempConnectionMsgMap[connectionUuid];

      this.setState({ connections: connectionList });
      this.setState({ connectionMsgMap: tempConnectionMsgMap });
    });

    // MQ events

    channel.bind(MQEventNamesEnum.getHistory, (data) => {
      console.log("getHistory event");
      let tempState = { ...this.state.connectionMsgMap };
      data.msgHistory.forEach((connectionHistory) => {
        tempState[connectionHistory.connectionId] = [
          ...connectionHistory.msgList,
        ];
      });

      this.setState({
        connectionMsgMap: tempState,
      });
    });

    channel.bind(MQEventNamesEnum.getRequesters, (data) => {
      console.log("getRequesters event");

      this.setState({ userRequestList: data.requesters });
    });

    channel.bind(MQEventNamesEnum.getConnections, (data) => {
      console.log("getConnections event");

      this.setState({ connections: data.connectionList });

      axios.post("http://localhost:5000/getHistoryBySelectedConnections", {
        userId: this.state.selectedUser.userId,
        selectedConnectionIdList: [
          ...data.connectionList.map((connection) => connection.id),
        ],
      });
    });
  }

  /* healthCheck() {
    axios.defaults.headers.common["Accept"] = "application/json";

    axios.get("http://localhost:5000/api/health").then((response) => {
      console.log("Health Response!");
    });
  } */

  handleNewMsg(e) {
    const payload = {
      senderId: this.state.selectedUser.userId,
      senderName: this.state.selectedUser.userName,
      text: this.state.text,
      type: this.state.selectedConnection.type,
    };

    axios.post("http://localhost:5000/sendMessageToConnection", {
      connectionId: this.state.selectedConnection.id,
      payload,
    });
  }

  handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  }

  selectUser(e) {
    console.log("select user");
    const selectedUser = this.state.usersList.find((user) => user.userId === e);

    this.setState({
      selectedUser: { ...selectedUser },
      connections: [...selectedUser.connectionList],
    });

    this.pusherInit(selectedUser.userId);
  }

  selectConnection(e) {
    console.log("select connection");

    const connectionData = this.state.connections.find(
      (connection) => connection.id === e
    );

    this.setState({
      selectedConnection: connectionData,
    });
  }

  acceptUserReq(e) {
    console.log("Accept user request");
    console.log(e); // userId

    axios.post("http://localhost:5000/connectionAccepted", {
      userId: this.state.selectedUser.userId,
      requesterId: e,
    });
  }

  rejectUserReq(e) {
    console.log("Reject user request");
    console.log(e); // userId

    axios.post("http://localhost:5000/connectionRejected", {
      userId: this.state.selectedUser.userId,
      requesterId: e,
    });
  }

  handleNewUserConnectionReq(e) {
    console.log("Handle new user request");

    axios.post("http://localhost:5000/directConnectionRequest", {
      userId: this.state.userIdForConnectionRequest,
      requesterId: this.state.selectedUser.userId,
      requesterName: this.state.selectedUser.userName,
    });
  }

  handleNewChannelRequest(e) {
    console.log("Handle new user request");

    axios.post("http://localhost:5000/channelCreation", {
      userId: this.state.selectedUser.userId,
      channelName: this.state.channelName,
    });
  }

  handleNewChannelSubscriptionRequest(e) {
    console.log("Handle new channel subscription");

    axios.post("http://localhost:5000/channelSubscription", {
      connectionId: this.state.channelIdForSubscribe,
      requesterId: this.state.selectedUser.userId,
    });
  }

  onUserIdChange(e) {
    this.setState({
      userIdForConnectionRequest: e.target.value,
    });
  }

  msgTextChange(e) {
    this.setState({
      text: e.target.value,
    });
  }

  onChannelNameChange(e) {
    this.setState({
      channelName: e.target.value,
    });
  }

  channelIdForSubscribeChange(e) {
    this.setState({
      channelIdForSubscribe: e.target.value,
    });
  }

  render() {
    return (
      <div className="App">
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex" }}>
            <ConnectionList
              connections={this.state.connections}
              selectConnection={this.selectConnection}
            />
          </div>
          <section style={{ display: "flex" }}>
            <MsgList
              selectedConnectionId={this.state.selectedConnection.id}
              msgList={
                this.state.selectedConnection.id
                  ? this.state.connectionMsgMap[
                      this.state.selectedConnection.id
                    ]
                  : []
              }
            />
            <ChatBox
              text={this.state.text}
              username={this.state.username}
              handleNewMsg={this.handleNewMsg}
              msgTextChange={this.msgTextChange}
            />
          </section>
        </div>
        <div style={{ display: "flex" }}>
          <UserList
            users={this.state.usersList}
            selectedUser={this.state.selectedUser}
            selectUser={this.selectUser}
          />
          <UserRequest
            userRequestList={this.state.userRequestList}
            acceptUserReq={this.acceptUserReq}
            rejectUserReq={this.rejectUserReq}
          />
          <UserConnectionRequest
            userIdForConnectionRequest={this.state.userIdForConnectionRequest}
            handleNewUserConnectionReq={this.handleNewUserConnectionReq}
            onUserIdChange={this.onUserIdChange}
          />
          <div style={{ display: "flex" }}>
            <ChannelCreationRequest
              channelName={this.state.channelName}
              handleNewChannelRequest={this.handleNewChannelRequest}
              onChannelNameChange={this.onChannelNameChange}
            />
            <ChannelSubscriptionRequest
              channelIdForSubscribe={this.state.channelIdForSubscribe}
              handleNewChannelSubscriptionRequest={
                this.handleNewChannelSubscriptionRequest
              }
              channelIdForSubscribeChange={this.channelIdForSubscribeChange}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
