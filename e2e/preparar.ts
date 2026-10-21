// Recria os dados de teste antes e depois dos testes de ponta a ponta.
import { execSync } from "node:child_process";

export default function preparar() {
  execSync("npm run banco:resetar", { stdio: "ignore" });
}
