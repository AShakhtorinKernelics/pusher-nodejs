import React from "react";
import "./ChatBox.css";
export default ({ text, username, handleTextChange, handleUsernameChange }) => (
  <div style={{ border: "2px solid black" }}>
    <div className="row">
      <div className="col-xs-12">
        {/* <div className="chat">
          <span>User</span>
          <div className="col-xs-5 col-xs-offset-3">
            <input
              type="text"
              value={username}
              placeholder="Write your name"
              className="form-control"
              onChange={handleUsernameChange}
              onKeyDown={handleUsernameChange}
            />
          </div>
          <div className="clearfix"></div>
        </div> */}

        <div className="chat">
          <span>Text</span>
          <div className="col-xs-5 col-xs-offset-3">
            <input
              type="text"
              value={text}
              placeholder="chat here..."
              className="form-control"
              onChange={handleTextChange}
              onKeyDown={handleTextChange}
            />
          </div>
          <div className="clearfix"></div>
        </div>
      </div>
      {/* <h4 className="greetings">Hello, {username}</h4> */}
    </div>
  </div>
);
