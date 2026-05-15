/**
 * Extension Name: ST-Conflict-Scanner
 * Author: RetiredHippie
 * Description: An on-board diagnostic tool for SillyTavern extensions. 
 * Scans active extensions against a known database of conflicts and alerts the user.
 */

// The conflict database (acting like a DTC code lookup table)
// You will need to populate this with known conflicting extensions as you discover them.
const CONFLICT_DATABASE = [
    {
        suspects: ["comfyui-auto-gen", "stable-diffusion-ext"],
        reason: "Both extensions hook into the exact same image generation trigger, causing a race condition."
    },
    {
        suspects: ["SillyTavern-Tracker", "memory-scroll"],
        reason: "Overlapping DOM injection. They both attempt to anchor to the top of the message container."
    }
];

export async function activate() {
    // Synchronous setup during ST's blocking loader
    console.log("[ST-Conflict-Scanner] Ignition on. Initializing hooks...");
}

export async function APP_READY() {
    // Asynchronous setup. Runs after all extensions and UI are loaded.
    console.log("[ST-Conflict-Scanner] Engine running. Starting diagnostic scan...");
    performDiagnosticScan();
}

function performDiagnosticScan() {
    // SillyTavern stores loaded extension data in its global context.
    // We attempt to pull the active extensions array from the ST context or global window object.
    const context = window.SillyTavern?.getContext() || {};
    
    // Fallbacks depending on the exact ST version architecture
    const activeExtensions = context.extensions || window.extension_settings || {};
    const loadedModules = Object.keys(activeExtensions);

    if (loadedModules.length === 0) {
         console.warn("[ST-Conflict-Scanner] No active extensions found in the data stream. Are you running vanilla?");
         return;
    }

    let faultsDetected = 0;

    // Run through the database and check for cross-wiring
    CONFLICT_DATABASE.forEach(faultCode => {
        // Check if all suspects in a given conflict rule are currently loaded in the environment
        const isConflictPresent = faultCode.suspects.every(suspect => 
            loadedModules.some(mod => mod.toLowerCase().includes(suspect.toLowerCase()))
        );

        if (isConflictPresent) {
            faultsDetected++;
            triggerCheckEngineLight(faultCode.suspects.join(" & "), faultCode.reason);
        }
    });

    if (faultsDetected === 0) {
        console.log("[ST-Conflict-Scanner] Diagnostic scan complete. System clear.");
    }
}

function triggerCheckEngineLight(modules, reason) {
    const warningMessage = `Conflict Scanner Warning: Wires crossing between ${modules}. ${reason}`;
    console.error(`[ST-Conflict-Scanner] FAULT DETECTED: ${warningMessage}`);
    
    // Hooking into SillyTavern's native notification system to push an alert to the dashboard
    if (typeof window.toastr !== 'undefined') {
        window.toastr.error(warningMessage, "Extension Conflict Detected", {
            timeOut: 15000,
            preventDuplicates: true
        });
    } else {
        // Fallback if toastr fails to load
        alert(warningMessage);
    }
}