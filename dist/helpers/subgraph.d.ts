import { HardhatRuntimeEnvironment } from 'hardhat/types';
export declare const initSubgraph: (taskArgs: {
    contractName: string;
    address: string;
}, hre: HardhatRuntimeEnvironment) => Promise<boolean>;
export declare const updateNetworksConfig: (toolbox: any, network: string, dataSource: string, identifier: string, value: string | number, directory: string) => Promise<void>;
export declare const runCodegen: (hre: HardhatRuntimeEnvironment, directory: string) => Promise<boolean>;
export declare const runBuild: (hre: HardhatRuntimeEnvironment, network: string, directory: string) => Promise<boolean>;
export declare const runGraphAdd: (hre: HardhatRuntimeEnvironment, taskArgs: {
    contractName: string;
    address: string;
    mergeEntities: boolean;
    abi: string;
    subgraphYaml: string;
}, directory: string) => Promise<boolean>;
export declare const validateProduct: (product: string) => void;
