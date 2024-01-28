"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareAbiEvents = void 0;
const ethers_1 = require("ethers");
const compareAbiEvents = async (spinner, toolbox, dataSource, newAbiJson) => {
    // Convert to Interface
    const newAbi = new ethers_1.ethers.Interface(newAbiJson);
    // Get events signatures
    const newAbiEvents = [];
    newAbi.forEachEvent((event) => {
        event.name && newAbiEvents.push(event.name);
    });
    // Fetch current dataSource events signatures from subgraph.yaml
    const currentAbiEvents = dataSource.mapping.eventHandlers.map((handler) => { return handler.event; });
    // Check for renamed or replaced events
    const changedEvents = await eventsDiff(currentAbiEvents, newAbiEvents);
    // const removedEvents = await eventsDiff(currentAbiEvents, newAbiEvents)
    const changed = newAbiEvents.length != currentAbiEvents.length || changedEvents.length != 0;
    if (changed) {
        spinner.warn(`Contract events have been changed!\n
      Current events:\n${currentAbiEvents.join('\n')}\n
      New events:\n${newAbiEvents.join('\n')}\n
      Please address the change in your subgraph.yaml and run \`graph codegen\` and graph \`build --network <network>\` from the subgraph folder!`.replace(/[ ]{2,}/g, ''));
    }
    return changed;
};
exports.compareAbiEvents = compareAbiEvents;
const eventsDiff = async (array1, array2) => {
    return array1.filter(x => !array2.includes(x));
};
