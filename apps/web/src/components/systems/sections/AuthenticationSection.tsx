"use client";

import type { ConnectionFieldDef } from "@ambios-ai/shared";
import { findTemplateForSystem, resolveOAuthCertAndKey, systemOptions } from "@ambios-ai/shared";
import { ChevronRight, Eye, EyeOff, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "@/app/config-context";
import { CopyButton } from "@/components/tools/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { FileChip } from "@/components/ui/file-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthConnectButton } from "@/components/ui/oauth-connect-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CredentialsManager } from "@/components/utils/CredentialManager";
import { HelpTooltip } from "@/components/utils/HelpTooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/general-utils";
import { getOAuthCallbackUrl, triggerOAuthFlow } from "@/lib/oauth-utils";
import { tokenRegistry } from "@/lib/token-registry";
import { useSystemConfig } from "../context";

function MultiTenancyModeToggle({
  value,
  onChange,
  variant = "default",
}: {
  value: string;
  onChange: (mode: "disabled" | "enabled") => void;
  variant?: "default" | "nested";
}) {
  const base =
    variant === "nested"
      ? "bg-muted/30 border-border/50 hover:bg-muted/40 hover:border-border/70"
      : "bg-gradient-to-br from-muted/60 to-muted/30 border-border/50 hover:from-muted/70 hover:to-muted/40 hover:border-border/70";
  const padding = variant === "nested" ? "p-3" : "p-4";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange("disabled")}
        className={cn(
          "rounded-xl border text-left transition-colors",
          padding,
          base,
          value === "disabled" && "ring-1 ring-primary/40",
        )}
      >
        <div className="font-medium text-sm">Use system credentials</div>
        <div className="mt-1 text-muted-foreground text-xs">
          One shared connection for all users of this system.
        </div>
      </button>
      <button
        type="button"
        onClick={() => onChange("enabled")}
        className={cn(
          "rounded-xl border text-left transition-colors",
          padding,
          base,
          value === "enabled" && "ring-1 ring-primary/40",
        )}
      >
        <div className="font-medium text-sm">Let users authenticate with their own credentials</div>
        <div className="mt-1 text-muted-foreground text-xs">
          {variant === "nested"
            ? "Each end user connects their own account."
            : "Each end user provides their own credentials."}
        </div>
      </button>
    </div>
  );
}

const DEFAULT_CONNECTION_FIELDS: ConnectionFieldDef[] = [
  { key: "host", label: "Host", placeholder: "hostname or IP", required: true },
  { key: "port", label: "Port", type: "number", placeholder: "port" },
  { key: "username", label: "Username", required: true },
  { key: "password", label: "Password", type: "password", required: true },
];

function ConnectionStringForm({
  fields,
  values,
  onChange,
}: {
  fields: ConnectionFieldDef[];
  values: Record<string, string>;
  onChange: (updated: Record<string, string>) => void;
}) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const handleFieldChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const gridCols = fields.length <= 2 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={cn("grid gap-4", gridCols)}>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={`conn-${field.key}`} className="font-medium text-xs">
            {field.label}
            {field.required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={`conn-${field.key}`}
              type={
                field.type === "password" && !showPasswords[field.key]
                  ? "password"
                  : field.type === "number"
                    ? "number"
                    : "text"
              }
              value={values[field.key] ?? ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder || field.defaultValue || ""}
              className="h-9 border-border/60 bg-background/50 pr-9"
            />
            {field.type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-9 w-9 hover:bg-transparent"
                onClick={() => togglePassword(field.key)}
              >
                {showPasswords[field.key] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuthenticationSection() {
  const config = useConfig();
  const { toast } = useToast();
  const {
    system,
    auth,
    setAuthType,
    setApiKeyCredentials,
    setOAuthFields,
    setConnectionStringCredentials,
    setUseAmbiOSOAuth,
    setMultiTenancyMode,
    saveSystem,
  } = useSystemConfig();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [certFileName, setCertFileName] = useState("");
  const [keyFileName, setKeyFileName] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialCredentialsRef = useRef(auth.apiKeyCredentials);

  const canAutoSave = system.id && system.url;
  const isMultiTenancy = auth.multiTenancyMode === "enabled";

  const debouncedSave = useCallback(() => {
    if (!canAutoSave) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSystem();
    }, 1000);
  }, [canAutoSave, saveSystem]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (auth.apiKeyCredentials !== initialCredentialsRef.current) {
      initialCredentialsRef.current = auth.apiKeyCredentials;
      debouncedSave();
    }
  }, [auth.apiKeyCredentials, debouncedSave]);

  const initialConnStringRef = useRef(auth.connectionStringCredentials);
  useEffect(() => {
    if (auth.connectionStringCredentials !== initialConnStringRef.current) {
      initialConnStringRef.current = auth.connectionStringCredentials;
      debouncedSave();
    }
  }, [auth.connectionStringCredentials, debouncedSave]);

  useEffect(() => {
    if (auth.oauthFields.oauth_cert && auth.oauthFields.oauth_key) {
      const { cert, key } = resolveOAuthCertAndKey(
        auth.oauthFields.oauth_cert,
        auth.oauthFields.oauth_key,
      );
      setCertFileName(cert?.filename || "Certificate loaded");
      setKeyFileName(key?.filename || "Private key loaded");
    }
  }, [auth.oauthFields.oauth_cert, auth.oauthFields.oauth_key]);

  const handleOAuthFileUpload =
    (field: "oauth_cert" | "oauth_key", setFileName: (name: string) => void, displayName: string) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const fileData = JSON.stringify({
          filename: file.name,
          content,
        });
        setOAuthFields({ [field]: fileData });
        setFileName(file.name);
        toast({
          title: `${displayName} uploaded`,
          description: `${file.name} loaded successfully`,
        });
      } catch (error) {
        toast({
          title: `Failed to read ${displayName.toLowerCase()}`,
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };

  const handleRemoveOAuthFile =
    (field: "oauth_cert" | "oauth_key", setFileName: (name: string) => void, inputId: string) =>
    () => {
      setOAuthFields({ [field]: "" });
      setFileName("");
      const fileInput = document.getElementById(inputId) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    };

  const handleCertFileUpload = handleOAuthFileUpload("oauth_cert", setCertFileName, "Certificate");
  const handleKeyFileUpload = handleOAuthFileUpload("oauth_key", setKeyFileName, "Private key");
  const handleRemoveCert = handleRemoveOAuthFile("oauth_cert", setCertFileName, "cert-file-upload");
  const handleRemoveKey = handleRemoveOAuthFile("oauth_key", setKeyFileName, "key-file-upload");

  const getTemplateOAuth = useCallback(() => {
    const match = findTemplateForSystem(system);
    return (match?.template.oauth as any) || null;
  }, [system.id, system.name, system.templateName, system.url, system]);

  const getConnectionFields = useCallback((): ConnectionFieldDef[] => {
    const match = findTemplateForSystem(system);
    if (match?.template.connectionFields) {
      return match.template.connectionFields;
    }
    return DEFAULT_CONNECTION_FIELDS;
  }, [system.id, system.name, system.templateName, system.url, system]);

  const getResolvedOAuthFields = useCallback(() => {
    const templateOAuth = getTemplateOAuth();
    if (auth.useAmbiOSOAuth && templateOAuth) {
      // Prefer stored values over template
      return {
        ...auth.oauthFields,
        client_id: auth.oauthFields.client_id || templateOAuth.client_id,
        auth_url: auth.oauthFields.auth_url || templateOAuth.authUrl,
        token_url: auth.oauthFields.token_url || templateOAuth.tokenUrl,
        scopes: auth.oauthFields.scopes || templateOAuth.scopes,
        grant_type: auth.oauthFields.grant_type || templateOAuth.grant_type,
      };
    }
    return auth.oauthFields;
  }, [auth.oauthFields, auth.useAmbiOSOAuth, getTemplateOAuth]);

  const isConnectDisabled = useCallback(() => {
    if (auth.authType !== "oauth") return true;
    if (auth.useAmbiOSOAuth) {
      const templateOAuth = getTemplateOAuth();
      return !templateOAuth?.client_id;
    }
    const resolvedFields = getResolvedOAuthFields();
    const isClientCreds = resolvedFields.grant_type === "client_credentials";
    if (isClientCreds) {
      const hasClientSecret = !!resolvedFields.client_secret;
      const hasCertAndKey = !!(resolvedFields.oauth_cert && resolvedFields.oauth_key);
      return !(
        resolvedFields.client_id &&
        (hasClientSecret || hasCertAndKey) &&
        resolvedFields.token_url
      );
    }
    return !(
      resolvedFields.client_id &&
      resolvedFields.client_secret &&
      resolvedFields.token_url &&
      resolvedFields.auth_url &&
      resolvedFields.scopes
    );
  }, [auth.authType, auth.useAmbiOSOAuth, getResolvedOAuthFields, getTemplateOAuth]);

  const handleConnect = async () => {
    if (auth.authType !== "oauth") return;
    setConnectLoading(true);
    const resolvedFields = getResolvedOAuthFields();

    const templateInfo = auth.useAmbiOSOAuth
      ? {
          templateId: system.templateName,
          clientId: resolvedFields.client_id,
        }
      : undefined;

    const handleOAuthError = (error: string) => {
      setConnectLoading(false);
      toast({
        title: "OAuth Error",
        description: error,
        variant: "destructive",
      });
    };

    const handleOAuthSuccess = async (tokens: any) => {
      setConnectLoading(false);
      if (tokens) {
        const tokenFields = {
          access_token: tokens.access_token || auth.oauthFields.access_token,
          refresh_token: tokens.refresh_token || auth.oauthFields.refresh_token,
          token_type: tokens.token_type || auth.oauthFields.token_type,
          expires_at: tokens.expires_at || auth.oauthFields.expires_at,
        };
        setOAuthFields(tokenFields);

        toast({
          title: "OAuth Connected",
          description: "Successfully authenticated",
        });

        if (system.id && system.url) {
          await saveSystem(tokenFields);
        }
      }
    };

    triggerOAuthFlow(
      system.id,
      resolvedFields,
      tokenRegistry.getToken(),
      auth.authType,
      handleOAuthError,
      true,
      templateInfo,
      handleOAuthSuccess,
      config.apiEndpoint,
      undefined,
      config.apiEndpoint,
    );
  };

  const templateOAuth = getTemplateOAuth();
  const hasTemplateClient = !!(
    templateOAuth?.client_id && String(templateOAuth.client_id).trim().length > 0
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="authType" className="font-medium text-sm">
            Authentication Type
          </Label>
          <HelpTooltip text="Choose how to authenticate with this API. OAuth is recommended for supported services." />
        </div>
        <Select
          value={auth.authType}
          onValueChange={(value: "apikey" | "oauth" | "none" | "connection_string") =>
            setAuthType(value)
          }
        >
          <SelectTrigger className="h-10 w-full border-border/60 bg-background/50 transition-colors focus:border-primary/50">
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="connection_string">Connection String (Database / SFTP)</SelectItem>
            <SelectItem value="apikey">API Key / Token / Basic Auth</SelectItem>
            <SelectItem value="oauth">OAuth 2.0</SelectItem>
            <SelectItem value="none">No Authentication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Credential mode - only show for non-oauth auth types */}
      {auth.authType !== "none" &&
        auth.authType !== "oauth" &&
        auth.authType !== "connection_string" && (
          <div className="space-y-2 border-border/40 border-t pt-4">
            <div className="flex items-center gap-2">
              <Label className="font-medium text-sm">Credential Mode</Label>
              <HelpTooltip text="Choose whether credentials are system-wide or per end user." />
            </div>
            <MultiTenancyModeToggle value={auth.multiTenancyMode} onChange={setMultiTenancyMode} />
          </div>
        )}

      {auth.authType === "connection_string" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="font-medium text-sm">Connection Details</Label>
            <HelpTooltip text="Enter the connection parameters for this system. These will be used to construct the connection string." />
          </div>
          <div className="rounded-xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 p-5">
            <ConnectionStringForm
              fields={getConnectionFields()}
              values={auth.connectionStringCredentials}
              onChange={setConnectionStringCredentials}
            />
          </div>
          {system.url && (
            <div className="rounded-xl border border-border/40 bg-gradient-to-r from-muted/50 to-muted/30 p-3">
              <p className="text-muted-foreground text-xs">
                <span className="font-medium">Connection template:</span>{" "}
                <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px]">
                  {system.url}
                </code>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Fields above will be substituted into the{" "}
                <code className="font-mono">{"<<placeholder>>"}</code> values at runtime.
              </p>
            </div>
          )}
        </div>
      )}

      {auth.authType === "apikey" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="credentials" className="font-medium text-sm">
              API Credentials
            </Label>
            <HelpTooltip
              text={
                isMultiTenancy
                  ? "Define credential names that end users will provide in the portal (e.g., api_key, bearer_token, api_secret)."
                  : "Add API keys or tokens needed for this system. Common keys include: api_key, bearer_token, api_secret."
              }
            />
          </div>
          {isMultiTenancy ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4">
                <p className="text-muted-foreground text-sm">
                  Define the credential field names below. End users can then enter their own
                  credentials.
                </p>
              </div>
              <div>
                <CredentialsManager
                  value={auth.apiKeyCredentials}
                  onChange={setApiKeyCredentials}
                  className="min-h-20"
                  placeholder="Field name (e.g., api_key)"
                  templateMode={true}
                />
                <p className="mt-2 text-muted-foreground text-xs">
                  Add field names only. End users will enter their own values in the portal.
                </p>
              </div>
            </div>
          ) : (
            <CredentialsManager
              value={auth.apiKeyCredentials}
              onChange={setApiKeyCredentials}
              className="min-h-20"
            />
          )}
        </div>
      )}

      {auth.authType === "oauth" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3">
            <OAuthConnectButton
              system={system}
              onClick={handleConnect}
              disabled={isConnectDisabled()}
              loading={connectLoading}
              className="w-full"
            />
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/60 to-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Label className="font-medium text-sm">Connection Settings</Label>
                <HelpTooltip text="Configure how users authenticate and which OAuth provider to use." />
              </div>
              <div className="mt-3">
                <MultiTenancyModeToggle
                  value={auth.multiTenancyMode}
                  onChange={setMultiTenancyMode}
                  variant="nested"
                />
              </div>
              {isMultiTenancy ? (
                <div className="mt-2 text-muted-foreground text-xs">
                  Template mode: each end user will authenticate using these settings.
                </div>
              ) : null}
              {hasTemplateClient && (
                <div className="mt-4 border-border/40 border-t pt-4">
                  <div className="font-medium text-sm">OAuth Provider</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setUseAmbiOSOAuth(true)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        "border-border/50 bg-muted/30",
                        "hover:border-border/70 hover:bg-muted/40",
                        auth.useAmbiOSOAuth && "ring-1 ring-primary/40",
                      )}
                    >
                      <div className="font-medium text-sm">Use ambios preconfigured OAuth</div>
                      <div className="mt-1 text-muted-foreground text-xs">
                        Preconfigured client for{" "}
                        {systemOptions.find((o) => o.value === system.templateName)?.label}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseAmbiOSOAuth(false)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        "border-border/50 bg-muted/30",
                        "hover:border-border/70 hover:bg-muted/40",
                        !auth.useAmbiOSOAuth && "ring-1 ring-primary/40",
                      )}
                    >
                      <div className="font-medium text-sm">Use your own OAuth app</div>
                      <div className="mt-1 text-muted-foreground text-xs">
                        Provide client ID, secret, and endpoints below.
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!auth.useAmbiOSOAuth && auth.oauthFields.grant_type === "authorization_code" && (
            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/60 to-muted/30 p-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-xs">Redirect URI</Label>
                <span className="rounded-full border border-border/40 bg-muted/60 px-2.5 py-1 text-[10px] text-muted-foreground">
                  Register with OAuth provider
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg border border-border/40 bg-muted/60 px-3 py-2 font-mono text-xs">
                  {getOAuthCallbackUrl()}
                </code>
                <CopyButton text={getOAuthCallbackUrl()} />
              </div>
            </div>
          )}

          {!auth.useAmbiOSOAuth && (
            <div className="space-y-4 rounded-xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="client_id" className="font-medium text-xs">
                    Client ID
                  </Label>
                  <Input
                    id="client_id"
                    value={auth.oauthFields.client_id}
                    onChange={(e) => setOAuthFields({ client_id: e.target.value })}
                    placeholder="Your OAuth app client ID"
                    className="h-9 border-border/60 bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client_secret" className="font-medium text-xs">
                    Client Secret
                  </Label>
                  <div className="relative">
                    <Input
                      id="client_secret"
                      type={showClientSecret ? "text" : "password"}
                      value={auth.oauthFields.client_secret}
                      onChange={(e) => setOAuthFields({ client_secret: e.target.value })}
                      placeholder="Your OAuth app client secret"
                      className="h-9 border-border/60 bg-background/50 pr-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-9 w-9 hover:bg-transparent"
                      onClick={() => setShowClientSecret(!showClientSecret)}
                    >
                      {showClientSecret ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="grant_type" className="font-medium text-xs">
                    Grant Type
                  </Label>
                  <Select
                    value={auth.oauthFields.grant_type}
                    onValueChange={(value: "authorization_code" | "client_credentials") =>
                      setOAuthFields({ grant_type: value })
                    }
                  >
                    <SelectTrigger className="h-9 border-border/60 bg-background/50">
                      <SelectValue placeholder="Select grant type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="authorization_code">Authorization Code</SelectItem>
                      <SelectItem value="client_credentials">Client Credentials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scopes" className="font-medium text-xs">
                    Scopes
                  </Label>
                  <Input
                    id="scopes"
                    value={auth.oauthFields.scopes}
                    onChange={(e) => setOAuthFields({ scopes: e.target.value })}
                    placeholder="e.g., read write"
                    className="h-9 border-border/60 bg-background/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="auth_url" className="font-medium text-xs">
                    Authorization URL
                  </Label>
                  <Input
                    id="auth_url"
                    value={auth.oauthFields.auth_url}
                    onChange={(e) => setOAuthFields({ auth_url: e.target.value })}
                    placeholder="OAuth authorization endpoint"
                    className="h-9 border-border/60 bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="token_url" className="font-medium text-xs">
                    Token URL
                  </Label>
                  <Input
                    id="token_url"
                    value={auth.oauthFields.token_url}
                    onChange={(e) => setOAuthFields({ token_url: e.target.value })}
                    placeholder="OAuth token endpoint"
                    className="h-9 border-border/60 bg-background/50"
                  />
                </div>
              </div>

              {auth.oauthFields.grant_type === "client_credentials" && (
                <div className="flex justify-evenly border-border/30 border-t pt-3">
                  <div className="flex flex-col items-center">
                    <Label className="mb-2 font-medium text-xs">Client Certificate</Label>
                    {auth.oauthFields.oauth_cert ? (
                      <FileChip
                        file={{
                          name: certFileName || "Certificate",
                          key: "oauth_cert",
                          size: 0,
                          status: "ready",
                        }}
                        onRemove={handleRemoveCert}
                        size="large"
                        rounded="sm"
                        showOriginalName={true}
                        showSize={false}
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("cert-file-upload")?.click()}
                        className="bg-background/50"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    )}
                    <input
                      type="file"
                      id="cert-file-upload"
                      hidden
                      accept=".crt,.pem,.cer"
                      onChange={handleCertFileUpload}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <Label className="mb-2 font-medium text-xs">Private Key</Label>
                    {auth.oauthFields.oauth_key ? (
                      <FileChip
                        file={{
                          name: keyFileName || "Private Key",
                          key: "oauth_key",
                          size: 0,
                          status: "ready",
                        }}
                        onRemove={handleRemoveKey}
                        size="large"
                        rounded="sm"
                        showOriginalName={true}
                        showSize={false}
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("key-file-upload")?.click()}
                        className="bg-background/50"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    )}
                    <input
                      type="file"
                      id="key-file-upload"
                      hidden
                      accept=".key,.pem"
                      onChange={handleKeyFileUpload}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isMultiTenancy && (
            <>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-90")}
                />
                Additional API Credentials
              </button>

              {showAdvanced && (
                <div className="rounded-xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 p-4">
                  <p className="mb-3 text-muted-foreground text-xs">
                    Some APIs require additional credentials alongside OAuth (e.g., developer_token,
                    account_id).
                  </p>
                  <CredentialsManager
                    value={auth.apiKeyCredentials}
                    onChange={setApiKeyCredentials}
                    className="min-h-16"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {auth.authType === "none" && (
        <div className="rounded-xl border border-border/40 bg-gradient-to-r from-muted/50 to-muted/30 p-4">
          <p className="text-muted-foreground text-sm">
            The API endpoint should be publicly accessible or credentials should be provided at
            request time.
          </p>
        </div>
      )}
    </div>
  );
}
