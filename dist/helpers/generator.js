"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageScripts = exports.generateDockerCompose = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const { withSpinner } = require('@graphprotocol/graph-cli/dist/command-helpers/spinner');
const generateDockerCompose = async (toolbox) => {
    await withSpinner(`Generate docker-compose.yml`, `Failed to generate docker-compose.yml`, `Warnings while generating docker-compose.yml`, async () => {
        await (0, node_fetch_1.default)("https://raw.githubusercontent.com/graphprotocol/graph-node/e64083a00818bba863efc7c74485e050f8028ea5/docker/docker-compose.yml")
            .then(async (response) => {
            if (response.ok) {
                await toolbox.filesystem.write("docker-compose.yml", await response.text());
                await toolbox.patching.replace("docker-compose.yml", `ethereum: 'mainnet:http://host.docker.internal:8545'`, `ethereum: 'localhost:http://host.docker.internal:8545'`);
                return true;
            }
            else {
                toolbox.print.warning("Could not download docker-compose.yml. You'll need to manually create it. Please visit https://github.com/graphprotocol/hardhat-graph#running-local-graph-node-against-local-hardhat-node for more information.");
                return false;
            }
        });
    });
};
exports.generateDockerCompose = generateDockerCompose;
const generatePackageScripts = async (toolbox, subgraphName, directory) => {
    await withSpinner(`Generate package scripts`, `Failed to generate package scripts`, `Warnings while generating package scripts`, async () => {
        await toolbox.patching.update('package.json', (content) => {
            if (!content.scripts)
                content.scripts = {};
            content.scripts['graph-test'] = 'graph test';
            content.scripts['graph-codegen'] = `cd ${directory} && graph codegen`;
            content.scripts['graph-build'] = `cd ${directory} && graph build`;
            content.scripts['graph-local'] = 'docker-compose up';
            content.scripts['graph-local-clean'] = "docker-compose down -v && docker-compose rm -v && rm -rf data/ipfs data/postgres";
            content.scripts['create-local'] = `graph create --node http://127.0.0.1:8020 ${subgraphName}`;
            content.scripts['deploy-local'] = `cd ${directory} && graph deploy --ipfs http://127.0.0.1:5001 --node http://127.0.0.1:8020 ${subgraphName}`;
            content.scripts['hardhat-local'] = "hardhat node --hostname 0.0.0.0";
            return content;
        });
    });
};
exports.generatePackageScripts = generatePackageScripts;
