import { HardhatRuntimeEnvironment } from 'hardhat/types';
export declare const fromDirectory: (hre: HardhatRuntimeEnvironment, directory: string, fn: () => Promise<boolean>) => Promise<boolean>;
