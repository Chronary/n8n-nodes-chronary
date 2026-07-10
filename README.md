# n8n-nodes-chronary

An [n8n](https://n8n.io) community node for [Chronary](https://chronary.ai) — **agent-native calendar infrastructure**. Give a workflow (or an AI agent behind it) its own calendar: manage calendars and events, and check availability, through the Chronary API.

[n8n](https://n8n.io) is a fair-code workflow automation platform.

## Installation

Follow the [community-node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/): in n8n, go to **Settings → Community Nodes → Install**, and enter:

```
@chronary/n8n-nodes-chronary
```

## Credentials

You need a Chronary API key — an org key (`chr_sk_…`) or an agent-scoped key (`chr_ak_…`). Create one in the [Chronary console](https://console.chronary.ai). Add it as a **Chronary API** credential in n8n; it's sent as a Bearer token (no OAuth).

## Operations

**Agent**
- Create, Get, Get Many

**Calendar**
- Create, Get, Get Many, Update, Delete

**Event**
- Create, Get, Get Many, Update, Cancel

**Availability**
- Get (an agent's free/busy slots over a time window)

## Resources

- [Chronary docs](https://docs.chronary.ai)
- [API reference](https://docs.chronary.ai/api-reference/overview)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

## License

[Apache-2.0](LICENSE)
