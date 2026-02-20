const { Register, Permission } = require("../core/utils")

Register({
  cmd: "try",
  category: "general",
  permission: Permission.OWNER,
  hidden: true,

  execute: async (ctx) => {
    try {
          const result = await eval(`(async () => {${ctx.q}})()`);
          result;
      } catch (e) {
        console.log(e);
        ctx.reply("Error code: \n" + e);
      }
  }
})
