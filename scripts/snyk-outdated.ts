#!/usr/bin/env ts-node

import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import process from 'node:process';

interface OutdatedEntry {
  current: string;
  wanted: string | null;
  latest: string;
  type?: string;
  location?: string;
}

interface OutdatedDependency {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type?: string;
  location?: string;
}

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface RunCommandOptions extends SpawnOptionsWithoutStdio {
  allowedExitCodes?: number[];
}

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface SnykSummary {
  dependency: string;
  version: string;
  exitCode: number;
  severityCounts: Record<Severity, number>;
  issuesFound: number;
  summary?: string;
  errorMessage?: string;
}

const severityLevels: Severity[] = ['critical', 'high', 'medium', 'low'];

async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<CommandResult> {
  const { allowedExitCodes = [0], ...spawnOptions } = options;
  const spawnConfig: SpawnOptionsWithoutStdio = {
    ...spawnOptions,
    stdio: spawnOptions.stdio ?? 'pipe',
  };

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, spawnConfig);
    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
      });
    }

    if (child.stderr) {
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => {
        stderr += chunk;
      });
    }

    child.on('error', error => {
      reject(error);
    });

    child.on('close', code => {
      const exitCode = code ?? 0;
      if (!allowedExitCodes.includes(exitCode)) {
        const error = new Error(`Command failed: ${command} ${args.join(' ')}`) as NodeJS.ErrnoException & CommandResult;
        error.exitCode = exitCode;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }

      resolve({ stdout, stderr, exitCode });
    });
  });
}

async function runStreamingCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<number> {
  const { allowedExitCodes = [0], ...spawnOptions } = options;
  const spawnConfig: SpawnOptionsWithoutStdio = {
    ...spawnOptions,
    stdio: 'inherit',
  };

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, spawnConfig);

    child.on('error', error => {
      reject(error);
    });

    child.on('close', code => {
      const exitCode = code ?? 0;
      if (!allowedExitCodes.includes(exitCode)) {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
        return;
      }

      resolve(exitCode);
    });
  });
}

function parseOutdatedOutput(jsonOutput: string): OutdatedDependency[] {
  const trimmed = jsonOutput.trim();

  if (!trimmed) {
    return [];
  }

  let parsed: Record<string, OutdatedEntry>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, OutdatedEntry>;
  } catch (error) {
    console.error('Unable to parse npm outdated JSON output.');
    throw error;
  }

  return Object.entries(parsed)
    .map(([name, info]) => ({
      name,
      current: info.current,
      wanted: info.wanted ?? info.current,
      latest: info.latest,
      type: info.type,
      location: info.location,
    }))
    .filter(entry => entry.wanted !== entry.current && isSemverLike(entry.wanted));
}

function isSemverLike(version: string | null): version is string {
  if (!version) {
    return false;
  }

  // Accept standard semver (with optional pre-release/build metadata) and caret/tilde ranges.
  return /^(<|<=|>|>=|~|\^)?\d+\.\d+\.\d+(?:[-+].+)?$/.test(version);
}

function emptySeverityCounts(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0 };
}

function extractSeverityCounts(payload: unknown): {
  severityCounts: Record<Severity, number>;
  issuesFound: number;
  summary?: string;
} {
  const severityCounts = emptySeverityCounts();
  let issuesFound = 0;
  let summary: string | undefined;

  if (!payload || typeof payload !== 'object') {
    return { severityCounts, issuesFound, summary };
  }

  const recordPayload = payload as Record<string, unknown>;

  if (typeof recordPayload.summary === 'string') {
    summary = recordPayload.summary;
  }

  const issues = recordPayload.issues as { vulnerabilities?: Array<Record<string, unknown>> } | undefined;
  const vulnerabilitiesArray = Array.isArray(recordPayload.vulnerabilities)
    ? (recordPayload.vulnerabilities as Array<Record<string, unknown>>)
    : issues?.vulnerabilities ?? [];

  vulnerabilitiesArray.forEach(item => {
    const severity = (item.issueSeverity || item.severity) as string | undefined;
    if (severityLevels.includes(severity as Severity)) {
      const matchedSeverity = severity as Severity;
      severityCounts[matchedSeverity] += 1;
      issuesFound += 1;
    }
  });

  if (typeof recordPayload.ok === 'boolean' && recordPayload.ok) {
    summary = summary ?? 'No known vulnerabilities detected by Snyk.';
  }

  return { severityCounts, issuesFound, summary };
}

function parseSnykJson(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return {};
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    // Some versions of the CLI may emit multiple JSON objects; attempt to parse the last one.
    const lastObject = trimmed.lastIndexOf('{');
    if (lastObject > 0) {
      const candidate = trimmed.slice(lastObject);
      try {
        return JSON.parse(candidate);
      } catch (nestedError) {
        console.warn('Failed to parse Snyk JSON output.', nestedError);
      }
    }
    console.warn('Unable to parse Snyk output as JSON. Raw output will be included in the summary.');
    return { raw: trimmed };
  }
}

async function runSnykTest(name: string, version: string): Promise<SnykSummary> {
  const target = `npm:${name}@${version}`;
  const args = ['test', target, '--json'];

  let result: CommandResult;
  try {
    result = await runCommand('snyk', args, { allowedExitCodes: [0, 1, 2] });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return {
        dependency: name,
        version,
        exitCode: 127,
        severityCounts: emptySeverityCounts(),
        issuesFound: 0,
        errorMessage: 'snyk CLI not found. Install Snyk globally and authenticate (`npm install -g snyk`, `snyk auth`).',
      };
    }

    const exitCode = typeof (err as CommandResult).exitCode === 'number'
      ? (err as CommandResult).exitCode
      : 1;
    const stderr = typeof (err as CommandResult).stderr === 'string' ? (err as CommandResult).stderr : undefined;

    return {
      dependency: name,
      version,
      exitCode,
      severityCounts: emptySeverityCounts(),
      issuesFound: 0,
      errorMessage: stderr?.trim() || err.message,
    };
  }

  const parsedPayload = parseSnykJson(result.stdout);
  const { severityCounts, issuesFound, summary } = extractSeverityCounts(parsedPayload);

  let errorMessage: string | undefined;

  if (
    typeof parsedPayload === 'object' &&
    parsedPayload !== null &&
    'raw' in parsedPayload &&
    typeof (parsedPayload as { raw: string }).raw === 'string'
  ) {
    console.warn(`Snyk returned non-JSON output for ${name}@${version}:`);
    console.warn((parsedPayload as { raw: string }).raw);
    errorMessage = 'Unable to parse Snyk JSON output. Review the raw CLI output above for details.';
  }

  if (result.exitCode === 2) {
    errorMessage = errorMessage ?? 'Snyk reported a failure running the scan. Ensure you are authenticated (`snyk auth`) and have access to the project.';
  } else if (typeof (parsedPayload as Record<string, unknown>).error === 'string') {
    errorMessage = errorMessage ?? (parsedPayload as Record<string, string>).error;
  }

  if (typeof (parsedPayload as Record<string, unknown>).message === 'string' && !summary) {
    // Provide the CLI message when summary is missing.
    const message = (parsedPayload as Record<string, string>).message;
    errorMessage = errorMessage ?? message;
  }

  return {
    dependency: name,
    version,
    exitCode: result.exitCode,
    severityCounts,
    issuesFound,
    summary,
    errorMessage,
  };
}

function logSnykSummary(results: SnykSummary[]): void {
  if (results.length === 0) {
    console.log('\nNo dependencies required Snyk scanning.');
    return;
  }

  console.log('\nSnyk test summary (wanted versions):');

  results.forEach(result => {
    const severityParts = severityLevels
      .map(level => `${level}: ${result.severityCounts[level]}`)
      .join(', ');

    console.log(`- ${result.dependency}@${result.version}`);
    console.log(`  Exit code: ${result.exitCode}`);
    console.log(`  Issues found: ${result.issuesFound}`);
    console.log(`  Severity counts: ${severityParts}`);

    if (result.summary) {
      console.log(`  Summary: ${result.summary}`);
    }

    if (result.errorMessage) {
      console.log(`  Note: ${result.errorMessage}`);
    }
  });
}

async function main(): Promise<void> {
  console.log('Collecting outdated dependencies via npm outdated...');

  let outdatedResult: CommandResult;
  try {
    outdatedResult = await runCommand('npm', ['outdated', '--json'], { allowedExitCodes: [0, 1] });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      console.error('npm command not found. Ensure Node.js and npm are installed.');
      process.exit(1);
      return;
    }

    console.error('Failed to execute npm outdated:', err.message);
    process.exit(1);
    return;
  }

  const outdatedDependencies = parseOutdatedOutput(outdatedResult.stdout);

  if (outdatedDependencies.length === 0) {
    console.log('All dependencies are up to date.');
    if (outdatedResult.stdout.trim().length > 0) {
      console.log(outdatedResult.stdout.trim());
    }
    process.exit(0);
    return;
  }

  console.log('\nnpm outdated report:');
  try {
    await runStreamingCommand('npm', ['outdated'], { allowedExitCodes: [0, 1] });
  } catch (error) {
    console.warn('Unable to display npm outdated table:', (error as Error).message);
  }

  console.log('\nRunning Snyk tests for wanted versions...');

  const snykResults: SnykSummary[] = [];
  let snykCliMissing = false;

  for (const dependency of outdatedDependencies) {
    console.log(`\nTesting ${dependency.name}@${dependency.wanted} with Snyk...`);
    const result = await runSnykTest(dependency.name, dependency.wanted);

    if (result.exitCode === 127 && result.errorMessage?.includes('snyk CLI not found')) {
      snykCliMissing = true;
    }

    snykResults.push(result);
  }

  logSnykSummary(snykResults);

  if (snykCliMissing) {
    console.error('\nSnyk CLI not found. Install it globally and authenticate before rerunning the script.');
    process.exit(2);
    return;
  }

  const hasExecutionFailures = snykResults.some(result =>
    result.exitCode > 1 ||
    (result.exitCode !== 0 && result.issuesFound === 0 && Boolean(result.errorMessage))
  );
  const hasVulnerabilities = snykResults.some(result => result.issuesFound > 0);

  if (hasExecutionFailures) {
    process.exit(2);
    return;
  }

  if (hasVulnerabilities) {
    process.exit(1);
    return;
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Unexpected error running snyk-outdated script:', error);
  process.exit(1);
});
