import React from "react";
import "./ChatList.css";

export default ({ connections, selectConnection }) => (
  <ul style={{ border: "2px solid red" }}>
    <p>
      <strong>Connection List</strong>
    </p>
    {connections.map((connection) => {
      return (
        <div>
          <div className="row show-grid">
            <div className="col-xs-12">
              <div
                className="chatMessage"
                key={connection.id}
                onClick={() => selectConnection(connection.id)}
              >
                <div className="box">
                  <p>
                    <strong>{connection.name}</strong>
                  </p>
                  <p>{connection.type}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </ul>
);
