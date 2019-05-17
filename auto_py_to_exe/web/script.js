//---- Generic Movement ----//
// Expand groups using blue chevrons
function expand(el) {
    let expandDiv_node = document.getElementById(el.dataset.expand);
    if (el.style.transform !== "rotate(0deg)") {
        el.style.transform = 'rotate(0deg)';
        if (el.dataset.display !== undefined) {
            expandDiv_node.style.display = el.dataset.display;
        } else {
            expandDiv_node.style.display = 'block';
        }
    } else {
        el.style.transform = 'rotate(180deg)';
        expandDiv_node.style.display = 'none';
    }
}

// General flag switches (with no arguments - these are buttons)
function switchButton(node) {
    if (node.classList.contains('btn_choice_greyed')) {
        node.classList.remove('btn_choice_greyed');
    } else {
        node.classList.add('btn_choice_greyed');
    }
    generateCurrentCommand();
}



//---- Server Functions ----//
// Init method to tell the server we have started and get the file from the args if it exists
async function onInit() {
    let init_data = await eel.ui_on_init()();
    // Setup file from args
    document.getElementById('file').value = init_data.filename;
    checkFile(document.getElementById('file'));
}

// Ask the user for a file and put it in a node with id=for_id. Re-check if exists to get rid of any red
async function getFile(for_id, type) {
    document.getElementById(for_id).value = await eel.ask_file(type)();
    checkFile(document.getElementById(for_id));
}

// Ask the user for a folder and put it in a node with id=for_id.
async function getFolder(for_id) {
    document.getElementById(for_id).value = await eel.ask_folder()();
    checkFolder(document.getElementById(for_id));
}

// Check if the value of a node is a filename that exists.
async function checkFile(node) {
    checkExists(node, async function() {
        return await eel.check_if_file_exists(node.value)();
    });
}

// Check if the value of a node is a directory that exists.
async function checkFolder(node) {
    checkExists(node, async function() {
        return await eel.check_if_folder_exists(node.value)();
    });
}

// Colour borders based on the result of an 'exist check'
async function checkExists(node, existCheck) {
    if (node.value === '' && !node.required) {
        // If the input is empty and not required, don't make it look like it is missing
        node.style.border = "1px solid #458BC6";
    } else {
        let exists = await existCheck();
        if (exists) {
            node.style.border = "1px solid #458BC6";
        } else {
            node.style.border = "1px solid #f44336";
        }
    }
    generateCurrentCommand();
}

// Find the path separator for this OS
function OSPathSep() {
    if (window.navigator.userAgent.indexOf("Windows") !== -1) { return ';'; } else { return ':'; }
}

// Open output folder
function openOutputFolder() {
    let output = document.getElementById("output_location").value;
    if (output === '') {
        output = 'output/';
    }
    if (!output.endsWith('/')) {
        output += '/'
    }
    eel.open_output_folder(output)();
}



// Group end command data
let command_data = {
    "onefile" : false,
    "console" : true,
    "additional_files" : {},
    "advanced" : {
        "clean" : true,
        "name" : ""
    }
};



//---- Top Switches ----//
// Onefile - Switch colours of buttons on selection
function switchOnefile(active) {
    if (active) {
        document.getElementById('onefile_inactive').classList.add('btn_choice_greyed');
        document.getElementById('onefile_active').classList.remove('btn_choice_greyed');
        document.getElementById('onefileAdditionalFilesNote').style.display = 'block';
    } else {
        document.getElementById('onefile_active').classList.add('btn_choice_greyed');
        document.getElementById('onefile_inactive').classList.remove('btn_choice_greyed');
        document.getElementById('onefileAdditionalFilesNote').style.display = 'none';
    }
    command_data['onefile'] = active;
    generateCurrentCommand();
}

// No window - Switch colours of buttons on selection
function switchConsole(active) {
    if (active) {
        document.getElementById('console_inactive').classList.add('btn_choice_greyed');
        document.getElementById('console_active').classList.remove('btn_choice_greyed');
    } else {
        document.getElementById('console_active').classList.add('btn_choice_greyed');
        document.getElementById('console_inactive').classList.remove('btn_choice_greyed');
    }
    command_data['console'] = active;
    generateCurrentCommand();
}



//---- Additional files ----//
// Add multiple files - request for file input before
async function additionalFilesAddFiles() {
    let files = await eel.ask_files()();
    for (file of files) {
        additionalFilesAdd(file, true);
    }
}

// Add a single folder - request for folder input before
async function additionalFilesAddFolder() {
    let folder = await eel.ask_folder()();
    additionalFilesAdd(folder, false);
}

// Generic method to add files
function additionalFilesAdd(src, is_file) {
    let parent_node = document.getElementById('additional_files_content');
    let div = document.createElement('div');
    let id = 'addFiles_' + Math.random().toString(36).substring(7);
    while (Object.keys(command_data['additional_files']).indexOf(id) !== -1) {
        id = 'addFiles_' + Math.random().toString(36).substring(7);
    }
    div.innerHTML =
        '<div style="margin: 1px 0;" id="' + id + '">\n' +
        '<input placeholder="Source" onkeyup="additionalFilesEdit(\'' + id + '\')" style="max-width: 45%; width: 400px;">\n' +
        '<input placeholder="Destination" onkeyup="additionalFilesEdit(\'' + id + '\')" style="max-width: 45%; width: 400px; margin-left: 0;">\n' +
        '<img src="img/remove.svg" onclick="additionalFilesRemove(\'' + id + '\')" style="height: 20px; margin-bottom: -5px; cursor: pointer;">\n' +
        '</div>';
    parent_node.insertBefore(div.firstChild, document.getElementById('onefileAdditionalFilesNote'));
    document.getElementById(id).children[0].value = src;
    if (is_file) {
        // If we were given a file, put it in the root by default
        document.getElementById(id).children[1].value = '.';
    } else {
        if (src.split('/').length > 1) {
            // If we can find the last folder in the path, use that
            document.getElementById(id).children[1].value = src.split('/').pop() + '/';
        } else {
            // If we can't find a last folder, use assets/
            document.getElementById(id).children[1].value = 'assets/';
        }
    }

    command_data["additional_files"][id] = {
        "file" : "",
        "filename" : ""
    };
    generateCurrentCommand();
    additionalFilesEdit(id);
}

// Remove file/folder entry by id
function additionalFilesRemove(id) {
    let block = document.getElementById(id);
    block.parentNode.removeChild(block);
    delete command_data["additional_files"][id];
    generateCurrentCommand();
}

// When file data is modified for an id, update it
function additionalFilesEdit(id) {
    command_data["additional_files"][id]["file"] = document.getElementById(id).children[0].value;
    command_data["additional_files"][id]["filename"] = document.getElementById(id).children[1].value;
    generateCurrentCommand();
}



//---- Command Generation ----//
// Command generation
function generateCurrentCommand() {
    let node = document.getElementById("current_command");
    let command = 'pyinstaller -y ';
    // Basic
    if (command_data['onefile']) {
        command += "-F "
    }
    if (!command_data['console']) {
        command += "-w "
    }
    if (document.getElementById("icon").value !== "") {
        command += '-i "' + document.getElementById("icon").value + '" ';
    }
    if (Object.keys(command_data['additional_files']).length > 0) {
        for (const id of Object.keys(command_data['additional_files'])) {
            let src = document.getElementById(id).children[0].value;
            let dst = document.getElementById(id).children[1].value;
            command += '--add-data "' + src + '"' + OSPathSep() + '"' + dst + '" ';
        }
    }
    // Advanced
    // - Simple button flags
    for (const node of document.querySelectorAll('*[id^="OPTION"]')) {
        if (!node.classList.contains('btn_choice_greyed')) {
            command += node.id.replace('OPTION', '') + ' ';
        }
    }
    // - Values
    for (const node of document.querySelectorAll('*[id^="VALUE"]')) {
        if (node.value !== '') {
            command += node.id.replace('VALUE', '') + ' ';
            command += node.value + ' ';
        }
    }
    // - Split by Comma Values
    for (const node of document.querySelectorAll('*[id^="COMMASPLIT"]')) {
        if (node.value !== '') {
            let flag = node.id.replace('COMMASPLIT', '') + ' ';
            let values = node.value.split(',');
            for (const value of values) {
                if (value.trim() !== '') {
                    command += flag + value.trim() + ' ';
                }
            }
        }
    }

    // Final
    command += document.getElementById('extra_command_data').value + '"' + document.getElementById('file').value + '"';
    node.value = command
}



//---- Packaging Scripts and Files ----//

const state = {
    ready: 'STATE_READY',
    packaging: 'STATE_PACKAGING',
    complete: 'STATE_COMPLETE',
};

let current_state = state.ready;

function setState(newState) {
    // Sets up the UI for each different state
    current_state = newState;
    switch (newState) {
        case state.ready:
            // Clear output
            document.getElementById('output').style.display = 'none';
            document.getElementById('output').children[1].value = '';
            document.getElementById('output').children[1].rows = "0";
            // Set the main button back to initial value
            document.getElementById('convert').innerHTML = "Convert .py to .exe";
            // Hide open folder button
            document.getElementById('btm_main_wrapper').style.display = 'block';
            document.getElementById('openOutput').style.display = 'none';
            // Hide common issue link
            document.getElementById('common-issue-link').style.display = 'none';
            return;
        case state.packaging:
            // Disable convert button
            document.getElementById('convert').style.filter = 'grayscale(1)';
            document.getElementById('convert').style.cursor = 'not-allowed';
            document.getElementById('convert').innerHTML = "Converting...";
            // Show output
            document.getElementById('output').style.display = 'block';
            return;
        case state.complete:
            // Re-enable convert button and re-purpose it
            document.getElementById('convert').style.cursor = '';
            document.getElementById('convert').style.filter = '';
            document.getElementById('convert').innerHTML = "Clear Output";
            // Show open folder button (beside "Clear Output" button)
            document.getElementById('btm_main_wrapper').style.display = 'grid';
            document.getElementById('btm_main_wrapper').style.gridGap = '4px';
            document.getElementById('btm_main_wrapper').style.gridTemplateColumns = '1fr 1fr';
            document.getElementById('openOutput').style.display = 'block';
            // Show common issue link
            document.getElementById('common-issue-link').style.display = 'block';
            return;
    }
}

// Convert (also handles clearing output)
async function convert() {
    if (current_state === state.packaging) {
        return; // Can't do anything while packaging
    } else if (current_state === state.complete) {
        clearOutput(); // If packaging is complete, this buttons clears output
        return;
    } // Else we can continue with packaging

    // Make sure a file is supplied (don't check it exists, they already have a warning)
    if (document.getElementById('file').value === "") {
        alert("Script location required");
        return;
    }

    generateCurrentCommand(); // Final checks on the command
    let command = document.getElementById("current_command").value; // Pull out command
    let output = document.getElementById("output_location").value;
    if (output === '') { // Set default output to 'output/'
        output = 'output/';
    }
    if (!output.endsWith('/')) { // Make sure the output ends with /
        output += '/'
    }
    let command_split = command.split('"');
    let filename;
    if (document.getElementById('VALUE-n').value !== '') {
        filename = document.getElementById('VALUE-n').value + '.py';
    } else {
        filename = command_split[command_split.length-2].replace(/^.*[\\\/]/, '');
    }
    // Check and warn if a file will be overwritten
    let check = await eel.convert_pre_check(filename, command_data['onefile'], output)();
    if (!check) {
        if(!confirm("File will overwrite current file\nContinue?")) {
            return;
        }
    }
    // Check if Recursion Limit is enabled
    var disable_recursion_limit = !document.getElementById('disable_recursion_limit').classList.contains('btn_choice_greyed');
    // Make a call to convert and set the state to packaging
    eel.convert(command, output, disable_recursion_limit)();
    setState(state.packaging);
}

// Server output to client textarea
eel.expose(addOutput);
function addOutput(line) {
    document.getElementById('output').children[1].value += line; // Add the line
    if (!line.endsWith('\n')) {
        document.getElementById('output').children[1].value += '\n'; // If there was no new line, add one
    }
    // Set the correct height to fit all the output and then scroll to the bottom
    document.getElementById('output').children[1].style.height = 'auto';
    document.getElementById('output').children[1].style.height = (document.getElementById('output').children[1].scrollHeight + 10) + 'px';
    window.scrollTo(0, document.body.scrollHeight);
}

// Server notification for complete
eel.expose(outputComplete);
function outputComplete() {
    setState(state.complete);
    window.scrollTo(0, document.body.scrollHeight);
}

// When user clicks "Clear Output"
function clearOutput() {
    setState(state.ready);
}



//---- Info Bar ----//
// Setting view of left information bar based on size of window
function checkInfoBar() {
    if (window.innerWidth >= 1050) {
        document.getElementById('content').style.gridTemplateColumns = '250px 800px'; // 266 = info bar + body margins
        document.getElementById('info_bar').style.display = 'block';
        document.getElementById('mid').style.maxWidth = '1050px';

        document.getElementById('header').style.width = '100%';
        document.getElementById('header').style.margin = 'auto';
        document.getElementById('header').style.maxWidth = '1050px';
    } else {
        document.getElementById('content').style.gridTemplateColumns = '1fr';
        document.getElementById('info_bar').style.display = 'none';
        document.getElementById('mid').style.maxWidth = '';

        document.getElementById('header').style.width = '';
        document.getElementById('header').style.margin = '';
        document.getElementById('header').style.maxWidth = '';
    }
}

// Events
window.addEventListener('resize', function () {
    checkInfoBar();
});



//---- Load Events ----//
window.addEventListener('load', function () {
    checkInfoBar();
    setupAdvancedSwitchesAndInputs();
    onInit();
});

// Setup onclicks for buttons and onkeyups for inputs
function setupAdvancedSwitchesAndInputs() {
    for (const node of document.querySelectorAll('*[id^="OPTION"], #disable_recursion_limit')) {
        node.onclick = function () { switchButton(node); };
    }
    for (const node of document.querySelectorAll('*[id^="VALUE"]')) {
        node.addEventListener('keyup', function () { generateCurrentCommand(); });
    }
    for (const node of document.querySelectorAll('*[id^="COMMASPLIT"]')) {
        node.addEventListener('keyup', function () { generateCurrentCommand(); });
    }
    for (const node of document.querySelectorAll('select[id^="VALUE"]')) {
        node.onchange = function () { generateCurrentCommand(); };
    }
}
