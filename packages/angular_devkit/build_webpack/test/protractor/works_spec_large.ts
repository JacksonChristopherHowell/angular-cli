/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { normalize } from '@angular-devkit/core';
import { retry } from 'rxjs/operators';
import {
  TestProjectHost,
  browserWorkspaceTarget,
  devServerWorkspaceTarget,
  protractorWorkspaceTarget,
  runTargetSpec,
  workspaceRoot,
} from '../utils';


describe('Protractor Builder', () => {
  const host = new TestProjectHost(workspaceRoot);

  beforeEach(done => host.initialize().subscribe(undefined, done.fail, done));
  afterEach(done => host.restore().subscribe(undefined, done.fail, done));

  it('works', (done) => {
    runTargetSpec(host, [
      browserWorkspaceTarget,
      devServerWorkspaceTarget,
      protractorWorkspaceTarget,
    ]).pipe(
      retry(3),
    ).subscribe(undefined, done.fail, done);
  }, 30000);

  it('works with no devServerTarget', (done) => {
    const overrides = { devServerTarget: undefined };

    runTargetSpec(host, protractorWorkspaceTarget, overrides).pipe(
      // This should fail because no server is available for connection.
    ).subscribe(undefined, done, done.fail);
  }, 30000);

  it('picks up changed port in devServer', (done) => {
    const modifiedDevServerTarget = devServerWorkspaceTarget;
    modifiedDevServerTarget.options.port = 4400;

    runTargetSpec(host, [
      browserWorkspaceTarget,
      modifiedDevServerTarget,
      protractorWorkspaceTarget,
    ]).pipe(
      retry(3),
    ).subscribe(undefined, done.fail, done);
  }, 60000);

  it('overrides protractor specs', (done) => {
    host.asSync().rename(normalize('./e2e/app.e2e-spec.ts'),
      normalize('./e2e/renamed-app.e2e-spec.ts'));

    const overrides = { specs: ['./e2e/renamed-app.e2e-spec.ts'] };

    runTargetSpec(host, [
      browserWorkspaceTarget,
      devServerWorkspaceTarget,
      protractorWorkspaceTarget,
    ], overrides).pipe(
      retry(3),
    ).subscribe(undefined, done.fail, done);
  }, 60000);

  it('overrides protractor suites', (done) => {
    host.asSync().rename(normalize('./e2e/app.e2e-spec.ts'),
      normalize('./e2e/renamed-app.e2e-spec.ts'));

    // Suites block need to be added in the protractor.conf.js file to test suites
    host.replaceInFile('protractor.conf.js', `allScriptsTimeout: 11000,`, `
      allScriptsTimeout: 11000,
      suites: {
        app: './e2e/app.e2e-spec.ts'
      },
    `);

    const overrides = { suite: 'app' };

    runTargetSpec(host, [
      browserWorkspaceTarget,
      devServerWorkspaceTarget,
      protractorWorkspaceTarget,
    ], overrides).pipe(
      retry(3),
    ).subscribe(undefined, done.fail, done);
  }, 60000);

  // TODO: test `element-explorer` when the protractor builder emits build events with text.
  // .then(() => execAndWaitForOutputToMatch('ng', ['e2e', '--element-explorer'],
  // /Element Explorer/))
  // .then(() => killAllProcesses(), (err: any) => {
  //   killAllProcesses();
  //   throw err;
  // })
});
