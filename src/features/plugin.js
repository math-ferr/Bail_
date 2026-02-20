const { Register, Permission } = require("../core/utils")
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process")
const {
  loadPlugin,
  unloadPlugin,
  reloadPlugin,
  listPlugin,
} = require("../core/plugin")

Register({
  cmd: "plugir",
  category: "bot",
  permission: Permission.OWNER,
  hidden: true,

  execute: async (ctx) => {
    const [action, name] = ctx.args

    try {
      switch (action) {
        case "load":
          loadPlugin(name)
          ctx.reply(`✅ Plugin *${name}* di-load`)
          break

        case "unload":
          unloadPlugin(name)
          ctx.reply(`🗑️ Plugin *${name}* di-unload`)
          break

        case "reload":
          reloadPlugin(name)
          ctx.reply(`♻️ Plugin *${name}* di-reload`)
          break

        case "list":
          ctx.reply(
            `📦 Plugin aktif:\n` +
            listPlugin().map(p => `• ${p}`).join("\n")
          )
          break

        default:
          ctx.reply(
            `📌 *PLUGIN MANAGER*\n` +
            `.plugin load <nama>\n` +
            `.plugin unload <nama>\n` +
            `.plugin reload <nama>\n` +
            `.plugin list`
          )
      }
    } catch (e) {
      ctx.reply("❌ " + e.message)
    }
  },
})

Register({
  cmd: "plugin",
  category: "bot",
  permission: Permission.OWNER,
  hidden: false,

  execute: async (m, sock, msg) => {
    if (!m.q) return m.reply("Input code");

    const parts = m.q.split("```");
    if (parts.length < 2) return m.reply("Format salah!");
    let fileName = parts[0].trim().replace(/[\\\/:*?"<>|]/g, "");
    if (!fileName.endsWith(".js")) fileName += ".js";
    const fileCode = parts[1].trim();
    const targetDir = __dirname;

    const fullPath = path.join(targetDir, fileName);
    try {
      fs.writeFileSync(fullPath, fileCode);
      return m.reply(`File ${fileName} berhasil disimpan di:\n${fullPath}`);
      exec("bash restart.sh");
      process.exit(0);
    } catch (err) {
      return m.reply("Gagal simpan file: " + err.message);
    }
  }
});

