import WebSocket from "ws";

// userId → socket
const OPEN_CONNECTIONS_MAP: Map<number, WebSocket> = new Map();

export default OPEN_CONNECTIONS_MAP;
