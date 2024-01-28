"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromDirectory = void 0;
const fs_1 = __importDefault(require("fs"));
const process_1 = __importDefault(require("process"));
// Changes the process cwd to the passed directory.
// Executes the code in the passed function.
// Changes the process cwd back to the root folder
// Returns the result of the passed function.
const fromDirectory = async (hre, directory, fn) => {
    if (fs_1.default.existsSync(directory)) {
        process_1.default.chdir(directory);
    }
    const result = await fn();
    process_1.default.chdir(hre.config.paths.root);
    return result;
};
exports.fromDirectory = fromDirectory;
