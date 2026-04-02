import type { WebFetchProviderPlugin } from "openclaw/plugin-sdk/provider-web-fetch";
import { enablePluginInConfig } from "openclaw/plugin-sdk/provider-web-fetch";
import { runFirecrawlScrape } from "./firecrawl-client.js";

export function createFirecrawlWebFetchProvider(): WebFetchProviderPlugin {
  return {
    id: "firecrawl",
    label: "Firecrawl",
    hint: "Fetch pages with Firecrawl for JS-heavy or bot-protected sites.",
    envVars: ["FIRECRAWL_API_KEY"],
    placeholder: "fc-...",
    signupUrl: "https://www.firecrawl.dev/",
    docsUrl: "https://docs.firecrawl.dev",
    autoDetectOrder: 50,
    credentialPath: "plugins.entries.firecrawl.config.webFetch.apiKey",
    inactiveSecretPaths: [
      "plugins.entries.firecrawl.config.webFetch.apiKey",
      "tools.web.fetch.firecrawl.apiKey",
    ],
    getCredentialValue: (fetchConfig) =>
      fetchConfig && typeof fetchConfig === "object"
        ? (fetchConfig.firecrawl as { apiKey?: unknown } | undefined)?.apiKey
        : undefined,
    setCredentialValue: (fetchConfigTarget, value) => {
      const existing = fetchConfigTarget.firecrawl;
      const firecrawl =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? (existing as Record<string, unknown>)
          : {};
      firecrawl.apiKey = value;
      fetchConfigTarget.firecrawl = firecrawl;
    },
    getConfiguredCredentialValue: (config) =>
      (
        config?.plugins?.entries?.firecrawl?.config as
          | { webFetch?: { apiKey?: unknown } }
          | undefined
      )?.webFetch?.apiKey,
    setConfiguredCredentialValue: (configTarget, value) => {
      const plugins = (configTarget.plugins ??= {});
      const entries = (plugins.entries ??= {});
      const firecrawlEntry = (entries.firecrawl ??= {});
      const pluginConfig =
        firecrawlEntry.config &&
        typeof firecrawlEntry.config === "object" &&
        !Array.isArray(firecrawlEntry.config)
          ? (firecrawlEntry.config as Record<string, unknown>)
          : ((firecrawlEntry.config = {}), firecrawlEntry.config as Record<string, unknown>);
      const webFetch =
        pluginConfig.webFetch &&
        typeof pluginConfig.webFetch === "object" &&
        !Array.isArray(pluginConfig.webFetch)
          ? (pluginConfig.webFetch as Record<string, unknown>)
          : ((pluginConfig.webFetch = {}), pluginConfig.webFetch as Record<string, unknown>);
      webFetch.apiKey = value;
    },
    applySelectionConfig: (config) => enablePluginInConfig(config, "firecrawl"),
    resolveRuntimeMetadata: ({ runtimeMetadata, resolvedCredential }) => ({
      firecrawl: {
        active:
          runtimeMetadata?.selectedProvider === "firecrawl" && Boolean(resolvedCredential?.value),
        apiKeySource: resolvedCredential?.source ?? "missing",
        diagnostics: runtimeMetadata?.firecrawl?.diagnostics ?? [],
      },
    }),
    createTool: ({ config }) => ({
      description: "Fetch a page using Firecrawl.",
      parameters: {},
      execute: async (args) => {
        const url = typeof args.url === "string" ? args.url : "";
        const extractMode = args.extractMode === "text" ? "text" : "markdown";
        const maxChars =
          typeof args.maxChars === "number" && Number.isFinite(args.maxChars)
            ? Math.floor(args.maxChars)
            : undefined;
        return await runFirecrawlScrape({
          cfg: config,
          url,
          extractMode,
          maxChars,
        });
      },
    }),
  };
}
