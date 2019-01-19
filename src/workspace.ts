import { Observable } from 'rxjs';
import { experimental, dirname, normalize } from '@angular-devkit/core';
import { readFileSync, existsSync } from 'fs';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import * as path from 'path';

function findUp(name: string, from: string) {
  const root = path.parse(from).root;

  let currentDir = from;
  while (currentDir && currentDir !== root) {
    const possiblePath = path.join(currentDir, name);
    if (existsSync(possiblePath)) {
      return possiblePath;
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

export function getWorkspace(): Observable<experimental.workspace.Workspace> {
  const configFilePath = findUp('angular.json', process.cwd());
  if (configFilePath === null) {
    throw new Error(
      `This command requires to be run in an Angular project, but a project definition could not be found.`
    );
  }
  const root = dirname(normalize(configFilePath));
  const configContent = readFileSync(configFilePath, 'utf-8');
  const workspaceJson = JSON.parse(configContent);

  const host = new NodeJsSyncHost();
  const workspace = new experimental.workspace.Workspace(root, host);

  return workspace.loadWorkspaceFromJson(workspaceJson);
}
