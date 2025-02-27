import fs from 'fs';
import path from 'path';
import os from 'os';
import translate from './translate';
import {shell} from 'electron';
const fileIcon = require('extract-file-icon');
const filePath =  path.resolve('C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs');

const fileLists = [];
const isZhRegex = /[\u4e00-\u9fa5]/;

const icondir = path.join(os.tmpdir(), 'ProcessIcon');
const exists = fs.existsSync(icondir);
if (!exists) { fs.mkdirSync(icondir) }

const getico = app =>{
  try {
    const buffer = fileIcon(app.desc, 32);
    const iconpath = path.join(icondir, `${app.name}.png`);

    fs.exists(iconpath, exists => {
      if (!exists) {
        fs.writeFile(iconpath, buffer, 'base64', () => {});
      }
    });

  } catch(e) {
    console.log(e, app.desc);
  }
}

function fileDisplay(filePath){
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath,function(err,files){
    if(err){
      console.warn(err)
    }else{
      files.forEach(function(filename){
        const filedir = path.join(filePath, filename);
        fs.stat(filedir,function(eror,stats){
          if(eror){
            console.warn('获取文件stats失败');
          } else {
            const isFile = stats.isFile(); // 是文件
            const isDir = stats.isDirectory(); // 是文件夹
            if(isFile){
              const appName = filename.split('.')[0];
              const keyWords = [appName];
              const appDetail = shell.readShortcutLink(filedir);
              if (!appDetail.target || appDetail.target.toLowerCase().indexOf('unin') >= 0) return;

              if (isZhRegex.test(appName)) {
                const py = translate(appName);
                const pinyinArr = py.split(',');
                const zh_firstLatter = pinyinArr.map(py => py[0]);
                // 拼音
                keyWords.push(pinyinArr.join(''));
                // 缩写
                keyWords.push(zh_firstLatter.join(''));
              } else {
                const firstLatter = appName.split(' ').map(name => name[0]).join('');
                keyWords.push(firstLatter);
              }

              const icon = path.join(os.tmpdir(), 'ProcessIcon', `${encodeURIComponent(appName)}.png`);

              const appInfo = {
                value: 'plugin',
                desc: appDetail.target,
                type: 'app',
                icon,
                action: `start "dummyclient" "${appDetail.target}"`,
                keyWords: keyWords,
                name: appName,
                names: JSON.parse(JSON.stringify(keyWords)),
              }
              fileLists.push(appInfo);
              getico(appInfo);
            }
            if(isDir) {
              fileDisplay(filedir); // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
          }
        })
      });
    }
  });
}

export const getApp = {
  init: () => fileDisplay(filePath),
  fileLists
}
