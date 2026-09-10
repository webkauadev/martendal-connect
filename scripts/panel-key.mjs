#!/usr/bin/env node

import { createPrivateKey, randomBytes, sign } from "node:crypto";
import { lstatSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

process.umask(0o077);

const TOKEN_VERSION = "mk1";
const AUDIENCE = "martendal-leads-panel";
const TTL_SECONDS = 5 * 60;

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

function modeOf(path) {
  return statSync(path).mode & 0o777;
}

if (process.argv.length !== 2) {
  fail(
    [
      "Este comando não aceita argumentos.",
      "",
      "A chave de acesso é gerada pelo próprio programa.",
      "Nunca passe segredos pela linha de comando.",
    ].join("\n"),
  );
}

let fileStat;

try {
  fileStat = lstatSync(PRIVATE_KEY_PATH);
} catch {
  fail(
    [
      "Chave privada do emissor não encontrada.",
      "",
      "Inicialize primeiro com:",
      "",
      "npm run panel:key:init",
    ].join("\n"),
  );
}

if (fileStat.isSymbolicLink()) {
  fail("A chave privada não pode ser um link simbólico.");
}

if (!fileStat.isFile()) {
  fail("O caminho da chave privada não aponta para um arquivo regular.");
}

const keyDir = dirname(PRIVATE_KEY_PATH);

if (modeOf(keyDir) !== 0o700) {
  fail(
    [
      `Permissões inseguras no diretório: ${keyDir}`,
      `Encontrado: ${modeOf(keyDir).toString(8)}`,
      "Esperado: 700",
    ].join("\n"),
  );
}

if (modeOf(PRIVATE_KEY_PATH) !== 0o600) {
  fail(
    [
      `Permissões inseguras na chave privada: ${PRIVATE_KEY_PATH}`,
      `Encontrado: ${modeOf(PRIVATE_KEY_PATH).toString(8)}`,
      "Esperado: 600",
    ].join("\n"),
  );
}

let privateKey;

try {
  privateKey = createPrivateKey(readFileSync(PRIVATE_KEY_PATH, "utf8"));
} catch {
  fail("Não foi possível carregar a chave privada.");
}

if (privateKey.asymmetricKeyType !== "ed25519") {
  fail("A chave encontrada não é Ed25519.");
}

const now = Math.floor(Date.now() / 1000);

const payload = {
  v: 1,
  jti: randomBytes(32).toString("base64url"),
  iat: now,
  exp: now + TTL_SECONDS,
  aud: AUDIENCE,
};

const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const signingInput = `${TOKEN_VERSION}.${encodedPayload}`;

const signature = sign(null, Buffer.from(signingInput, "ascii"), privateKey).toString("base64url");

const token = `${signingInput}.${signature}`;

const expiresAt = new Date(payload.exp * 1000).toLocaleString("pt-BR");

console.log(`
╭────────────────────────────────────────────────────────────╮
│             MARTENDAL · CHAVE DE ACESSO                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✓ Assinatura Ed25519                                      │
│  ✓ Validade: 5 minutos                                     │
│  ✓ Uso permitido: 1 autenticação                           │
│  ✓ Nenhuma comunicação de rede realizada                   │
│                                                            │
╰────────────────────────────────────────────────────────────╯

Expira em:
${expiresAt}

CHAVE:

${token}

Esta chave será aceita apenas uma vez.
Depois do primeiro login bem-sucedido ela deverá ser inutilizável.

Ela não foi salva em arquivo nem copiada para o clipboard.
O texto acima pode permanecer no histórico visual deste terminal.
Limpe o terminal após utilizá-la se desejar reduzir essa exposição.
`);
