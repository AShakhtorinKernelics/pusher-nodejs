import React from "react";
import "./ChatList.css";

export default ({ users, selectUser }) => (
  <ul style={{ border: "2px solid red" }}>
    <p>
      <strong>User List</strong>
    </p>
    {users.map((user) => {
      return (
        <div>
          <div className="row show-grid">
            <div className="col-xs-12">
              <div
                className="chatMessage"
                key={user.userId}
                onClick={() => selectUser(user.userId)}
              >
                <div className="box">
                  <p>
                    <strong>
                      {selectUser === user.userId
                        ? "SELECTED USER: " + user.userName
                        : user.userName}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </ul>
);
