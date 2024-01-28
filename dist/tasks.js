"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const YAML = __importStar(require("yaml"));
const toolbox = __importStar(require("gluegun"));
const config_1 = require("hardhat/config");
const events_1 = require("./helpers/events");
const contract_names_1 = require("hardhat/utils/contract-names");
const generator_1 = require("./helpers/generator");
const git_1 = require("./helpers/git");
const subgraph_1 = require("./helpers/subgraph");
const Protocol = require('@graphprotocol/graph-cli/dist/protocols').default;
const Subgraph = require('@graphprotocol/graph-cli/dist/subgraph').default;
const { withSpinner, step } = require('@graphprotocol/graph-cli/dist/command-helpers/spinner');
const { initNetworksConfig } = require('@graphprotocol/graph-cli/dist/command-helpers/network');
(0, config_1.task)("graph", "Wrapper task that will conditionally execute init, update or add.")
    .addOptionalPositionalParam("subtask", "Specify which subtask to execute")
    .addParam("contractName", "The name of the contract")
    .addParam("address", "The address of the contract")
    .addOptionalParam("startBlock", 'The subgraph startBlock', undefined, config_1.types.int)
    .addFlag("mergeEntities", "Whether the entities should be merged")
    .setAction(async (taskArgs, hre) => {
    const directory = hre.config.paths.subgraph;
    const manifestPath = path_1.default.join(directory, 'subgraph.yaml');
    const subgraph = toolbox.filesystem.exists(directory) == "dir" && toolbox.filesystem.exists(manifestPath) == "file";
    let command = 'init';
    if (subgraph) {
        const protocol = new Protocol('ethereum');
        const manifest = await Subgraph.load(manifestPath, { protocol });
        let { contractName } = taskArgs;
        ({ contractName } = (0, contract_names_1.parseName)(contractName));
        const dataSourcePresent = manifest.result.get('dataSources').map((ds) => ds.get('name')).contains(contractName);
        command = dataSourcePresent ? "update" : "add";
    }
    const { subtask, ...args } = taskArgs;
    if (command == 'add')
        args.abi = await getArtifactPath(hre, taskArgs.contractName);
    await hre.run(subtask || command, args);
});
(0, config_1.task)("init", "Initialize a subgraph")
    .addParam("contractName", "The name of the contract")
    .addParam("address", "The address of the contract")
    .addOptionalParam("startBlock", 'The subgraph startBlock', undefined, config_1.types.int)
    .setAction(async (taskArgs, hre) => {
    const directory = hre.config.paths.subgraph;
    const subgraphName = hre.config.subgraph.name;
    const network = hre.network.name || hre.config.defaultNetwork;
    if (toolbox.filesystem.exists(directory) == "dir" && toolbox.filesystem.exists(path_1.default.join(directory, 'subgraph.yaml')) == "file") {
        toolbox.print.error("Subgraph already exists! Please use the update subtask to update an existing subgraph!");
        process.exit(1);
    }
    const scaffold = await (0, subgraph_1.initSubgraph)(taskArgs, hre);
    if (scaffold !== true) {
        process.exit(1);
    }
    const networkConfig = await initNetworksConfig(directory, 'address');
    if (networkConfig !== true) {
        process.exit(1);
    }
    await (0, subgraph_1.updateNetworksConfig)(toolbox, network, taskArgs.contractName, 'startBlock', taskArgs.startBlock, directory);
    const isGitRepo = await (0, git_1.checkForRepo)(toolbox);
    if (!isGitRepo) {
        const repo = await (0, git_1.initRepository)(toolbox);
        if (repo !== true) {
            process.exit(1);
        }
    }
    // Generate matchstick.yaml
    toolbox.filesystem.file('matchstick.yaml', {
        content: YAML.stringify({
            testsFolder: `${directory}/tests`,
            manifestPath: `${directory}/subgraph.yaml`
        })
    });
    // Generate scripts in package.json
    await (0, generator_1.generatePackageScripts)(toolbox, subgraphName, directory);
    // Generate docker-compose.yaml
    await (0, generator_1.generateDockerCompose)(toolbox);
    const gitignore = await (0, git_1.initGitignore)(toolbox, directory);
    if (gitignore !== true) {
        process.exit(1);
    }
    const codegen = await (0, subgraph_1.runCodegen)(hre, directory);
    if (codegen !== true) {
        process.exit(1);
    }
});
(0, config_1.task)("update", "Updates an existing subgraph from artifact or contract address")
    .addParam("contractName", "The name of the contract")
    .addParam("address", "The address of the contract")
    .addOptionalParam("startBlock", 'The subgraph startBlock', undefined, config_1.types.int)
    .setAction(async (taskArgs, hre) => {
    const directory = hre.config.paths.subgraph;
    const network = hre.network.name || hre.config.defaultNetwork;
    const subgraph = toolbox.filesystem.read(path_1.default.join(directory, 'subgraph.yaml'), 'utf8');
    // If contractName is fully qualified, remove the source name
    const { contractName } = (0, contract_names_1.parseName)(taskArgs.contractName);
    if (!toolbox.filesystem.exists(directory) || !subgraph) {
        toolbox.print.error("No subgraph found! Please first initialize a new subgraph!");
        process.exit(1);
    }
    await withSpinner(`Update subgraph dataSource ${contractName}`, `Failed to update subgraph dataSource ${contractName}`, `Warnings while updating subgraph dataSource ${contractName}`, async (spinner) => {
        step(spinner, `Fetching new contract version`);
        const artifact = await hre.artifacts.readArtifact(taskArgs.contractName);
        step(spinner, `Fetching current contract version from subgraph`);
        const manifest = YAML.parse(subgraph);
        const dataSource = manifest.dataSources.find((source) => source.source.abi == artifact.contractName);
        const subgraphAbi = dataSource.mapping.abis.find((abi) => abi.name == artifact.contractName);
        const currentAbiJson = toolbox.filesystem.read(path_1.default.join(directory, subgraphAbi.file));
        if (!currentAbiJson) {
            toolbox.print.error(`Could not read ${path_1.default.join(directory, subgraphAbi.file)}`);
            process.exit(1);
        }
        step(spinner, `Updating contract ABI in subgraph`);
        toolbox.filesystem.write(path_1.default.join(directory, subgraphAbi.file), artifact.abi);
        step(spinner, `Updating contract's ${network} address in networks.json`);
        await (0, subgraph_1.updateNetworksConfig)(toolbox, network, dataSource.name, 'address', taskArgs.address, directory);
        await (0, subgraph_1.updateNetworksConfig)(toolbox, network, dataSource.name, 'startBlock', taskArgs.startBlock, directory);
        step(spinner, `Checking events for changes`);
        const eventsChanged = await (0, events_1.compareAbiEvents)(spinner, toolbox, dataSource, artifact.abi);
        if (!eventsChanged) {
            const codegen = await (0, subgraph_1.runCodegen)(hre, directory);
            if (codegen !== true) {
                process.exit(1);
            }
        }
        return true;
    });
});
(0, config_1.task)("add", "Add a dataSource to the project")
    .addParam("address", "The address of the contract")
    .addFlag("mergeEntities", "Whether the entities should be merged")
    .addOptionalParam("startBlock", 'The subgraph startBlock', undefined, config_1.types.int)
    .addOptionalParam("subgraphYaml", "The location of the subgraph.yaml file", "subgraph.yaml")
    .addOptionalParam("contractName", "The name of the contract", "Contract")
    .addOptionalParam("abi", "Path to local abi file")
    .setAction(async (taskArgs, hre) => {
    const directory = hre.config.paths.subgraph;
    const subgraph = toolbox.filesystem.read(path_1.default.join(directory, taskArgs.subgraphYaml), 'utf8');
    const { contractName } = (0, contract_names_1.parseName)(taskArgs.contractName);
    const network = hre.network.name || hre.config.defaultNetwork;
    if (!toolbox.filesystem.exists(directory) || !subgraph) {
        toolbox.print.error("No subgraph found! Please first initialize a new subgraph!");
        process.exit(1);
    }
    await withSpinner(`Add a new dataSource ${contractName}`, `Failed to add a new dataSource ${contractName}`, `Warnings while adding a new dataSource ${contractName}`, async (spinner) => {
        step(spinner, `Initiating graph add command`);
        await (0, subgraph_1.runGraphAdd)(hre, taskArgs, directory);
        await (0, subgraph_1.updateNetworksConfig)(toolbox, network, contractName, 'startBlock', taskArgs.startBlock, directory);
        return true;
    });
});
const getArtifactPath = async (hre, contractName) => {
    const artifact = await hre.artifacts.readArtifact(contractName);
    return path_1.default.join(hre.config.paths.artifacts, artifact.sourceName, `${artifact.contractName}.json`);
};
