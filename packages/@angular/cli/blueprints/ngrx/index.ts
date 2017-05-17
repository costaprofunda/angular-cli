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
      stateName: string;
      importPath: string;
      pathToIndex: string;
      importStr: string;
      exportStr: string;
      anotherExportStr: string;
      imports: any;
      exports: any;
      anotherExports: any;
      changes: Change[];
      indexFileJustCreated: boolean = false;

      constructor(
        pieceName: string, //like 'Actions', 'Effects', 'Reducer', should be capitalized
        subDirName: string, //a directory where the file's been holden, like 'actions', 'effects', 'reducers',
        moduleDir: string, //should be initialized before creating an object
        relativeDir: string //should be initialized before creating an object
        reducer?: boolean //the object will be defined in reducer-way
        ) {
          this.className = stringUtils.classify(`${options.entity.name}${pieceName}`);
          this.fileName = stringUtils.dasherize(`${options.entity.name}.${pieceName.toLowerCase()}`);
          this.stateName = stringUtils.classify(`${options.entity.name}State`);
          if (relativeDir) {
            this.importPath = `./${relativeDir}/${subDirName}/${this.fileName}`;
            this.pathToIndex = `${moduleDir}/${relativeDir}/${subDirName}/index.ts`;
          }
          else {
            this.importPath = `./${subDirName}/${this.fileName}`;
            this.pathToIndex = `${moduleDir}/${subDirName}/index.ts`;
          }
          if (reducer) {
            this.importStr = `\nimport { ${options.entity.name}${pieceName}, ${this.stateName} } from './${this.fileName}';`
            this.exportStr = `,\n    ${options.entity.name}: ${this.stateName}`;
            this.anotherExportStr = `,\n    ${options.entity.name}: ${options.entity.name}${pieceName}`;
          }
          else {
            this.importStr = `\nimport { ${this.className} } from './${this.fileName}';`;
            this.exportStr = `,\n    ${this.className}`;
          }
          if (!fs.existsSync(this.pathToIndex)) {
            let fileContent: string = '';
            if (reducer) {
              fileContent += `import { ${options.entity.name}${pieceName}, ${this.stateName} } from './${this.fileName}';`;
              fileContent += `\n\nexport interface AppState {\n    ${options.entity.name}: ${this.stateName}\n};`;
              fileContent += `\n\nexport default compose()({\n    ${options.entity.name}: ${options.entity.name}${pieceName}\n})`  
            }
            else {
              fileContent += `import { ${this.className} } from './${this.fileName}';`;
              fileContent += `\n\nexport {\n    ${this.className}\n};`;
            }
            fs.writeFileSync(this.pathToIndex, fileContent);
            this.indexFileJustCreated = true;
          }
          this.imports = getNodesOfKind(ts.SyntaxKind.ImportDeclaration, this.pathToIndex);
          this.exports = getNodesOfKind(!reducer ? ts.SyntaxKind.ExportSpecifier : ts.SyntaxKind.InterfaceDeclaration, this.pathToIndex);
          this.changes = [];
          if (!this.indexFileJustCreated) {
            this.changes.push(astUtils.insertAfterLastOccurrence(this.imports, this.importStr, this.pathToIndex));
            this.changes.push(astUtils.insertAfterLastOccurrence(this.exports, this.exportStr, this.pathToIndex, reducer ? -2 : 0));
            if (reducer) {
              const indexFiledata = fs.readFileSync(this.pathToIndex);
              this.anotherExports = getNodesOfKind(ts.SyntaxKind.CloseBracketToken, this.pathToIndex);
              this.changes.push(astUtils.insertAfterLastOccurrence(this.anotherExports, this.anotherExportStr, this.pathToIndex, -3, indexFiledata.length));
            }
          }
      }
    }

    const returns: Array<any> = [];

    const fullGeneratePath = path.join(this.project.root, this.generatePath);
    const moduleDir = path.parse(this.pathToModule).dir;
    const relativeDir = path.relative(moduleDir, fullGeneratePath);
    
    const actions = new MetaData('Actions', 'actions', moduleDir, relativeDir);
    const effects = new MetaData('Effects', 'effects', moduleDir, relativeDir);
    const reducer = new MetaData('Reducer', 'reducers', moduleDir, relativeDir, true);

    try {
      returns.push(
        new MultiChange(actions.changes).apply(NodeHost).then(() =>
        new MultiChange(effects.changes).apply(NodeHost).then(() => 
        new MultiChange(reducer.changes).apply(NodeHost))).then(() => 
        astUtils
          .addProviderToModule(this.pathToModule, actions.className, actions.importPath)
          .then((change: any) => change.apply(NodeHost))).then(() => 
          astUtils.addImportToModule(this.pathToModule, effects.className, effects.importPath, 
            `EffectsModule.runAfterBootstrap(${effects.className})`))
          .then((change: any) => change.apply(NodeHost))
      );

      this._writeStatusToUI(chalk.yellow,
        actions.indexFileJustCreated ? 'create' : 'update',
        path.relative(this.project.root, actions.pathToIndex));
      this._writeStatusToUI(chalk.yellow,
        effects.indexFileJustCreated ? 'create' : 'update', 
        path.relative(this.project.root, effects.pathToIndex));
      this._writeStatusToUI(chalk.yellow,
        reducer.indexFileJustCreated ? 'create' : 'update',
        path.relative(this.project.root, reducer.pathToIndex));
      this._writeStatusToUI(chalk.yellow, 'update', path.relative(this.project.root, this.pathToModule));

    }
    catch(error) {
      this._writeStatusToUI(chalk.red, 'ERR', error.message;
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
