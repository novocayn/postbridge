var bridgeActions = /* @__PURE__ */ ((bridgeActions2) => {
  bridgeActions2["BRIDGE_HANDSHAKE"] = "SOCKBRIDGE/HANDSHAKE";
  bridgeActions2["BRIDGE_HANDSHAKE_ACK"] = "SOCKBRIDGE/HANDSHAKE_ACK";
  bridgeActions2["BRIDGE_BROADCAST"] = "SOCKBRIDGE/BROADCAST";
  bridgeActions2["BRIDGE_RELAY"] = "SOCKBRIDGE/RELAY";
  bridgeActions2["BRIDGE_DISCONNECT"] = "SOCKBRIDGE/DISCONNECT";
  bridgeActions2["BRIDGE_GET_STATE"] = "SOCKBRIDGE/GET_STATE";
  bridgeActions2["BRIDGE_STATE_RESPONSE"] = "SOCKBRIDGE/STATE_RESPONSE";
  bridgeActions2["BRIDGE_SET_STATE"] = "SOCKBRIDGE/SET_STATE";
  bridgeActions2["BRIDGE_STATE_UPDATE"] = "SOCKBRIDGE/STATE_UPDATE";
  bridgeActions2["BRIDGE_HANDSHAKE_ERROR"] = "SOCKBRIDGE/HANDSHAKE_ERROR";
  bridgeActions2["BRIDGE_GET_TABS"] = "SOCKBRIDGE/GET_TABS";
  bridgeActions2["BRIDGE_TABS_RESPONSE"] = "SOCKBRIDGE/TABS_RESPONSE";
  bridgeActions2["BRIDGE_DIRECT_MESSAGE"] = "SOCKBRIDGE/DIRECT_MESSAGE";
  return bridgeActions2;
})(bridgeActions || {});
const channels = /* @__PURE__ */ new Map();
function getOrCreateChannel(channelName) {
  if (!channels.has(channelName)) {
    channels.set(channelName, {
      tabs: /* @__PURE__ */ new Map(),
      sharedState: {}
    });
    console.log(`[Bridge Worker] Created channel: ${channelName}`);
  }
  return channels.get(channelName);
}
self.onconnect = (event) => {
  const port = event.ports[0];
  port.onmessage = (event2) => {
    const data = event2.data;
    switch (data.action) {
      case bridgeActions.BRIDGE_HANDSHAKE:
        handleHandshake(port, data);
        break;
      case bridgeActions.BRIDGE_BROADCAST:
        handleBroadcast(data);
        break;
      case bridgeActions.BRIDGE_DISCONNECT:
        handleDisconnect(data);
        break;
      case bridgeActions.BRIDGE_GET_STATE:
        const getStateData = data;
        const getStateChannel = getOrCreateChannel(getStateData.channel || "default");
        port.postMessage({
          action: bridgeActions.BRIDGE_STATE_RESPONSE,
          state: { ...getStateChannel.sharedState }
        });
        break;
      case bridgeActions.BRIDGE_SET_STATE:
        const setStateData = data;
        const setStateChannel = getOrCreateChannel(setStateData.channel || "default");
        setStateChannel.sharedState[setStateData.key] = setStateData.value;
        for (const [tabID, connection] of setStateChannel.tabs.entries()) {
          try {
            connection.port.postMessage({
              action: bridgeActions.BRIDGE_STATE_UPDATE,
              key: setStateData.key,
              value: setStateData.value
            });
          } catch (error) {
            console.error(`[Bridge Worker] Failed to broadcast state to ${tabID}:`, error);
          }
        }
        break;
      case bridgeActions.BRIDGE_GET_TABS:
        handleGetTabs(port, data);
        break;
      case bridgeActions.BRIDGE_DIRECT_MESSAGE:
        handleDirectMessage(data);
        break;
    }
  };
  port.start();
};
function handleHandshake(port, payload) {
  const { tabID, methodNames, channel: channelName = "default" } = payload;
  const channel = getOrCreateChannel(channelName);
  if (channel.tabs.has(tabID)) {
    const existingConnection = channel.tabs.get(tabID);
    console.warn(
      `[Bridge Worker] Duplicate tabID "${tabID}" on channel "${channelName}". Disconnecting old connection.`
    );
    try {
      existingConnection.port.postMessage({
        action: bridgeActions.BRIDGE_HANDSHAKE_ERROR,
        error: "This tab ID is already in use by another connection. The old connection has been closed.",
        code: "DUPLICATE_TAB_ID",
        tabID,
        channel: channelName
      });
      existingConnection.port.close();
    } catch (error) {
      console.error(`[Bridge Worker] Failed to close old connection:`, error);
    }
    channel.tabs.delete(tabID);
  }
  channel.tabs.set(tabID, {
    port,
    methods: methodNames,
    channel: channelName
  });
  if (channel.tabs.size === 1 && payload.schema) {
    Object.assign(channel.sharedState, payload.schema);
  }
  const ackPayload = {
    action: bridgeActions.BRIDGE_HANDSHAKE_ACK,
    tabID,
    channel: channelName,
    sharedState: { ...channel.sharedState }
  };
  port.postMessage(ackPayload);
  console.log(`[Bridge Worker] Tab ${tabID} connected to channel "${channelName}" with methods:`, methodNames);
}
function handleBroadcast(payload) {
  const { senderTabID, channel: channelName = "default", methodName, args, result, error } = payload;
  const channel = channels.get(channelName);
  if (!channel) {
    console.error(`[Bridge Worker] Broadcast on non-existent channel: ${channelName}`);
    return;
  }
  const relayPayload = {
    action: bridgeActions.BRIDGE_RELAY,
    senderTabID,
    methodName,
    args,
    senderResult: result,
    senderError: error
  };
  let relayCount = 0;
  for (const [tabID, connection] of channel.tabs.entries()) {
    if (tabID === senderTabID) continue;
    try {
      connection.port.postMessage(relayPayload);
      relayCount++;
    } catch (error2) {
      console.error(`[Bridge Worker] Failed to relay to tab ${tabID}:`, error2);
    }
  }
  console.log(
    `[Bridge Worker] Relayed ${methodName} from ${senderTabID} to ${relayCount} tabs on channel "${channelName}"`
  );
}
function handleGetTabs(port, payload) {
  const { channel: channelName = "default", requestingTabID } = payload;
  const channel = channels.get(channelName);
  const tabIDs = channel ? Array.from(channel.tabs.keys()) : [];
  const responsePayload = {
    action: bridgeActions.BRIDGE_TABS_RESPONSE,
    tabIDs,
    channel: channelName
  };
  port.postMessage(responsePayload);
  console.log(
    `[Bridge Worker] Tab ${requestingTabID} requested tabs on channel "${channelName}": [${tabIDs.join(", ")}]`
  );
}
function handleDirectMessage(payload) {
  const { senderTabID, targetTabID, channel: channelName = "default", methodName, args, result, error } = payload;
  const channel = channels.get(channelName);
  if (!channel) {
    console.warn(`[Bridge Worker] Channel "${channelName}" not found for direct message`);
    return;
  }
  const targetConnection = channel.tabs.get(targetTabID);
  if (!targetConnection) {
    console.warn(
      `[Bridge Worker] Target tab ${targetTabID} not found on channel "${channelName}" for direct message from ${senderTabID}`
    );
    return;
  }
  const relayPayload = {
    action: bridgeActions.BRIDGE_RELAY,
    senderTabID,
    methodName,
    args,
    senderResult: result,
    senderError: error
  };
  try {
    targetConnection.port.postMessage(relayPayload);
    console.log(
      `[Bridge Worker] Relayed direct message "${methodName}" from ${senderTabID} to ${targetTabID} on channel "${channelName}"`
    );
  } catch (err) {
    console.error(`[Bridge Worker] Failed to send direct message to ${targetTabID}:`, err);
  }
}
function handleDisconnect(payload) {
  const { tabID, channel: channelName = "default" } = payload;
  const channel = channels.get(channelName);
  if (channel && channel.tabs.has(tabID)) {
    channel.tabs.delete(tabID);
    console.log(`[Bridge Worker] Tab ${tabID} disconnected from channel "${channelName}"`);
    if (channel.tabs.size === 0) {
      channels.delete(channelName);
      console.log(`[Bridge Worker] Channel "${channelName}" cleaned up (no tabs remaining)`);
    }
  }
}
