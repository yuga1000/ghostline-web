/* GHOSTLINE - single source of truth for every "give money" link on the site.
 *
 * TO ACTIVATE A CHANNEL: paste its URL into `url` below. Entries with an empty
 * `url` are hidden everywhere, so nothing broken ever ships. Nothing else to change:
 * panels.html, support.html and lab/ all read this file.
 */
window.GHOSTLINE_SUPPORT = {
  wallet: {
    network: "TRON (TRC-20)",
    asset: "USDT",
    address: "TTUboZ6F42TKZYWDiuKzMuchVsd2R3rAsU",
    qr: "assets/led-panels/usdt-trc20.svg"
  },
  email: "ghostlinesystem@gmail.com",

  /* Front-page partner slots. Fill `name` + `url` (and `logo` if you have one)
   * and the slot turns into a live link on index.html and reads TAKEN on
   * support.html. Leave them empty and both pages show the slot as OPEN. */
  partners: {
    slots: [
      { id: "SLOT_01", placement: "Logo and link on the front page", name: "", url: "", logo: "" },
      { id: "SLOT_02", placement: "Logo and link on the front page", name: "", url: "", logo: "" },
      { id: "SLOT_03", placement: "Logo and link on the front page", name: "", url: "", logo: "" }
    ]
  },

  channels: [
    {
      id: "patreon",
      code: "S.01",
      name: "PATREON.SUB",
      type: "MONTHLY",
      url: "https://www.patreon.com/cw/Yuga1000",
      copy: "Build logs, captures, files before they go public.",
      go: "[ SUBSCRIBE ]"
    },
    {
      id: "boosty",
      code: "S.02",
      name: "BOOSTY.SUB",
      type: "MONTHLY",
      url: "", // TODO: paste https://boosty.to/<name>
      copy: "Same tiers, for cards Patreon will not take.",
      go: "[ SUBSCRIBE ]"
    },
    {
      id: "kofi",
      code: "S.03",
      name: "KOFI.TIP",
      type: "ONE OFF",
      url: "", // TODO: paste https://ko-fi.com/<name>
      copy: "One off tip. No account needed.",
      go: "[ TIP ONCE ]"
    },
    {
      id: "card",
      code: "S.04",
      name: "CARD.PAY",
      type: "CHECKOUT",
      url: "", // TODO: paste the Lemon Squeezy / Gumroad / Stripe payment-link URL
      copy: "Buy a panel with a bank card. Same price, same queue.",
      go: "[ PAY BY CARD ]"
    },
    {
      id: "usdt",
      code: "S.05",
      name: "USDT.TRC20",
      type: "DIRECT",
      url: "panels.html#panel-object",
      copy: "Straight to the build fund. Nothing takes a cut.",
      go: "[ SEND USDT ]"
    }
  ]
};
