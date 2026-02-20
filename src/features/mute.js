const { Register, Permission } = require("../core/utils")
const { mute } = require("../core/group")

Register({
  cmd: "mute",
  category: "group",
  permission: Permission.ADMIN,
  hidden: false,

  execute: async (ctx) => {
    if (!ctx.isGroup) {
      return ctx.reply("❌ Command ini hanya untuk group")
    }

    const meta = await ctx.sock.groupMetadata(ctx.from)
    const admins = meta.participants
      .filter(p => p.admin)
      .map(p => p.id)
    if (!admins.includes(ctx.sender)) {
      return ctx.reply("❌ Admin group only")
    }
    mute(ctx.from)
    ctx.reply("🔇 Bot dimute di group ini")
  },
})