import React, { Component } from "react";
import axios from "axios";
import Pusher from "pusher-js";
import ChatList from "./components/ChatList";
import ChatBox from "./components/ChatBox";
import ConnectionList from "./components/ConnectionList";
import UserList from "./components/UserList";
import UserRequest from "./components/UserRequest";
import UserConnectionRequest from "./components/UserConnectionRequest";
import logo from "./logo.svg";
import {
  constants,
  MQEventNamesEnum,
  EventNamesEnum,
} from "./constants/constants";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      username: "",
      chats: [],
      connections: [],
      connectionMsgMap: {},
      usersList: [],
      userRequestList: [],
      selectedUser: {},
      userIdForConnectionRequest: "",
    };
  }

  componentDidMount() {
    this.setState({
      username: "",
      text: "",
      chats: [],
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
      userIdForConnectionRequest: "",
    });

    this.handleNewMsg = this.handleNewMsg.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.selectUser = this.selectUser.bind(this);
    this.selectConnection = this.selectConnection.bind(this);
    this.acceptUserReq = this.acceptUserReq.bind(this);
    this.rejectUserReq = this.rejectUserReq.bind(this);
    this.handleNewUserConnectionReq =
      this.handleNewUserConnectionReq.bind(this);
  }

  pusherInit() {
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

    const channel = pusher.subscribe("chat"); // TODO change pusher id

    channel.bind("pusher:subscription_succeeded", (data) => {
      console.log("after subscription succeded");

      axios.post("http://localhost:5000/getRequestersList", {
        requesterId: this.state.selectedUser.userId,
      });

      axios.post(
        "http://getHistoryBySelectedConnections:5000/getHistoryBySelectedConnections",
        {
          selectedConnectionIdList: [...this.state.selectedUser.connectionList],
        }
      );
    });

    channel.bind(EventNamesEnum.msgFromConnection, (data) => {
      console.log("msgFromConnection event");
      this.setState({ chats: [...this.state.chats, data], test: "" });
    });

    channel.bind(EventNamesEnum.channelPost, (data) => {
      console.log("channelPost event");
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

      if (this.state.currentUserData.userId === rejecterId) {
        const tempUserRequestList = this.state.userRequestList.filter(
          (userRequest) => userRequest.userId !== requesterId
        );
        this.setState({ userRequestList: tempUserRequestList });
      }
    });

    // MQ events

    channel.bind(MQEventNamesEnum.getHistory, (data) => {
      console.log("getHistory event");

      let currentState = { ...this.state.connectionMsgMap };
      data.forEach((connectionHistory) => {
        currentState[connectionHistory.connectionId] = [
          ...connectionHistory.msgList,
        ];
      });

      this.setState({
        connectionMsgMap: currentState,
      });
    });

    channel.bind(MQEventNamesEnum.getRequesters, (data) => {
      console.log("getRequesters event");

      this.setState({ userRequestList: data.requesters });
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
      username: this.state.username,
      message: this.state.text,
    };
    axios.post("http://localhost:5000/message", payload);
  }

  handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  }

  selectUser(e) {
    console.log("selected user");
    console.log(e);
    const selectedUser = this.state.usersList.find((user) => user.userId === e);

    this.setState({
      selectedUser: { ...selectedUser },
      connections: [...selectedUser.connectionList],
    });

    this.pusherInit();
  }

  selectConnection(e) {
    console.log("select connection");
    console.log(e);
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

  handleNewUserConnectionReq() {
    console.log("Handle new user request");
    console.log("Req userId");
    console.log(this.state.userIdForConnectionRequest);

    axios.post("http://localhost:5000/directConnectionRequest", {
      userId: this.state.userIdForConnectionRequest,
      requesterId: this.state.selectedUser.userId,
      requesterName: this.state.selectedUser.userName,
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
            <ChatList chats={this.state.chats} />
            <ChatBox
              text={this.state.text}
              username={this.state.username}
              handleNewMsg={this.handleNewMsg}
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
            reqUsername={this.state.userIdForConnectionRequest}
            handleNewUserConnectionReq={this.handleNewUserConnectionReq}
          />
        </div>
      </div>
    );
  }
}

export default App;
