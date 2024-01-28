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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
require("./type-extensions");
const config_1 = require("hardhat/config");
__exportStar(require("./tasks"), exports);
(0, config_1.extendConfig)((config) => {
    if (!config.paths.subgraph) {
        config.paths.subgraph = './subgraph';
    }
    const defaultConfig = {
        name: path_1.default.basename(config.paths.root),
        product: 'subgraph-studio',
        allowSimpleName: false,
        indexEvents: false,
    };
    config.subgraph = Object.assign(defaultConfig, config.subgraph);
});
