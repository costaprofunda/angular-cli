import * as chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import ts = require('typescript');
import { NodeHost } from '../../lib/ast-tools';
import { CliConfig } from '../../models/config';
import { dynamicPathParser } from '../../utilities/dynamic-path-parser';
import { getAppFromConfig } from '../../utilities/app-utils';
import { resolveModulePath } from '../../utilities/resolve-module-file';
import { MultiChange } from '../../lib/ast-tools/change';

const Blueprint = require('../../ember-cli/lib/models/blueprint');
const stringUtils = require('ember-cli-string-utils');
const astUtils = require('../../utilities/ast-utils');
const findParentModule = require('../../utilities/find-parent-module').default;
const getFiles = Blueprint.prototype.files;

export default Blueprint.extend({
  description: '',

  availableOptions: [
    {
      name: 'flat',
      type: Boolean,
      description: 'Flag to indicate if a dir is created.'
    },
    {
      name: 'module',
      type: String,
      aliases: ['m'],
      description: 'Allows specification of the declaring module.'
    },
    {
      name: 'app',
      type: String,
      aliases: ['a'],
      description: 'Specifies app name to use.'
    }
  ],

  beforeInstall: function (options: any) {
    const appConfig = getAppFromConfig(this.options.app);
    if (options.module) {
      this.pathToModule =
        resolveModulePath(options.module, this.project, this.project.root, appConfig);
    } else {
      try {
        this.pathToModule = findParentModule(this.project.root, appConfig.root, this.generatePath);
      } catch (e) {
        if (!options.skipImport) {
          throw `Error locating module for declaration\n\t${e}`;
        }
      }
    }
  },

  normalizeEntityName: function (entityName: string) {
    const appConfig = getAppFromConfig(this.options.app);
    const parsedPath = dynamicPathParser(this.project, entityName, appConfig);

    this.dynamicPath = parsedPath;
    return parsedPath.name;
  },

  locals: function (options: any) {
    options.flat = options.flat !== undefined ?
      options.flat : CliConfig.getValue('defaults.service.flat');

    return {
      dynamicPath: this.dynamicPath.dir,
      flat: options.flat
    };
  },

  files: function () {
    return getFiles.call(this) as Array<string>;
  },

  fileMapTokens: function (options: any) {
    // Return custom template variables here.
    return {
      __path__: () => {
        let dir = this.dynamicPath.dir;
        if (!options.locals.flat) {
          dir += path.sep + options.dasherizedModuleName;
        }
        this.generatePath = dir;
        return dir;
      }
    };
  },

  afterInstall(options: any) {
    const returns: Array<any> = [];
    // const classNameActions = stringUtils.classify(`${options.entity.name}Actions`);
    // const classNameEffects = stringUtils.classify(`${options.entity.name}Effects`);
    // const classNameReducer = stringUtils.classify(`${options.entity.name}Reducer`);
    // const fileNameActions = stringUtils.dasherize(`${options.entity.name}.actions`);
    // const fileNameEffects = stringUtils.dasherize(`${options.entity.name}.effects`);
    // const fileNameReducer = stringUtils.dasherize(`${options.entity.name}.reducer`);
    // const fullGeneratePath = path.join(this.project.root, this.generatePath);
    // const moduleDir = path.parse(this.pathToModule).dir;
    // const relativeDir = path.relative(moduleDir, fullGeneratePath);
    // let importPathActions, importPathEffects, importPathReducer;
    // let pathToIndexActions, pathToIndexEffects, pathToIndexReducer;
    // if (relativeDir) {
    //   importPathActions = `./${relativeDir}/actions/${fileNameActions}`;
    //   importPathEffects = `./${relativeDir}/effects/${fileNameEffects}`;
    //   importPathReducer = `./${relativeDir}/reducers/${fileNameReducer}`;
    //   pathToIndexActions = `${moduleDir}/${relativeDir}/actions/index.ts`;
    //   pathToIndexEffects = `${moduleDir}/${relativeDir}/effects/index.ts`;
    //   pathToIndexReducer = `${moduleDir}/${relativeDir}/reducers/index.ts`;
    // } else {
    //   importPathActions = `./actions/${fileNameActions}`;
    //   importPathEffects = `./effects/${fileNameEffects}`;
    //   importPathReducer = `./reducers/${fileNameReducer}`;
    //   pathToIndexActions = `${moduleDir}/actions/index.ts`;
    //   pathToIndexEffects = `${moduleDir}/effects/index.ts`;
    //   pathToIndexReducer = `${moduleDir}/reducers/index.ts`;
    // }
    // let importPreActions, importPreEffects, importPreReducer = '\n';
    // let exportPostActions, exportPostEffects, exportPostReducer = ',\n';
    // if (!fs.existsSync(pathToIndexActions)) {
    //   fs.closeSync(fs.openSync(pathToIndexActions, 'w'));
    //   fs.writeFile(pathToIndexActions, '\n\nexport {\n\n};');
    //   importPreActions = exportPostActions = '';
    // }
    // if (!fs.existsSync(pathToIndexEffects)) {
    //   fs.closeSync(fs.openSync(pathToIndexEffects, 'w'));
    //   fs.writeFile(pathToIndexEffects, '\n\nexport {\n\n};');
    //   importPreEffects = exportPostEffects = '';
    // }
    // if (!fs.existsSync(pathToIndexReducer)) {
    //   fs.closeSync(fs.openSync(pathToIndexReducer, 'w'));
    //   fs.writeFile(pathToIndexReducer, '\n\nexport {\n\n};');
    //   importPreReducer = exportPostReducer = '';
    // }

    // const importsActions = getNodesOfKind(ts.SyntaxKind.ImportDeclaration, pathToIndexActions);
    // const exportActions = getNodesOfKind(ts.SyntaxKind.ExportAssignment, pathToIndexActions);
    // let importActionsStr = importPreActions;
    // importActionsStr += `import { ${classNameActions} } from './${fileNameActions}';`;
    // const exportActionsStr = `    ${classNameActions}${exportPostActions}`;

    // const importsEffects = getNodesOfKind(ts.SyntaxKind.ImportDeclaration, pathToIndexEffects);
    // const exportEffects = getNodesOfKind(ts.SyntaxKind.ExportAssignment, pathToIndexEffects);
    // let importEffectsStr = importPreEffects;
    // importEffectsStr += `import { ${classNameEffects} } from './${fileNameEffects}';`;
    // const exportEffectsStr = `    ${classNameEffects}${exportPostEffects}`;

    // const importsReducer = getNodesOfKind(ts.SyntaxKind.ImportDeclaration, pathToIndexReducer);
    // const exportReducer = getNodesOfKind(ts.SyntaxKind.ExportAssignment, pathToIndexReducer);
    // let importReducerStr = importPreReducer;
    // importReducerStr += `import { ${classNameReducer} } from './${fileNameReducer}';`;
    // const exportReducerStr = `    ${classNameReducer}${exportPostReducer}`;

    // returns.push(
    //   new MultiChange([
    //     astUtils
    //       .insertAfterLastOccurrence(exportActions, exportActionsStr, pathToIndexActions, 11),
    //     astUtils
    //       .insertAfterLastOccurrence(importsActions, importActionsStr, pathToIndexActions, 0)
    //   ]).apply(NodeHost).then(() =>
    //     astUtils
    //     .addProviderToModule(this.pathToModule, classNameActions, importPathActions)
    //     .then((change: any) => change.apply(NodeHost))).then(() => new MultiChange([
    //     astUtils
    //       .insertAfterLastOccurrence(exportEffects, exportEffectsStr, pathToIndexEffects, 11),
    //     astUtils
    //       .insertAfterLastOccurrence(importsEffects, importEffectsStr, pathToIndexEffects, 0)
    //   ]).apply(NodeHost)).then(() => astUtils
    //     .addDeclarationToModule(this.pathToModule, classNameEffects, importPathEffects)
    //     .then((change: any) => change.apply(NodeHost)))
    // );

    // this._writeStatusToUI(chalk.yellow,
    //   'update',
    //   path.relative(this.project.root, this.pathToModule));

    return Promise.all(returns);

    // function getNodesOfKind(kind: ts.SyntaxKind, sourceFile: string) {
    //   return astUtils.findNodes(getRootNode(sourceFile), kind);
    // }

    // function getRootNode(sourceFile: string) {
    //   return ts.createSourceFile(sourceFile, fs.readFileSync(sourceFile).toString(),
    //     ts.ScriptTarget.Latest, true);
    // }
  }
});
