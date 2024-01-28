import "hardhat/types/config";
declare module "hardhat/types/config" {
    interface ProjectPathsUserConfig {
        subgraph: string;
    }
    interface ProjectPathsConfig {
        subgraph: string;
    }
    interface HardhatConfig {
        subgraph: Subgraph;
    }
    interface Subgraph {
        name: string;
        product: string;
        indexEvents: boolean;
        allowSimpleName: boolean;
    }
}
