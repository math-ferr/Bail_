const { Register, Permission } = require("../core/utils");
const { setAntiTag } = require("../core/group");
const path = require("path");
const fs = require("fs");

Register({
  cmd: "antitagSW",
  category: "group",
  argv: ["enable/disable"],
  permission: Permission.ADMIN,
  execute: async (ctx) => {
    
    if (!ctx.isGroup)
      return ctx.reply("❌ Hanya bisa digunakan di group.")
    const groupSettings = await ctx.sock.json.read(path.join(__dirname,"../data/groupSettings.json"));
    const action = ctx.args[0]
    if (!["enable", "disable"].includes(action))
      return ctx.reply("Contoh:\n.antitagsw enable\n.antitagsw disable")
    if (!groupSettings[ctx.from])
      groupSettings[ctx.from] = {}
    groupSettings[ctx.from].antiStatusTag = action === "enable"
    await fs.writeFileSync(path.join(__dirname,"../data/groupSettings.json"), JSON.stringify(groupSettings, null, 2))
    ctx.reply(`✅ Anti Status Tag ${action === "enable" ? "AKTIF" : "NONAKTIF"} di group ini.`)
  }
})