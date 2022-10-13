import React from "react";
import "./ChatBox.css";
export default ({ userIdForConnectionRequest, handleNewUserConnectionReq }) => (
  <div style={{ border: "2px solid black" }}>
    <div className="row">
      <div className="col-xs-12">
        <div className="chat">
          <span>Type UserId to make connection request</span>
          <div className="col-xs-5 col-xs-offset-3">
            <input
              type="text"
              value={userIdForConnectionRequest}
              placeholder="chat here..."
              className="form-control"
              /*               onChange={handleNewMsg}
              onKeyDown={handleNewMsg} */
            />
            <button type="button" onClick={() => handleNewUserConnectionReq()}>
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
