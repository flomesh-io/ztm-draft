import {app, BrowserWindow, ipcMain, screen} from 'electron';
const path = require("path")

// 创建窗口
let win
const createWindow = (width, height) => {
	const devTools = import.meta.env.VITE_APP_DEV_TOOLS;
    win = new BrowserWindow({
			width: 455, 
			height: 350,
			minWidth: 408, 
			minHeight: 350,
			// useContentSize: true,
      webPreferences:{
				devTools: devTools == 'open',
        nodeIntegration:true,
        contextIsolation:false,
      }
    });
		
    if (process.env.NODE_ENV !== 'development') {
			win.loadFile(path.join(__dirname,'../index.html'))
    }else{
			win.loadURL("http://"+process.env.VITE_DEV_SERVER_HOST+':'+process.env.VITE_DEV_SERVER_PORT)
    }

    // 打开调试工具
    // win.webContents.openDevTools()

    // 渲染进程传主进程
    ipcMain.on('message',(_,num) =>{
        console.log(num,'---------中文');
    });
		
		ipcMain.on('resize',(_,{ width, height}) =>{
			// win.setResizable(width>600);
		  win.setSize(width, height)
		});
		setTimeout(() =>{
			win.webContents.send('load',{massage:"初始化完成"})
		},3000);
}


 

// 运行

app.whenReady().then((event) => {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize
	createWindow(width, height)
})