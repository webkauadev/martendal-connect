#!/usr/bin/env node

import { createHash, createPublicKey, generateKeyPairSync } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

process.umask(0o077);

const PRIVATE_KEY_PATH = join(
  homedir(),
  ".config",
  "martendal",
  "panel-issuer",
  "issuer-private.pem",
);

function fail(message) {
  console.error(`\nERRO: ${message}\n`);
  process.exit(1);
}

if (process.argv.length !== 2) {
  fail("Este comando não aceita argumentos.");
}

const keyDir = dirname(PRIVATE_KEY_PATH);

mkdirSync(keyDir, {
  recursive: true,
  mode: 0o700,
});

chmodSync(keyDir, 0o700);

if (existsSync(PRIVATE_KEY_PATH)) {
  const stat = lstatSync(PRIVATE_KEY_PATH);

  if (stat.isSymbolicLink()) {
    fail(`O caminho da chave privada é um link simbólico:\n${PRIVATE_KEY_PATH}`);
  }

  fail(
    [
      "Uma chave privada já existe.",
      "Ela NÃO será sobrescrita automaticamente.",
      "",
      `Local: ${PRIVATE_KEY_PATH}`,
      "",
      "Para rotação, faça isso explicitamente em um procedimento separado.",
    ].join("\n"),
  );
}

const { privateKey } = generateKeyPairSync("ed25519");

const privatePem = privateKey.export({
  format: "pem",
  type: "pkcs8",
});

writeFileSync(PRIVATE_KEY_PATH, privatePem, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx",
});

chmodSync(PRIVATE_KEY_PATH, 0o600);

const publicKey = createPublicKey(privateKey);

const publicDer = publicKey.export({
  format: "der",
  type: "spki",
});

const publicKeyBase64Url = Buffer.from(publicDer).toString("base64url");

const fingerprint = createHash("sha256").update(publicDer).digest("hex");

console.log(`
╭────────────────────────────────────────────────────────────╮
│           MARTENDAL · EMISSOR ADMINISTRATIVO              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✓ Par Ed25519 criado                                      │
│  ✓ Chave privada armazenada somente neste computador       │
│  ✓ Diretório: 0700                                         │
│  ✓ Chave privada: 0600                                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

Chave privada:
${PRIVATE_KEY_PATH}

Fingerprint SHA-256:
${fingerprint}

CHAVE PÚBLICA PARA O SERVIDOR:

PANEL_ISSUER_PUBLIC_KEY=${publicKeyBase64Url}

A chave acima é PÚBLICA.
Ela pode ser usada pelo servidor para verificar assinaturas,
mas NÃO permite gerar novas chaves de acesso.

A chave privada nunca deve sair deste computador.
`);
