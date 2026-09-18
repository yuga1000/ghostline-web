/* GHOSTLINE — single source of truth for every "give money" link on the site.
 *
 * TO ACTIVATE A CHANNEL: paste its URL into `url` below. Entries with an empty
 * `url` are hidden everywhere, so nothing broken ever ships. Nothing else to change —
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
  channels: [
    {
      id: "patreon",
      code: "S.01",
      name: "PATREON",
      url: "https://www.patreon.com/c/Yuga1000",
      copy: "Monthly tier. Work-in-progress captures, panel build logs, MYSTRA files before they go public.",
      go: "[ SUBSCRIBE ]"
    },
    {
      id: "boosty",
      code: "S.02",
      name: "BOOSTY",
      url: "", // TODO: paste https://boosty.to/<name>
      copy: "Same tiers as Patreon, for cards that Patreon will not take.",
      go: "[ SUBSCRIBE ]"
    },
    {
      id: "kofi",
      code: "S.03",
      name: "KO-FI",
      url: "", // TODO: paste https://ko-fi.com/<name>
      copy: "One-off tip. No subscription, no account needed on your side.",
      go: "[ TIP ONCE ]"
    },
    {
      id: "card",
      code: "S.04",
      name: "CARD CHECKOUT",
      url: "", // TODO: paste the Lemon Squeezy / Gumroad / Stripe payment-link URL
      copy: "Buy a panel with a bank card instead of crypto. Same price, same build queue.",
      go: "[ PAY BY CARD ]"
    },
    {
      id: "usdt",
      code: "S.05",
      name: "USDT DIRECT",
      url: "panels.html#panel-object",
      copy: "TRON (TRC-20) straight to the build fund. Lowest fee, nothing takes a cut.",
      go: "[ SEND USDT ]"
    }
  ]
};
