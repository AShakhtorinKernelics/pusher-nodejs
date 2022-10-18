import React from "react";
import "./ChatList.css";
import avatar from "../favicon.png";
export default ({ selectedConnectionId, msgList }) => {
  console.log(selectedConnectionId);
  console.log(msgList);
  if (!selectedConnectionId) {
    return (
      <div>
        <div className="row show-grid">
          <div className="col-xs-12">
            <div className="chatMessage">
              <p>No CONNECTION SELECTED !!!</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <ul style={{ width: "400px" }}>
        {msgList.map((msg) => {
          return (
            <div>
              <div className="row show-grid">
                <div className="col-xs-12">
                  <div className="chatMessage">
                    <div key={msg.id} className="box">
                      <p>
                        <strong>{msg.msgPayload.senderName}</strong>
                      </p>
                      <p>{msg.msgPayload.text}</p>
                    </div>
                    <div className="imageHolder">
                      <img
                        src={avatar}
                        className="img-responsive avatar"
                        alt="logo"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </ul>
    );
  }
};
