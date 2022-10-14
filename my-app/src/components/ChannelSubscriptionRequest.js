import React from "react";
import "./ChatBox.css";
export default ({
  channelIdForSubscribe,
  handleNewChannelSubscriptionRequest,
  channelIdForSubscribeChange,
}) => (
  <div style={{ border: "2px solid black" }}>
    <div className="row">
      <div className="col-xs-12">
        <div className="chat">
          <span>Type Channel Id to subscribe</span>
          <div className="col-xs-5 col-xs-offset-3">
            <input
              type="text"
              value={channelIdForSubscribe}
              placeholder="chat here..."
              className="form-control"
              onChange={channelIdForSubscribeChange}
              onKeyDown={channelIdForSubscribeChange}
            />
            <button
              type="button"
              onClick={() => handleNewChannelSubscriptionRequest()}
            >
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
