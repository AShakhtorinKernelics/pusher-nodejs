import React, { Component } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import ChatList from './ChatList';
import ChatBox from './ChatBox';
import logo from './logo.svg';
import { constants } from './constants/constants';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      username: '',
      chats: []
    };
  }

  componentDidMount() {
    this.setState({
      username: '',
      text: ''
    });
    const pusher = new Pusher(constants.app_key, {
      cluster: constants.app_cluster
    });

    pusher.connection.bind("connected", function () {
      console.log("Realtime is go!");
    });

    pusher.connection.bind("error", function (err) {
      if (err.error.data.code === 4004) {
        console.log(">>> detected limit error");
      }
    });

    const channel = pusher.subscribe('chat');

    channel.bind('message', data => {
      this.setState({ chats: [...this.state.chats, data], test: '' });
    });
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
  }

  healthCheck() {
    axios.defaults.headers.common["Accept"] = "application/json";

    axios.get("http://localhost:5000/api/health").then((response) => {
      console.log("Health Response!");
    });
  }

  handleTextChange(e) {
    if (e.keyCode === 13) {
      const payload = {
        username: this.state.username,
        message: this.state.text
      };
      axios.post('http://localhost:5000/message', payload);
    } else {
      this.setState({ text: e.target.value });
    }
  }

  handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React-Pusher Chat</h1>
          <button type="button"
            onClick={this.healthCheck}>Health Check</button>
        </header>
        <section>
          <ChatList chats={this.state.chats} />
          <ChatBox
            text={this.state.text}
            username={this.state.username}
            handleTextChange={this.handleTextChange}
            handleUsernameChange={this.handleUsernameChange}
          />
        </section>
      </div>
    );
  }
}

export default App;