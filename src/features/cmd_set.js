const { Register, Permission } = require("../core/utils")

Register({
  cmd: "cmd",
  category: "bot",
  argv: ["private/group", "enable/disable"],
  permission: Permission.OWNER,
  execute: async (ctx) => {
    const [type, action] = ctx.args

    if (!type || !action)
      return ctx.reply("Contoh:\n.cmd private disable\n.cmd group enable")

    const { Settings } = require("../core/utils")

    if (!["private", "group"].includes(type))
      return ctx.reply("Type harus: private / group")

    if (!["enable", "disable"].includes(action))
      return ctx.reply("Opsi harus: enable / disable")

    const value = action === "enable"

    Settings[type] = value

    ctx.reply(
      `Mode *${type}* sekarang ${value ? "AKTIF" : "NONAKTIF"}`
    )
  }
})