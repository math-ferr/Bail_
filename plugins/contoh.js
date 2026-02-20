const { Register, Permission } = require("../src/core/command")

Register({
  cmd: "halo",
  category: "plugin",
  permission: Permission.ALL,
  hidden: false,

  execute: async (ctx) => {
    ctx.reply("👋 Halo dari plugin!")
  },
}, "contoh")
