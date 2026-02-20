const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys")
const useCode = process.argv.includes("--usecode");
const Pino = require("pino")
const NodeCache = require("node-cache")
const { Boom } = require("@hapi/boom")
const { bindSocketHelper } = require("./socket")

async function connectToWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState("./Sessions/");
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    printQRInTerminal: !useCode,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" })),
    },
    markOnlineOnConnect: false,
    logger: Pino({ level: "fatal" }),
    msgRetryCounterCache: new NodeCache(),
    printQRInTerminal: true,
    generateHighQualityLinkPreview: true,
    browser: ["Linux", "Chrome", "20.0.04"],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  })
  const fileHome = "/data/data/com.termux/files/home"
  bindSocketHelper(sock)
  if (useCode && !sock.user && !sock.authState.creds.registered) await sock.useCode("08");
  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("WhatsApp Connected\n")
      if (sock.user.id) {
        console.log("Connection to Whatsapp Number: " + sock.user.id.split(":")[0]);
        console.log(`Bot started!\n\njangan lupa support ya :)\nhttps://saweria.co/starrynasa`);
      }
    } else if (connection === "close") {
      const r = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (r !== null && r !== undefined) {
        const d = DisconnectReason;
        switch (r) {
          case d.badSession:
          case d.connectionClosed:
          case d.connectionLost:
          case d.restartRequired:
          case d.timedOut:
            console.log(d[r]);
            await connectToWhatsapp();
            break;
          case d.loggedOut:
            const folderPath = `./Sessions/`;
            await sock.deleteFolder(folderPath);
            await connectToWhatsapp();
            break;
          case d.connectionReplaced:
            console.log("Double Connection");
            break;
          case d.multideviceMismatch:
            console.log("Not Suitable");
            break;
          default:
            console.log("Unknown Disconnection Reason");
            await connectToWhatsapp();
        }
      } else if (r === Types_1.DisconnectReason.connectionClosed) {
        console.log("Connection Closed. Reconnecting...");
        setTimeout(connectToWhatsApp(), 2000);
      } else {
        console.log("Error: Disconnection Reason is null or undefined");
      }
    }
  })
  require("./loadFeatures").loadFeatures()
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const handler = require("../handlers/message.js")
    sock.fh = fileHome;
    handler(sock, messages[0])
  })
}

module.exports = { connectToWhatsapp }

process.on('unhandledRejection', (reason, promise) => {
    if (reason.message?.includes('Timed Out')) return;
    console.log('Unhandled Rejection at:', promise);
});

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("already-exists")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Failure")) return;
    if (e.includes("Connection reset by peer")) return;
    if (e.includes("Connection Closed")) return
    if (e.includes("Timed Out")) return
    if (e.includes("Value not found")) return
    console.log('Caught exception: ', err)
    return
});
