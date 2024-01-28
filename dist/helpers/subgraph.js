"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProduct = exports.runGraphAdd = exports.runBuild = exports.runCodegen = exports.updateNetworksConfig = exports.initSubgraph = void 0;
const path_1 = __importDefault(require("path"));
const immutable_1 = require("immutable");
const execution_1 = require("./execution");
const contract_names_1 = require("hardhat/utils/contract-names");
const CodegenCommand = require('@graphprotocol/graph-cli/dist/commands/codegen').default;
const BuildCommand = require('@graphprotocol/graph-cli/dist/commands/build').default;
const AddCommand = require('@graphprotocol/graph-cli/dist/commands/add').default;
const Protocol = require('@graphprotocol/graph-cli/dist/protocols').default;
const { chooseNodeUrl } = require('@graphprotocol/graph-cli/dist/command-helpers/node');
const { withSpinner } = require('@graphprotocol/graph-cli/dist/command-helpers/spinner');
const { generateScaffold, writeScaffold } = require('@graphprotocol/graph-cli/dist/command-helpers/scaffold');
const AVAILABLE_PRODUCTS = ['subgraph-studio', 'hosted-service'];
const initSubgraph = async (taskArgs, hre) => await withSpinner(`Create subgraph scaffold`, `Failed to create subgraph scaffold`, `Warnings while creating subgraph scaffold`, async (spinner) => {
    const { contractName, address } = taskArgs;
    const subgraphPath = hre.config.paths.subgraph;
    const network = hre.network.name || hre.config.defaultNetwork;
    const { name, product, indexEvents } = hre.config.subgraph;
    const { node, allowSimpleName } = chooseNodeUrl({ product, allowSimplename: hre.config.subgraph.allowSimpleName });
    validateSubgraphName(name, allowSimpleName);
    (0, exports.validateProduct)(product);
    const protocolInstance = new Protocol('ethereum');
    const ABI = protocolInstance.getABI();
    const artifact = await hre.artifacts.readArtifact(contractName);
    const abi = new ABI(artifact.contractName, undefined, (0, immutable_1.fromJS)(artifact.abi));
    const scaffold = await generateScaffold({
        protocolInstance,
        network,
        subgraphName: name,
        abi,
        contract: address,
        contractName: artifact.contractName,
        indexEvents,
        node,
    }, spinner);
    await writeScaffold(scaffold, subgraphPath, spinner);
    return true;
});
exports.initSubgraph = initSubgraph;
const updateNetworksConfig = async (toolbox, network, dataSource, identifier, value, directory) => {
    await toolbox.patching.update(path_1.default.join(directory, 'networks.json'), (config) => {
        if (Object.prototype.hasOwnProperty.call(config, network)) {
            if (Object.prototype.hasOwnProperty.call(config[network], dataSource)) {
                Object.assign(config[network][dataSource], { [identifier]: value });
            }
            else {
                Object.assign(config[network], { [dataSource]: { [identifier]: value } });
            }
        }
        else {
            Object.assign(config, { [network]: { [dataSource]: { [identifier]: value } } });
        }
        return config;
    });
};
exports.updateNetworksConfig = updateNetworksConfig;
const runCodegen = async (hre, directory) => await (0, execution_1.fromDirectory)(hre, directory, async () => {
    await CodegenCommand.run([]);
    return true;
});
exports.runCodegen = runCodegen;
const runBuild = async (hre, network, directory) => await (0, execution_1.fromDirectory)(hre, directory, async () => {
    await BuildCommand.run(['--network', network]);
    return true;
});
exports.runBuild = runBuild;
const runGraphAdd = async (hre, taskArgs, directory) => await (0, execution_1.fromDirectory)(hre, directory, async () => {
    const { abi, address, mergeEntities, subgraphYaml } = taskArgs;
    const { contractName } = (0, contract_names_1.parseName)(taskArgs.contractName);
    const commandLine = [address, '--contract-name', contractName];
    if (subgraphYaml.includes(directory)) {
        commandLine.push(path_1.default.normalize(subgraphYaml.replace(directory, '')));
    }
    else {
        commandLine.push(subgraphYaml);
    }
    if (mergeEntities) {
        commandLine.push('--merge-entities');
    }
    if (abi) {
        if (abi.includes(directory)) {
            commandLine.push('--abi', path_1.default.normalize(abi.replace(directory, '')));
        }
        else {
            commandLine.push('--abi', abi);
        }
    }
    await AddCommand.run(commandLine);
    return true;
});
exports.runGraphAdd = runGraphAdd;
const validateSubgraphName = (name, allowSimpleName) => {
    if (name.split('/').length !== 2 && !allowSimpleName) {
        throw new Error(`Subgraph name "${name}" needs to have the format "<PREFIX>/${name}".
When using the Hosted Service at https://thegraph.com, <PREFIX> is the
name of your GitHub user or organization. You can configure the name in the hardhat.config:

module.exports = {
  ...
  subgraph: {
    ...
    product: 'hosted-service',
    name: '<PREFIX>/${name}',
    ...
  },
}

Or you can bypass this check by setting allowSimpleName to true in the hardhat.config:
module.exports = {
  ...
  subgraph: {
    ...
    product: 'hosted-service',
    allowSimpleName: true,
    ...
  },
}`);
    }
};
const validateProduct = (product) => {
    if (!AVAILABLE_PRODUCTS.includes(product)) {
        throw new Error(`Unsupported product ${product}. Currently available products are ${AVAILABLE_PRODUCTS.join(' and ')}`);
    }
};
exports.validateProduct = validateProduct;
