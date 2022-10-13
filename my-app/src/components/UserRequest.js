import React from "react";
import "./ChatList.css";

export default ({ userRequestList, acceptUserReq, rejectUserReq }) => (
  <ul style={{ border: "2px solid red" }}>
    <p>
      <strong>Requests List</strong>
    </p>
    {userRequestList.map((userRequest) => {
      return (
        <div>
          <div className="row show-grid">
            <div className="col-xs-12">
              <div className="chatMessage" key={userRequest.userId}>
                <div className="box">
                  <p>
                    <strong>{userRequest.userName}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => acceptUserReq(userRequest.userId)}
                  >
                    Approve connection
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectUserReq(userRequest.userId)}
                  >
                    Reject connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </ul>
);
