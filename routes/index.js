var express = require('express');
var request = require('request');
var router = express.Router();

let usersList = [];
let tasksList = [];
let serverMap = [];
const H = 400;
const W = 800;
const TIMEDELAY = 10000;


let getboard = () => {
  for (let i = 0; i < H; i++) {
    serverMap[i] = [];
    for (let j = 0; j < W; j++) {
      serverMap[i][j] = 32;
    }
  }
  request.get('https://www.luogu.com.cn/paintBoard/board',
    (err, res, body) => {
      if (err) {
        console.log('绘版获得失败。');
      } else {
        body.split('\n').map(function (colorStr, x) {
          colorStr.split('').map(function (color, y) {
            serverMap[y][x] = parseInt(color, 32);
          });
        });
      }
      setTimeout(getboard, 2000);
    }
  )
};

getboard();

let runpaint = () => {
  if (serverMap && serverMap.length !== 0) {
    let nowtime = new Date().getTime();
    let qu = [];
    for (const iterator of tasksList) {
      if (serverMap[iterator.x][iterator.y] !== iterator.color) {
        qu.push(iterator);
      }
    }
    for (let i = 0; i < usersList.length; i++) {
      if (qu.length === 0) {
        break;
      }
      if (usersList[i].lasttime === -1) {
        usersList.split(i, 1);
        --i;
      } else {
        ((iterator) => {
          if (nowtime - iterator.lasttime > TIMEDELAY) {
            iterator.lasttime = nowtime;
            request.post('https://www.luogu.com.cn/paintBoard/paint',
              { form: qu.shift(), headers: { 'Cookie': iterator.cookie } },
              (err, res, body) => {
                iterator.lasttime = new Date().getTime();
                if (err || res.statusCode !== 200) {
                  console.log('Cookie为' + iterator.cookie + '的用户涂色失败');
                }
                if (JSON.parse(body).data === '没有登录') {
                  iterator.lasttime = -1;
                }
              }
            );
          }
        })(usersList[i]);
      }
    }
  }
  setTimeout(getboard, 500);
};
runpaint();
/* GET home page. */
router.get('/', function (req, res, next) {
  return res.render('index', { arr: JSON.stringify(serverMap), nowuser: usersList.length });
});

router.post('/', function (req, res, next) {
  let flag = 0;
  for (let i = 0; i < usersList.length; i++) {
    if (usersList[i].cookie === req.body.usercookie) {
      flag = 1;
      break;
    }
  }
  if (flag) {
    throw res.send('Cookie已存在！');
  }
  usersList.push({ cookie: req.body.usercookie, lasttime: new Date().getTime() });
  return res.redirect('/');
});

router.get('/task', function (req, res, next) {
  return res.render('task', { nowtask: JSON.stringify(tasksList), nowuser: usersList.length });
});

router.post('/task', function (req, res, next) {
  tasksList = JSON.parse(req.body.task);
  return res.redirect('/task');
});

module.exports = router;
