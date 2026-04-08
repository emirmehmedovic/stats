import { existsSync } from 'fs';
import path from 'path';

export function getProjectPythonPath(): string {
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python3');
  return existsSync(venvPython) ? venvPython : 'python3';
}
