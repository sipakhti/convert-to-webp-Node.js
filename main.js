const WEBP = require('webp-converter');
const PATH = require('path');
const fs = require('fs');
const {
    exec
} = require('child_process');
const EventEmitter = require('events');
const {
    execSync
} = require('child_process');
const process = require('process')


WEBP.grant_permission();
console.log(process.argv);
let source = process.argv[2];
let sink = source.substr(0, source.lastIndexOf('\\')) + '\\' + process.argv[3];
let files = getFiles(source);
create_dir(source, sink)
convert(files, source, process.argv[3]);




// xcopy /t /e /i source target
function create_dir(source, target) {
    execSync(`xcopy /t /e /i "${source}" "${target}"`);
}
async function convert(files, source, target) {


    for (const file of files) {
        let sourcePath = PATH.parse(file);
        if (sourcePath.ext === '') continue;

        sourcePath.ext = '.webp';

        let targetPath = sourcePath.dir + '\\' + sourcePath.name + sourcePath.ext;
        targetPath = targetPath.replace(source.substr(source.lastIndexOf('\\') + 1), target);
        console.log(targetPath.replace(source.substr(source.lastIndexOf('\\') + 1), target));
        // imageData.source.push(PATH.format(sourcePath));
        // imageData.target.push(targetPath);
        await WEBP.cwebp(PATH.format(sourcePath), targetPath.replace(source.substr(source.lastIndexOf('\\') + 1), target), '-pass 10 -sns 100 -mt -m 6 -alpha_q 75', '-progress')
            .then(response => console.log(response.replace('File:', `Input Size: ${fs.statSync(PATH.format(sourcePath)).size} bytes\nFiles:`)))

    }

    233706
}

async function convertBulkImage(imageData) {

    let iterations = imageData.source.length;
    let commands = [];

    for (let index = 0; index < iterations; index++)
        commands.push(`F:\\WORK\\WebP\\webp\\bin\\cwebp.exe -q 75 -af -sns 100 "${imageData.source[index]}" -o "${imageData.target[index]}"`)
    // WEBP.cwebp()
    console.log(execSync(commands.join('&&')));
    return;
}

function getFiles(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '\\' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}