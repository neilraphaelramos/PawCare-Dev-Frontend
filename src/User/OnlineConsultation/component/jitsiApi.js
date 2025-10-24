import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

const JitsiWrapper = ({ roomName, displayName, email, jwt, onApiReady }) => {
  return (
    <div style={{ height: "600px", width: "100%" }}>
      <JitsiMeeting
        domain="8x8.vc" 
        roomName={roomName}
        jwt={jwt} 
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: false,
        }}
        interfaceConfigOverwrite={{
          TOOLBAR_BUTTONS: ["microphone", "camera", "chat", "raisehand", "hangup"],
        }}
        userInfo={{
          displayName: displayName,
          email: email,
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "80vh";
          iframeRef.style.width = "100%";
        }}
        onApiReady={(externalApi) => {
          if (onApiReady) {
            onApiReady(externalApi);
          }
        }}
      />
    </div>
  );
};

export default JitsiWrapper;
