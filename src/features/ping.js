const { Register, Permission } = require("../core/utils")

Register({
  cmd: "ping",
  category: "general",
  permission: Permission.ALL,
  hidden: true,

  execute: async (ctx) => {
    ctx.reply("🏓 Pong!")
  },
})
