import * as chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import ts = require('typescript');
import { NodeHost } from '../../lib/ast-tools';
import { CliConfig } from '../../models/config';
import { dynamicPathParser } from '../../utilities/dynamic-path-parser';
import { getAppFromConfig } from '../../utilities/app-utils';
import { resolveModulePath } from '../../utilities/resolve-module-file';
import { Change, MultiChange } from '../../lib/ast-tools/change';

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

    class MetaData {
      className: string;
      fileName: string;
      importPath: string;
      pathToIndex: string;
      importStr: string;
      exportStr: string;
      imports: any;
      exports: any;
      changes: Change[];

      constructor(
        pieceName: string, //like 'Actions', 'Effects', 'Reducer', should be capitalized
        subDirName: string, //a directory where the file's been holden, like 'actions', 'effects', 'reducers',
        moduleDir: string, //should be initialized before creating an object
        relativeDir: string //should be initialized before creating an object
        ) {
          this.className = stringUtils.classify(`${options.entity.name}${pieceName}`);
          this.fileName = stringUtils.dasherize(`${options.entity.name}.${pieceName.toLowerCase()}`);
          if (relativeDir) {
            this.importPath = `./${relativeDir}/${subDirName}/${this.fileName}`;
            this.pathToIndex = `${moduleDir}/${relativeDir}/${subDirName}/index.ts`;
          }
          else {
            this.importPath = `./${subDirName}/${this.fileName}`;
            this.pathToIndex = `${moduleDir}/${subDirName}/index.ts`;
          }
          this.importStr = `\nimport { ${this.className} } from './${this.fileName}';`;
          this.exportStr = `,\n    ${this.className}`;
          if (!fs.existsSync(this.pathToIndex)) {
            fs.writeFileSync(this.pathToIndex, '\n\nexport {\n\n};');
            this.importStr = `import { ${this.className} } from './${this.fileName}';`;
            this.exportStr = `    ${this.className}`;
          }
          this.imports = getNodesOfKind(ts.SyntaxKind.ImportDeclaration, this.pathToIndex);
          this.exports = getNodesOfKind(ts.SyntaxKind.ExportSpecifier, this.pathToIndex);
          this.changes = [];
          this.changes.push(astUtils.insertAfterLastOccurrence(this.imports, this.importStr, this.pathToIndex, 0));
          this.changes.push(astUtils.insertAfterLastOccurrence(this.exports, this.exportStr, this.pathToIndex, 11));
      }
    }

    const returns: Array<any> = [];

    const fullGeneratePath = path.join(this.project.root, this.generatePath);
    const moduleDir = path.parse(this.pathToModule).dir;
    const relativeDir = path.relative(moduleDir, fullGeneratePath);
    
    const actions = new MetaData('Actions', 'actions', moduleDir, relativeDir);
    const effects = new MetaData('Effects', 'effects', moduleDir, relativeDir);
    const reducer = new MetaData('Reducer', 'reducers', moduleDir, relativeDir);

    try {
      returns.push(
        new MultiChange(actions.changes).apply(NodeHost).then(() =>
        new MultiChange(effects.changes).apply(NodeHost).then(() => 
        new MultiChange(reducer.changes).apply(NodeHost)))
        // astUtils
        // .addProviderToModule(this.pathToModule, actions.className, actions.importPath)
        // .then((change: any) => change.apply(NodeHost)))
      );

      this._writeStatusToUI(chalk.yellow, 'update', path.relative(this.project.root, actions.pathToIndex));
      this._writeStatusToUI(chalk.yellow, 'update', path.relative(this.project.root, effects.pathToIndex));
      this._writeStatusToUI(chalk.yellow, 'update', path.relative(this.project.root, reducer.pathToIndex));

      // this._writeStatusToUI(chalk.yellow,
      // 'update',
      // path.relative(this.project.root, this.pathToModule));

    }
    catch(error) {
      this._writeStatusToUI(chalk.red,
      'ERR', error.message;
    }

    return Promise.all(returns);

    function getNodesOfKind(kind: ts.SyntaxKind, sourceFile: string) {
      return astUtils.findNodes(getRootNode(sourceFile), kind);
    }

    function getRootNode(sourceFile: string) {
      return ts.createSourceFile(sourceFile, fs.readFileSync(sourceFile).toString(),
        ts.ScriptTarget.Latest, true);
    }
  }
});
