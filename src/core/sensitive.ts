const SECRET_EXTENSIONS = new Set([".pem", ".key", ".p12"]);

export function isSensitive(filePath: string): boolean {
  const name = filePath.split(/[/\\]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  return name === ".env" || name.startsWith(".env.") || name.startsWith("id_rsa") || SECRET_EXTENSIONS.has(ext);
}
