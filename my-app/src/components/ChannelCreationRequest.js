import React from "react";
import "./ChatBox.css";
export default ({
  channelName,
  handleNewChannelRequest,
  onChannelNameChange,
}) => (
  <div style={{ border: "2px solid black" }}>
    <div className="row">
      <div className="col-xs-12">
        <div className="chat">
          <span>Type Channel Name to Create Channel</span>
          <div className="col-xs-5 col-xs-offset-3">
            <input
              type="text"
              value={channelName}
              placeholder="chat here..."
              className="form-control"
              onChange={onChannelNameChange}
              onKeyDown={onChannelNameChange}
            />
            <button type="button" onClick={() => handleNewChannelRequest()}>
              Send msg
            </button>
          </div>
          <div className="clearfix"></div>
        </div>
      </div>
      {/* <h4 className="greetings">Hello, {username}</h4> */}
    </div>
  </div>
);
