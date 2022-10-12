import React, { Component } from "react";
import axios from "axios";
import Pusher from "pusher-js";
import ChatList from "./components/ChatList";
import ChatBox from "./components/ChatBox";
import ConnectionList from "./components/ConnectionList";
import UserList from "./components/UserList";
import UserRequest from "./components/UserRequest";
import logo from "./logo.svg";
import { constants } from "./constants/constants";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      username: "",
      chats: [],
      connections: [],
      usersList: [],
      userRequestList: [],
      selectedUser: {},
    };
  }

  componentDidMount() {
    this.setState({
      username: "",
      text: "",
      chats: [],
      connections: [],
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
          connectionList: [
            {
              // user service part
              userId: "lehusUserId",
              userName: "Lehus",
              selfConnectionId: "",
              connectionList: [],
            },
          ],
        },
      ],
      userRequestList: [],
      selectedUser: {},
    });

    this.pusherInit();

    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.selectUser = this.selectUser.bind(this);
    this.selectConnection = this.selectConnection.bind(this);
    this.acceptUserReq = this.acceptUserReq.bind(this);
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

    const channel = pusher.subscribe("chat"); // change pusher id

    channel.bind("msgFromConnection", (data) => {
      console.log("msgFromConnection event");
      this.setState({ chats: [...this.state.chats, data], test: "" });
    });

    channel.bind("channelPost", (data) => {
      console.log("channelPost event");
    });

    channel.bind("directConnectionRequest", (data) => {
      console.log("directConnectionRequest event");
    });

    channel.bind("connectionAccepted", (data) => {
      console.log("connectionAccepted event");
    });

    channel.bind("connectionRejected", (data) => {
      console.log("connectionRejected event");
    });

    channel.bind("getHistory", (data) => {
      console.log("getHistory event");
    });
  }

  /* healthCheck() {
    axios.defaults.headers.common["Accept"] = "application/json";

    axios.get("http://localhost:5000/api/health").then((response) => {
      console.log("Health Response!");
    });
  } */

  handleTextChange(e) {
    if (e.keyCode === 13) {
      const payload = {
        username: this.state.username,
        message: this.state.text,
      };
      axios.post("http://localhost:5000/message", payload);
    } else {
      this.setState({ text: e.target.value });
    }
  }

  handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  }

  selectUser(e) {
    console.log("select user");
    console.log(e);
    console.log("selected user");
    const selectedUser = this.state.usersList.find((user) => user.userId === e);

    this.setState({
      selectedUser: { ...selectedUser },
      connections: [...selectedUser.connectionList],
    });

    console.log("selected user");
    console.log(this.state.selectedUser);
  }

  selectConnection(e) {
    console.log("select connection");
    console.log(e);
  }

  acceptUserReq(e) {
    console.log("Accept user request");
    console.log(e);
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
              handleTextChange={this.handleTextChange}
              handleUsernameChange={this.handleUsernameChange}
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
          />
        </div>
      </div>
    );
  }
}

export default App;
