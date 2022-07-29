const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
// const { writeFile } = require('original-fs');

//Janela principal
var mainWindow = null;

async function createWindow() {
    console.log('create');
    mainWindow = new BrowserWindow({
        width:800,
        height:600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    await mainWindow.loadFile('src/pages/editor/index.html');

    // mainWindow.webContents.openDevTools();

    createNewFile();

    ipcMain.on('update-content', function(event, data){
        file.content = data;
    });
}

//Arquivo
var file = {};

//Criar novo arquivo
function createNewFile() {
    file = {
        name: 'novo-arquivo.txt',
        content: '',
        saved: false,
        path: app.getPath('documents')+'/novo-arquivo.txt'
    };

    mainWindow.webContents.send('set-file', file);
}

//Salva arquivo no disco
function writeFile(filePath) {
    try {
        fs.writeFile(filePath, file.content, function(error) {
            //Error
            if (error) throw error;

            //Arquivo salvo
            file.path  = filePath;
            file.saved = true;
            file.name  = path.basename(filePath);

            mainWindow.webContents.send('set-file', file)
        });
    } catch (e) {
        console.log(e);
    }
}

//Ler arquivo
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.log(e);
        return '';
    }
}

//Abrir arquivo
async function openFile() {
    //Diálogo
    let dialogFile = await dialog.showOpenDialog({
        defaultPath: file.path
    });

    //Verifica cancelamento
    if (dialogFile.canceled) return false;

    //Abrir o arquivo
    file = {
        name: path.basename(dialogFile.filePaths[0]),
        content: readFile(dialogFile.filePaths[0]),
        saved: true,
        path: dialogFile.filePaths[0]
    };

    mainWindow.webContents.send('set-file', file);
}

//Salvar arquivo
function saveFile() {
    //Salva
    if (file.saved) {
        return writeFile(file.path);
    }

    //Salva como
    return saveFileAs();
}

//Salvar como
async function saveFileAs() {

    //Dialog
    let dialogFile = await dialog.showSaveDialog({
        defaultPath: file.path
    });

    //Verifica cancelamento
    if (dialogFile.canceled) {
        return false;
    }

    //Salva arquivo
    writeFile(dialogFile.filePath);
}

//Template menu
const templateMenu = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Novo',
                accelerator: 'CmdOrCtrl+N',
                click() {
                    createNewFile();
                }
            },
            {
                label: 'Abrir',
                accelerator: 'CmdOrCtrl+O',
                click(){
                    openFile();
                }
            },
            {
                label: 'Salvar',
                accelerator: 'CmdOrCtrl+S',
                click(){
                    saveFile();
                }
            },
            {
                label: 'Salvar como',
                accelerator: 'CmdOrCtrl+Shift+S',
                click(){
                    saveFileAs();
                }
            },
            {
                label: 'Preferências',
                submenu: [
                    {
                        label: 'Aparência'
                    },
                    {
                        label: 'Atalhos do teclado'
                    }
                ]
            },
            {
                label: 'Sobre',
                accelerator: 'CmdOrCtrl+Shift+I'
            },
            {
                label: 'Sair',
                accelerator: 'CmdOrCtrl+Q',
                role: process.platform === 'darwin' ? 'close' : 'quit'
            }
        ]
    },
    {
        label: 'Editar',
        submenu: [
            {
                label: 'Desfazer',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            },
            {
                label: 'Refazer',
                accelerator: 'CmdOrCtrl+Y',
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                label: 'Copiar',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            },
            {
                label: 'Cortar',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            },
            {
                label: 'Colar',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            },
        ]
    },
    {
        label: 'Ajuda',
        submenu: [
            {
                label: 'Eduardo M. - GitHub',
                click(){
                    shell.openExternal('https://github.com/oedumoreira');
                }
            }
        ]
    }
];

//Menu
const menu = Menu.buildFromTemplate(templateMenu);
Menu.setApplicationMenu(menu);

//On ready
app.whenReady().then(createWindow);

//Activate window for Mac
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});