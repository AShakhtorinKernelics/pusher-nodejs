import React from "react";
import "./ChatBox.css";
export default ({ text, username, handleNewMsg }) => (
  <div style={{ border: "2px solid black" }}>
    <div className="row">
      <div className="col-xs-12">
        <div className="chat">
          <span>Chat Msg</span>
          <div className="col-xs-5 col-xs-offset-3">
            <input
              type="text"
              value={text}
              placeholder="chat here..."
              className="form-control"
/*               onChange={handleNewMsg}
              onKeyDown={handleNewMsg} */
            />
            <button
                    type="button"
                    onClick={() => handleNewMsg()}
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
