const { Register, Permission, getUniqueCommands } = require("../core/utils")

Register({
  cmd: "menu",
  aliases: ["help"],
  category: "general",
  permission: Permission.ALL,
  hidden: false,

  execute: async (ctx) => {
    const commands = getUniqueCommands()
      .filter(cmd => !cmd.hidden)

    const grouped = {}
    for (const cmd of commands) {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = []
      }
      grouped[cmd.category].push(cmd)
    }
    const device = ctx.getDevice(ctx.msg.key.id)
    const e = device === "android" || "ios" ? "📱" : "💻"
    let text = `📜 *LIST MENU*\n`
    text += `👤 User : @${ctx.sender.split("@")[0]}\n`
    text += `${e} Device : ${device}\n`
    text += `📦 Total Command : ${commands.length}\n\n`

    for (const category of Object.keys(grouped).sort()) {
      text += `━━━ *${category.toUpperCase()}* ━━━\n`

      for (const cmd of grouped[category]) {
        text += `• .${cmd.cmd}`

        if (cmd.aliases.length) {
          text += ` (${cmd.aliases.join(", ")})`
        }
        if (cmd.argv.length) {
          text += ` [${cmd.argv.join(", ")}]`
        }

        text += "\n"
      }
      text += "\n"
    }

    ctx.reply(text.trim(), "", {
      mentions: [ctx.sender],
    })
  },
})
